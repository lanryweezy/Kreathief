import { supabase } from '../lib/supabase/client';
import { log } from '../utils/log';

export interface PresenceState {
  userId: string;
  userName: string;
  userAvatar: string | null;
  cursor: { x: number; y: number } | null;
  color: string;
  activeLayerId: string | null;
  isTyping: boolean;
  lastSeen: number;
}

export interface LayerChange {
  type: 'update' | 'create' | 'delete' | 'reorder';
  userId: string;
  layerId: string;
  data: any;
  timestamp: number;
}

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F1948A', '#82E0AA', '#F8C471', '#AED6F1', '#D7BDE2',
];

function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

class CollaborationService {
  private channel: any = null;
  private projectId: string | null = null;
  private onPresenceChange: ((users: PresenceState[]) => void) | null = null;
  private onCursorMove: ((userId: string, cursor: { x: number; y: number }) => void) | null = null;
  private onLayerChange: ((change: LayerChange) => void) | null = null;
  private onUserJoined: ((user: PresenceState) => void) | null = null;
  private onUserLeft: ((userId: string) => void) | null = null;
  private cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastCursorBroadcast: { x: number; y: number } | null = null;

  async joinProject(
    projectId: string,
    user: { id: string; name: string; avatar: string | null },
    callbacks: {
      onPresenceChange?: (users: PresenceState[]) => void;
      onCursorMove?: (userId: string, cursor: { x: number; y: number }) => void;
      onLayerChange?: (change: LayerChange) => void;
      onUserJoined?: (user: PresenceState) => void;
      onUserLeft?: (userId: string) => void;
    }
  ): Promise<void> {
    // Leave any existing channel
    await this.leaveProject();

    this.projectId = projectId;
    this.onPresenceChange = callbacks.onPresenceChange || null;
    this.onCursorMove = callbacks.onCursorMove || null;
    this.onLayerChange = callbacks.onLayerChange || null;
    this.onUserJoined = callbacks.onUserJoined || null;
    this.onUserLeft = callbacks.onUserLeft || null;

    const channel = supabase.channel(`project:${projectId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceState[] = [];
        for (const key in state) {
          const presences = state[key];
          if (Array.isArray(presences) && presences.length > 0) {
            users.push(presences[0]);
          }
        }
        this.onPresenceChange?.(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        for (const p of newPresences) {
          if (p.userId !== user.id) {
            this.onUserJoined?.(p);
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        for (const p of leftPresences) {
          this.onUserLeft?.(p.userId);
        }
      });

    // Listen for cursor broadcasts
    channel.on('broadcast', { event: 'cursor_move' }, ({ payload }: any) => {
      if (payload.userId !== user.id) {
        this.onCursorMove?.(payload.userId, payload.cursor);
      }
    });

    // Listen for layer change broadcasts
    channel.on('broadcast', { event: 'layer_change' }, ({ payload }: any) => {
      if (payload.userId !== user.id) {
        this.onLayerChange?.(payload as LayerChange);
      }
    });

    // Subscribe and track presence
    const status = await channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          cursor: null,
          color: getColorForUser(user.id),
          activeLayerId: null,
          isTyping: false,
          lastSeen: Date.now(),
        });
      }
    });

    this.channel = channel;
    log.info('[Collaboration] Joined project channel', { projectId, status });
  }

  async leaveProject(): Promise<void> {
    if (this.channel) {
      await this.channel.untrack();
      await supabase.removeChannel(this.channel);
      this.channel = null;
      this.projectId = null;
      this.onPresenceChange = null;
      this.onCursorMove = null;
      this.onLayerChange = null;
      this.onUserJoined = null;
      this.onUserLeft = null;
      if (this.cursorThrottleTimer) {
        clearTimeout(this.cursorThrottleTimer);
        this.cursorThrottleTimer = null;
      }
    }
  }

  // Throttled cursor broadcast (max 10 per second)
  broadcastCursor(cursor: { x: number; y: number }): void {
    if (!this.channel) return;

    this.lastCursorBroadcast = cursor;

    if (this.cursorThrottleTimer) return;

    this.cursorThrottleTimer = setTimeout(() => {
      this.cursorThrottleTimer = null;
      if (this.lastCursorBroadcast && this.channel) {
        this.channel.send({
          type: 'broadcast',
          event: 'cursor_move',
          payload: { cursor: this.lastCursorBroadcast },
        });
      }
    }, 100);
  }

  broadcastLayerChange(change: Omit<LayerChange, 'userId' | 'timestamp'>): void {
    if (!this.channel) return;

    this.channel.send({
      type: 'broadcast',
      event: 'layer_change',
      payload: {
        ...change,
        timestamp: Date.now(),
      },
    });
  }

  async updatePresence(updates: Partial<PresenceState>): Promise<void> {
    if (!this.channel) return;

    const state = this.channel.presenceState();
    const myKey = Object.keys(state).find((key) => {
      const presences = state[key];
      return Array.isArray(presences) && presences.length > 0 && presences[0].userId;
    });

    if (myKey) {
      const current = state[myKey][0];
      await this.channel.track({ ...current, ...updates, lastSeen: Date.now() });
    }
  }

  getOnlineUsers(): PresenceState[] {
    if (!this.channel) return [];
    const state = this.channel.presenceState();
    const users: PresenceState[] = [];
    for (const key in state) {
      const presences = state[key];
      if (Array.isArray(presences) && presences.length > 0) {
        users.push(presences[0]);
      }
    }
    return users;
  }
}

export const collaborationService = new CollaborationService();
