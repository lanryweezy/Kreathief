import React from 'react';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../../constants';
import { PanelErrorBoundary } from './PanelErrorBoundary';

export const CommentsPanel: React.FC = () => {
  const { projects, projectId, resolveCanvasComment, deleteCanvasComment } = useStore(
    useShallow((state) => ({
      projects: state.projects,
      projectId: state.projectId,
      resolveCanvasComment: state.resolveCanvasComment,
      deleteCanvasComment: state.deleteCanvasComment,
    }))
  );
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return null;
  }

  const comments = project.comments || [];
  const openComments = comments.filter((c) => !c.resolved).sort((a, b) => b.createdAt - a.createdAt);
  const resolvedComments = comments.filter((c) => c.resolved).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col h-full bg-[#13161a]">
      <div className="p-4 border-b border-gray-700 bg-[#13161a] sticky top-0 z-10">
        <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
          <Icons.MessageSquare className="w-5 h-5 text-accent" />
          Comments
        </h3>
        <p className="text-xs text-gray-400">Collaborate with your team</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-gray-500 pt-12">
            <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
              <Icons.MessageSquare className="w-8 h-8 opacity-50" />
            </div>
            <div>
              <p className="font-bold text-gray-400 mb-1">No comments yet</p>
              <p className="text-xs max-w-[200px]">Click anywhere on the canvas to add a comment or tag someone.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Open Comments */}
            {openComments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  Open ({openComments.length})
                </h4>
                <div className="space-y-3">
                  {openComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-surface-dark-3 border border-gray-700 rounded-xl p-3 shadow-md group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-accent flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            {comment.author.name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-white">{comment.author.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{comment.content}</p>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => resolveCanvasComment(comment.id)}
                          className="flex-1 px-3 py-1.5 bg-brand-600/10 hover:bg-brand-600/20 border border-brand-600/30 text-[#e9d5ff] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Icons.Check className="w-3.5 h-3.5" />
                          Resolve
                        </button>
                        <button
                          onClick={() => deleteCanvasComment(comment.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-lg transition-colors"
                        >
                          <Icons.Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Comments */}
            {resolvedComments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2 mt-6">
                  <Icons.Check className="w-3.5 h-3.5 text-gray-500" />
                  Resolved ({resolvedComments.length})
                </h4>
                <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                  {resolvedComments.map((comment) => (
                    <div key={comment.id} className="bg-transparent border border-gray-800 rounded-xl p-3 group">
                      <div className="flex justify-between items-start mb-2 opacity-70">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-400">
                            {comment.author.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-gray-400">{comment.author.name}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 line-through decoration-gray-700">{comment.content}</p>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => resolveCanvasComment(comment.id)}
                          className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Icons.RefreshCw className="w-3.5 h-3.5" />
                          Reopen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function CommentsPanelWrapped() {
  return (
    <PanelErrorBoundary panelName="Comments">
      <CommentsPanel />
    </PanelErrorBoundary>
  );
}
