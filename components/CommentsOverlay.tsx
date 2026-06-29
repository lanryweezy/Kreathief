import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { Icons } from '../constants';
import { haptics } from '../utils/haptics';

interface CommentsOverlayProps {
  zoom: number;
}

export const CommentsOverlay: React.FC<CommentsOverlayProps> = ({ zoom }) => {
  // ⚡ Bolt Optimization: Use useShallow with specific selectors to prevent the component from
  // unnecessarily re-rendering on unrelated global state updates (e.g., cursor movement or tool changes).
  // Impact: Improves canvas interaction performance by eliminating wasteful re-renders.
  const { projects, projectId, addCanvasComment, resolveCanvasComment, deleteCanvasComment } = useStore(
    useShallow((state) => ({
      projects: state.projects,
      projectId: state.projectId,
      addCanvasComment: state.addCanvasComment,
      resolveCanvasComment: state.resolveCanvasComment,
      deleteCanvasComment: state.deleteCanvasComment,
    }))
  );
  const project = projects.find((p) => p.id === projectId);

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentPos, setNewCommentPos] = useState<{ x: number; y: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // Dummy user for now, in a real app this comes from auth
  const currentUser = { name: 'Demo User' };

  if (!project) {
    return null;
  }

  const comments = project.comments || [];

  const handleAddComment = () => {
    if (!newCommentPos || !newCommentText.trim()) {
      return;
    }
    addCanvasComment(newCommentPos.x, newCommentPos.y, newCommentText, currentUser);
    setNewCommentPos(null);
    setNewCommentText('');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow placing comments if we click directly on the overlay background
    if (e.target !== e.currentTarget) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setNewCommentPos({ x, y });
    setActiveCommentId(null);
  };

  return (
    <div
      className="absolute inset-0 z-[1000] pointer-events-auto"
      onClick={handleCanvasClick}
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        width: project.state.canvasSize?.width || 1080,
        height: project.state.canvasSize?.height || 1080,
      }}
    >
      {comments.map((comment, i) => (
        <div
          key={comment.id}
          className="absolute"
          style={{
            left: comment.x,
            top: comment.y,
            transform: `scale(${1 / zoom}) translate(-50%, -100%)`, // Scale inversely to zoom so it stays fixed size
            transformOrigin: 'bottom center',
          }}
          onClick={(e) => {
            e.stopPropagation();
            haptics.selection();
            setActiveCommentId(comment.id === activeCommentId ? null : comment.id);
            setNewCommentPos(null);
          }}
        >
          {/* Pin Container with larger hit area */}
          <div className="w-12 h-12 flex items-center justify-center cursor-pointer group pointer-events-auto">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 transition-transform ${
                comment.resolved
                  ? 'bg-gray-500 border-white/50 opacity-70 group-hover:opacity-100'
                  : 'bg-brand-600 border-white group-hover:scale-110'
              }`}
            >
              {comment.resolved ? <Icons.Check className="w-4 h-4" /> : i + 1}
            </div>

            {/* Popout */}
            {activeCommentId === comment.id && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 text-left font-sans z-[1001]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-accent flex items-center justify-center text-[10px] font-bold text-white">
                      {comment.author.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-gray-800">{comment.author.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{comment.content}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => resolveCanvasComment(comment.id)}
                    className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Icons.Check className="w-3.5 h-3.5" />
                    {comment.resolved ? 'Reopen' : 'Resolve'}
                  </button>
                  <button
                    onClick={() => deleteCanvasComment(comment.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors"
                    aria-label="Delete comment"
                  >
                    <Icons.Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* New Comment Input */}
      {newCommentPos && (
        <div
          className="absolute"
          style={{
            left: newCommentPos.x,
            top: newCommentPos.y,
            transform: `scale(${1 / zoom}) translate(-50%, -100%)`,
            transformOrigin: 'bottom center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-accent border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
              <Icons.Plus className="w-4 h-4" />
            </div>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-[1001]">
              <textarea
                autoFocus
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="w-full h-20 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-brand-600"
              />
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => setNewCommentPos(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={!newCommentText.trim()}
                  className="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg shadow-md disabled:opacity-50 transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
