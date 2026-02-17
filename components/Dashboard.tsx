
import React, { useEffect, useState } from 'react';
import { Project, User, CanvasSize } from '../types';
import { Icons } from '../constants';
import { STARTER_TEMPLATES, createProjectFromTemplate } from '../data/templates';
import { ConfirmModal } from './modals/ConfirmModal';
import { CreateProjectModal } from './modals/CreateProjectModal';
import { useStore } from '../store/useStore';

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
  const {
    projects,
    loadAllProjects,
    deleteProject,
    duplicateProject,
    updateProject,
    createProject,
    loadProject
  } = useStore();

  const [sidebarTab, setSidebarTab] = useState<'projects' | 'templates'>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadAllProjects();
  }, [loadAllProjects]);

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
    await deleteProject(deleteConfirm.projectId);
    setDeleteConfirm({ isOpen: false, projectId: null });
  };

  const handleCreateClick = () => {
    if (user.plan === 'free' && projects.length >= 5) {
      onOpenPricing();
      return;
    }
    setCreateModalOpen(true);
  };

  const canCreateMore = user.plan !== 'free' || projects.length < 5;

  const handleDuplicate = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    if (!canCreateMore) {
      onOpenPricing();
      return;
    }
    await duplicateProject(project);
  };

  const startRenaming = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setNewName(project.name);
  };

  const handleRename = async (id: string) => {
    if (!newName.trim()) {
      setEditingProjectId(null);
      return;
    }
    await updateProject(id, { name: newName });
    setEditingProjectId(null);
  };

  const handleStartFromTemplate = async (templateId: string) => {
    if (!canCreateMore) {
      onOpenPricing();
      return;
    }
    const template = STARTER_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newProject = createProjectFromTemplate(template);
    await createProject(newProject.name, newProject.state.canvasSize);
    onOpenProject(projects[0]); // This might be wrong because createProject updates store async.
    // Actually, createProject in store already calls initializeProject.
    // So we just need to tell App.tsx to switch to editor.
    onCreateProject();
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen dashboard-background text-white flex flex-col relative z-0">
      {/* Header */}
      <header className="h-16 bg-[#13161a] border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#7d2ae8] to-[#00c4cc] rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Icons.Magic className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-black text-2xl tracking-tighter text-white">Kreathief</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block group">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#7d2ae8] transition-colors" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search designs"
              className="bg-[#252627] border border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-[#7d2ae8] focus:w-80 transition-all font-medium"
            />
          </div>

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
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-4" role="tablist">
                <button
                  role="tab"
                  aria-selected={sidebarTab === 'projects'}
                  onClick={() => setSidebarTab('projects')}
                  className={`transition-all ${sidebarTab === 'projects' ? 'text-white border-b-2 border-[#7d2ae8] pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  My Projects
                </button>
                <div className="h-6 w-px bg-gray-800" aria-hidden="true" />
                <button
                  role="tab"
                  aria-selected={sidebarTab === 'templates'}
                  onClick={() => setSidebarTab('templates')}
                  className={`transition-all ${sidebarTab === 'templates' ? 'text-white border-b-2 border-[#7d2ae8] pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Templates
                </button>
              </h2>
              <button
                id="create-btn"
                onClick={handleCreateClick}
                className="bg-[#7d2ae8] text-white hover:bg-[#6c1fd1] px-7 py-3 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-lg shadow-purple-900/50 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 border border-white/10"
              >
                <Icons.Plus className="w-4 h-4" /> New Design
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



            {/* All Projects Tab (default) */}
            {sidebarTab === 'projects' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 staggered-entry">
                {/* Create New Card */}
                <div
                  onClick={handleCreateClick}
                  className="aspect-[4/3] glass-card-premium border-2 border-dashed border-gray-700/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#7d2ae8]/50 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-[#7d2ae8]/10 group-hover:text-[#7d2ae8] text-gray-500 shadow-xl group-hover:shadow-[0_0_20px_rgba(125,42,232,0.2)]">
                    <Icons.FolderPlus className="w-8 h-8" />
                  </div>
                  <span className="font-black text-xs text-gray-500 group-hover:text-white uppercase tracking-widest transition-colors">Blank Canvas</span>
                </div>

                {/* Project Cards */}
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => {
                      loadProject(project.id);
                      onOpenProject(project);
                    }}
                    className="group glass-card-premium rounded-2xl overflow-hidden cursor-pointer relative"
                  >
                    <div className="aspect-[4/3] bg-[#13161a] relative overflow-hidden flex items-center justify-center">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div
                          className="w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center bg-gradient-to-br from-[#1e293b] to-[#0f172a]"
                        >
                          <Icons.Magic className="w-12 h-12 text-white/5 opacity-20" />
                        </div>
                      )}

                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0 duration-300">
                        <button
                          onClick={(e) => startRenaming(e, project)}
                          aria-label={`Rename ${project.name}`}
                          className="p-2 bg-black/60 hover:bg-[#7d2ae8] text-white rounded-lg backdrop-blur-md transition-all shadow-lg"
                        >
                          <Icons.Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(e, project)}
                          aria-label={`Duplicate ${project.name}`}
                          className="p-2 bg-black/60 hover:bg-[#00c4cc] text-white rounded-lg backdrop-blur-md transition-all shadow-lg"
                        >
                          <Icons.Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, project.id)}
                          aria-label={`Delete ${project.name}`}
                          className="p-2 bg-black/60 hover:bg-red-500 text-white rounded-lg backdrop-blur-md transition-all shadow-lg"
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-[#1e1e1e]/80 backdrop-blur-md">
                      {editingProjectId === project.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onBlur={() => handleRename(project.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-[#13161a] border border-[#7d2ae8] rounded px-2 py-1 text-sm text-white focus:outline-none"
                        />
                      ) : (
                        <h3 className="font-bold text-sm text-white truncate mb-1 group-hover:text-[#00c4cc] transition-colors">{project.name}</h3>
                      )}
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Icons.History className="w-3 h-3" />
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                        <span className="bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-700/50">
                          {project.state.canvasSize?.width}x{project.state.canvasSize?.height}
                        </span>
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
        onCreate={async (size) => {
          await createProject(size.name || 'Untitled Design', size);
          onCreateProject();
          setCreateModalOpen(false);
        }}
      />
    </div>
  );
};
