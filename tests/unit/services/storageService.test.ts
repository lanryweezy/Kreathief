import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * CLOUD-SYNC VERIFICATION (proving the "hybrid Supabase backend" claim)
 * ---------------------------------------------------------------------
 * The architecture audit asserted Cloud Project Synchronization is "fully
 * complete and running flawlessly": intercept saveProject, authenticate via
 * Supabase, push the AST to `projects`, enforce a 10-project free quota, and
 * fall back to IndexedDB offline. That is a set of FALSIFIABLE behaviours, so
 * we test each one rather than take the adjective on faith.
 *
 * Scope note: these are routing/decision tests for `saveProject` (which branch
 * runs, what payload hits the wire, whether the quota actually blocks). They
 * stub the transport (Supabase client + IndexedDB) so the assertions are about
 * the service's decisions, not third-party I/O.
 */

// --- Transport mocks (hoisted) ------------------------------------------------
const { supabaseMock } = vi.hoisted(() => {
  const upsert = vi.fn();
  const from = vi.fn(() => ({ upsert }));
  return { supabaseMock: { db: { from }, upsert, from } };
});

vi.mock('../../../lib/supabase/client', () => ({ db: supabaseMock.db }));
// Identity adapters: keep the payload fields verbatim so we can assert on them.
vi.mock('../../../lib/supabase/adapters', () => ({
  toDbJson: (x: any) => x,
  toDbProjectState: (x: any) => x,
  toDbCanvasSize: (x: any) => x,
  toDbCanvasFilters: (x: any) => x,
  fromDbProjectState: (x: any) => x,
}));

import { storageService } from '../../../services/storageService';
import type { Project } from '../../../types';

const svc = storageService as any;

// jsdom reports hostname 'localhost', which trips saveProject's dev-only quota
// bypass (import.meta.env.DEV && localhost). Present a production hostname so the
// guard is actually exercised. Restored after every test.
const ORIG_LOCATION = window.location;
const forceProdHost = () =>
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { hostname: 'app.kreathief.com' },
  });

const makeProject = (id: string): Project =>
  ({
    id,
    name: `Project ${id}`,
    state: { layers: [], activeArtboardId: 'a1', canvasSize: { width: 100, height: 100 } },
    createdAt: 0,
    updatedAt: Date.now(),
  }) as unknown as Project;

describe('storageService.saveProject — hybrid cloud sync', () => {
  beforeEach(() => {
    supabaseMock.from.mockClear();
    supabaseMock.upsert.mockClear();
    supabaseMock.upsert.mockResolvedValue({ error: null });

    svc.isOnline = true;
    vi.spyOn(svc, 'getUserId').mockResolvedValue('user-1');
    vi.spyOn(svc, 'getAllProjects').mockResolvedValue([]);
    vi.spyOn(svc, 'saveProjectIndexedDB').mockResolvedValue(undefined);
    vi.spyOn(svc, 'queueSyncOperation').mockResolvedValue(undefined);
    vi.spyOn(svc, 'persistPendingChanges').mockResolvedValue(undefined);
    vi.spyOn(svc, 'setConnectionStatus').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', { configurable: true, writable: true, value: ORIG_LOCATION });
  });

  it('ONLINE + AUTHENTICATED → pushes the AST to `projects` via upsert (onConflict id)', async () => {
    await storageService.saveProject(makeProject('p1'));

    expect(supabaseMock.from).toHaveBeenCalledWith('projects');
    expect(supabaseMock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', user_id: 'user-1', name: 'Project p1' }),
      { onConflict: 'id' }
    );
    // Cloud succeeded → must NOT also write locally / queue.
    expect(svc.saveProjectIndexedDB).not.toHaveBeenCalled();
    expect(svc.queueSyncOperation).not.toHaveBeenCalled();
  });

  it('FREE-TIER QUOTA → a 11th NEW project is rejected before any network call', async () => {
    // Simulate production (isDev=false) so the localhost dev bypass is not taken.
    forceProdHost();
    svc.getAllProjects.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => makeProject(`existing-${i}`))
    );

    await expect(storageService.saveProject(makeProject('brand-new'))).rejects.toThrow(
      /quota|10 projects/i
    );
    expect(supabaseMock.upsert).not.toHaveBeenCalled();
    expect(svc.saveProjectIndexedDB).not.toHaveBeenCalled();
  });

  it('NEGATIVE CONTROL — quota blocks only NEW projects; editing an existing one at the cap is allowed', async () => {
    forceProdHost();
    const atCap = Array.from({ length: 10 }, (_, i) => makeProject(`existing-${i}`));
    svc.getAllProjects.mockResolvedValue(atCap);

    // 'existing-4' is already in the set → not a new project → no quota throw.
    await expect(storageService.saveProject(makeProject('existing-4'))).resolves.toBeUndefined();
    expect(supabaseMock.upsert).toHaveBeenCalled();
  });

  it('OFFLINE (negative control for the cloud claim) → never touches Supabase, persists to IndexedDB + queues sync', async () => {
    svc.isOnline = false;

    await storageService.saveProject(makeProject('p9'));

    expect(supabaseMock.from).not.toHaveBeenCalled();
    expect(svc.saveProjectIndexedDB).toHaveBeenCalledWith(expect.objectContaining({ id: 'p9' }));
    expect(svc.queueSyncOperation).toHaveBeenCalledWith('p9', 'update');
  });

  it('SUPABASE WRITE ERROR → degrades gracefully to IndexedDB instead of throwing', async () => {
    supabaseMock.upsert.mockResolvedValue({ error: { message: 'boom' } });

    await expect(storageService.saveProject(makeProject('p10'))).resolves.toBeUndefined();
    expect(svc.saveProjectIndexedDB).toHaveBeenCalled();
    expect(svc.queueSyncOperation).toHaveBeenCalledWith('p10', 'update');
  });

  it('ANONYMOUS (online but no session) → keeps the write local, no cloud call', async () => {
    svc.getUserId.mockResolvedValue(null);

    await storageService.saveProject(makeProject('p11'));

    expect(supabaseMock.from).not.toHaveBeenCalled();
    expect(svc.saveProjectIndexedDB).toHaveBeenCalled();
  });
});

describe('storageService — read path, sync-queue flush, conflict resolution', () => {
  beforeEach(() => {
    svc.isOnline = true;
    svc.isSyncing = false;
    svc.pendingChanges = new Map();
    svc._projectsCache = null;
    vi.spyOn(svc, 'getUserId').mockResolvedValue('user-1');
    vi.spyOn(svc, 'setConnectionStatus').mockImplementation(() => {});
    vi.spyOn(svc, 'showToast').mockImplementation(() => {});
    vi.spyOn(svc, 'persistPendingChanges').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getAllProjects OFFLINE → returns local projects sorted newest-first, without a cloud call', async () => {
    svc.isOnline = false;
    const rows = [
      { id: 'a', updatedAt: 100, state: {} },
      { id: 'b', updatedAt: 300, state: {} },
      { id: 'c', updatedAt: 200, state: {} },
    ];
    vi.spyOn(svc, 'getStore').mockResolvedValue({
      getAll: () => {
        const req: any = { result: rows.slice() };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      },
    } as any);

    const out = await storageService.getAllProjects();

    expect(out.map((p: any) => p.id)).toEqual(['b', 'c', 'a']);
    // Negative control: offline read must never hit the cloud.
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });

  it('syncOfflineChanges ONLINE → flushes a queued update to Supabase and empties the queue', async () => {
    svc.pendingChanges.set('p1', { projectId: 'p1', operation: 'update', retryCount: 0 });
    const syncUpd = vi.spyOn(svc, 'syncUpdateToSupabase').mockResolvedValue(undefined);

    await svc.syncOfflineChanges();

    expect(syncUpd).toHaveBeenCalledWith('p1', 'user-1');
    expect(svc.pendingChanges.size).toBe(0);
  });

  it('NEGATIVE CONTROL: syncOfflineChanges OFFLINE → leaves the queue untouched, no flush', async () => {
    svc.isOnline = false;
    svc.pendingChanges.set('p1', { projectId: 'p1', operation: 'update', retryCount: 0 });
    const syncUpd = vi.spyOn(svc, 'syncUpdateToSupabase').mockResolvedValue(undefined);

    await svc.syncOfflineChanges();

    expect(syncUpd).not.toHaveBeenCalled();
    expect(svc.pendingChanges.size).toBe(1);
  });

  it('resolveConflict → newer remote wins and its state is merged in', () => {
    const local: any = { id: 'x', updatedAt: 1000, state: { layers: ['local'] } };
    const remote: any = { updated_at: new Date(2000).toISOString(), state: { layers: ['remote'] } };

    const out = svc.resolveConflict(local, remote);

    expect(out.updatedAt).toBe(2000);
    expect(out.state).toEqual({ layers: ['remote'] });
  });

  it('resolveConflict → newer (or equal) local is kept as-is', () => {
    const local: any = { id: 'x', updatedAt: 5000, state: { layers: ['local'] } };
    const remote: any = { updated_at: new Date(1000).toISOString(), state: { layers: ['remote'] } };

    expect(svc.resolveConflict(local, remote)).toBe(local);
  });
});
