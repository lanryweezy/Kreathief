
import React, { useEffect, useState } from 'react';
import { Project, User, CanvasSize } from '../types';
import { Icons } from '../constants';
import { STARTER_TEMPLATES, createProjectFromTemplate } from '../data/templates';
import { ConfirmModal } from './modals/ConfirmModal';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { storageService } from '../services/storageService';

interface DashboardProps {
  user: User;
  onOpenProject: (project: Project) => void;
  onCreateProject: () => void;
  onLogout: () => void;
  onOpenPricing: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onOpenProject,
  onCreateProject,
  onLogout,
  onOpenPricing
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'projects' | 'templates' | 'brand' | 'uploads'>('projects');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const saved = await storageService.getAllProjects();
        setProjects(saved.sort((a, b) => b.updatedAt - a.updatedAt));
      } catch (e) {
        console.error('Failed to load projects:', e);
      }
    };
    loadProjects();
  }, []);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; projectId: string | null }>({
    isOpen: false,
    projectId: null
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, projectId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.projectId) return;
    try {
      await storageService.deleteProject(deleteConfirm.projectId);
      const newProjects = projects.filter(p => p.id !== deleteConfirm.projectId);
      setProjects(newProjects);
      setDeleteConfirm({ isOpen: false, projectId: null });
    } catch (e) {
      console.error('Failed to delete project:', e);
    }
  };

  const handleCreateClick = () => {
    if (user.plan === 'free' && projects.length >= 5) {
      onOpenPricing();
      return;
    }
    setCreateModalOpen(true);
  };

  const handleCreateConfirm = (size: CanvasSize) => {
    onCreateProject();
    // Note: The parent component should ideally handle size but here we trigger creation.
    // If onCreateProject in App.tsx takes a size, we should pass it.
    // Assuming standard onCreateProject() for now.
    setCreateModalOpen(false);
  };

  const canCreateMore = user.plan !== 'free' || projects.length < 5;

  const handleStartFromTemplate = (templateId: string) => {
    if (!canCreateMore) {
      onOpenPricing();
      return;
    }
    const template = STARTER_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newProject = createProjectFromTemplate(template);
    storageService.saveProject(newProject).then(() => {
      const updated = [newProject, ...projects];
      setProjects(updated.sort((a, b) => b.updatedAt - a.updatedAt));
      onOpenProject(newProject);
    }).catch(e => {
      console.error('Failed to save template project', e);
    });
  };

  return (
    <div className="min-h-screen bg-[#0e1318] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 bg-[#1e1e1e] border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-lg flex items-center justify-center">
            <Icons.Magic className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Kreathief</span>
        </div>

        <div className="flex items-center gap-4">
          {user.plan === 'free' && (
            <button
              onClick={onOpenPricing}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full transition-all shadow-lg shadow-orange-900/20 flex items-center gap-1.5"
            >
              <Icons.Star className="w-3 h-3" /> Upgrade to Pro
            </button>
          )}

          <div className="h-8 w-px bg-gray-700 mx-2"></div>

          <div className="flex items-center gap-3 group relative cursor-pointer">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold">{user.name}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">{user.plan} Plan</div>
            </div>
            <img src={user.avatar} className="w-9 h-9 rounded-full border-2 border-gray-700 group-hover:border-[#7d2ae8] transition-colors" />

            <div className="absolute right-0 top-full mt-2 w-48 bg-[#252627] border border-gray-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all transform origin-top-right z-50">
              <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 rounded-lg flex items-center gap-2">
                <Icons.MicOff className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#13161a] border-r border-gray-800 p-6 hidden md:block">
          <nav className="space-y-2">
            <button onClick={() => setSidebarTab('projects')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${sidebarTab === 'projects' ? 'bg-[#252627] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icons.Home className={`w-4 h-4 ${sidebarTab === 'projects' ? 'text-[#00c4cc]' : ''}`} /> All Projects
            </button>
            <button onClick={() => setSidebarTab('templates')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${sidebarTab === 'templates' ? 'bg-[#252627] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icons.Templates className={`w-4 h-4 ${sidebarTab === 'templates' ? 'text-[#00c4cc]' : ''}`} /> Templates
            </button>
            <button onClick={() => setSidebarTab('brand')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${sidebarTab === 'brand' ? 'bg-[#252627] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icons.Brand className={`w-4 h-4 ${sidebarTab === 'brand' ? 'text-[#00c4cc]' : ''}`} /> Brand Kits
            </button>
            <button onClick={() => setSidebarTab('uploads')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${sidebarTab === 'uploads' ? 'bg-[#252627] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icons.Uploads className={`w-4 h-4 ${sidebarTab === 'uploads' ? 'text-[#00c4cc]' : ''}`} /> Uploads
            </button>
          </nav>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Storage</h4>
              {user.plan === 'free' && (
                <span className="text-[10px] text-[#7d2ae8] cursor-pointer hover:underline" onClick={onOpenPricing}>Upgrade</span>
              )}
            </div>
            <div className="px-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">{projects.length} / 5 Projects</span>
                <span className="text-gray-500">{user.plan === 'free' ? 'Free Tier' : 'Pro'}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${projects.length >= 5 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (projects.length / 5) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-4">
                <button
                  onClick={() => setSidebarTab('projects')}
                  className={`transition-all ${sidebarTab === 'projects' ? 'text-white border-b-2 border-[#7d2ae8] pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  My Projects
                </button>
                <div className="h-6 w-px bg-gray-800" />
                <button
                  onClick={() => setSidebarTab('templates')}
                  className={`transition-all ${sidebarTab === 'templates' ? 'text-white border-b-2 border-[#7d2ae8] pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Templates
                </button>
              </h2>
              <button
                id="create-btn"
                onClick={handleCreateClick}
                className="bg-[#7d2ae8] hover:bg-[#6b23c5] text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Icons.Magic className="w-4 h-4" /> Create New Design
              </button>
            </div>

            {/* Templates Tab */}
            {sidebarTab === 'templates' && (
              <div className="mb-10">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Icons.Templates className="w-4 h-4 text-[#00c4cc]" />
                  Quick templates
                </h3>
                <div id="templates-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 staggered-entry">
                  {STARTER_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleStartFromTemplate(tmpl.id)}
                      className="group glass-card rounded-xl overflow-hidden text-left shadow-lg"
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-black/40 px-2 py-1 rounded-full absolute top-3 left-3">
                          {tmpl.category}
                        </span>
                        <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                          {tmpl.size.name}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-semibold text-white truncate mb-1">
                          {tmpl.name}
                        </div>
                        <div className="text-[11px] text-gray-400 line-clamp-2">
                          {tmpl.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Kits Tab */}
            {sidebarTab === 'brand' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7d2ae8]/20 to-[#00c4cc]/20 flex items-center justify-center mb-4">
                  <Icons.Brand className="w-8 h-8 text-[#7d2ae8]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Brand Kits</h3>
                <p className="text-sm text-gray-400 max-w-md mb-6">
                  Create and manage your brand kits inside the editor. Define your brand colors, fonts, and logos to keep all your designs consistent.
                </p>
                <button
                  onClick={handleCreateClick}
                  className="bg-[#7d2ae8] hover:bg-[#6b23c5] text-white px-6 py-2.5 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Icons.Magic className="w-4 h-4" /> Open Editor to Manage Brands
                </button>
              </div>
            )}

            {/* Uploads Tab */}
            {sidebarTab === 'uploads' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00c4cc]/20 to-[#7d2ae8]/20 flex items-center justify-center mb-4">
                  <Icons.Uploads className="w-8 h-8 text-[#00c4cc]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Your Uploads</h3>
                <p className="text-sm text-gray-400 max-w-md mb-6">
                  Upload images and assets directly inside the editor. All your uploads are saved and accessible across your projects.
                </p>
                <button
                  onClick={handleCreateClick}
                  className="bg-[#7d2ae8] hover:bg-[#6b23c5] text-white px-6 py-2.5 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Icons.Magic className="w-4 h-4" /> Open Editor to Upload
                </button>
              </div>
            )}

            {/* All Projects Tab (default) */}
            {sidebarTab === 'projects' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 staggered-entry">
                {/* Create New Card */}
                <div
                  onClick={handleCreateClick}
                  className="aspect-[4/3] glass-card border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#7d2ae8] transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:bg-[#7d2ae8]">
                    <Icons.FolderPlus className="w-6 h-6 text-gray-400 group-hover:text-white" />
                  </div>
                  <span className="font-bold text-sm text-gray-400 group-hover:text-white">Start Blank Canvas</span>
                </div>

                {/* Project Cards */}
                {projects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => onOpenProject(project)}
                    className="group glass-card rounded-xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl relative"
                  >
                    <div className="aspect-[4/3] bg-[#13161a] relative overflow-hidden flex items-center justify-center">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div
                          className="w-full h-full opacity-50 group-hover:scale-105 transition-transform duration-500"
                          style={{ backgroundColor: project.state.canvasBackgroundColor }}
                        >
                          {project.state.layers?.some(l => l.type === 'text') && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-white/50 bg-black/50 px-2 rounded">T</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDelete(e, project.id)}
                          className="p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm text-white truncate mb-1">{project.name}</h3>
                      <div className="flex justify-between items-center text-[10px] text-gray-500">
                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                        <span>{project.state.canvasSize?.width}x{project.state.canvasSize?.height}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, projectId: null })}
        onConfirm={confirmDelete}
        title="Delete Project?"
        message="This action cannot be undone. All your carefully crafted layers and AI generations in this design will be permanently removed."
        confirmLabel="Delete Forever"
        variant="danger"
      />

      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={(size) => {
          // We need to pass size back to App.tsx via a new onCreateProjectWithExtra meta if possible
          // But let's check App.tsx first.
          (onOpenProject as any)({
            id: Date.now().toString(),
            name: size.name || 'Untitled Design',
            updatedAt: Date.now(),
            state: {
              canvasSize: size,
              textLayers: [],
              shapeLayers: [],
              imageLayers: [],
              canvasBackgroundColor: '#ffffff',
              canvasFilters: { brightness: 100, contrast: 100, saturation: 100, blur: 0, opacity: 1, vignette: 0, sepia: 0, grayscale: 0 }
            }
          });
          setCreateModalOpen(false);
        }}
      />
    </div>
  );
};
