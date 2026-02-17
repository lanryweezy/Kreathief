import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const CommentsPanel: React.FC = () => {
    const { comments, addComment, fetchComments, projectId } = useStore();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock Current User
    const currentUser = {
        id: 'user_current',
        name: 'You',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
    };

    useEffect(() => {
        fetchComments();
    }, [projectId, fetchComments]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        await addComment(newComment, currentUser);
        setNewComment('');
        setIsSubmitting(false);
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white">
            <div className="p-4 border-b border-slate-700">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Comments
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                    Discuss this design with your team.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {comments.length === 0 ? (
                    <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                        <div className="bg-slate-800 p-4 rounded-full mb-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <p>No comments yet.</p>
                        <p className="text-xs">Be the first to start the conversation.</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className={`flex gap-3 ${comment.userId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                            <div className="flex-shrink-0">
                                {comment.userAvatar ? (
                                    <img src={comment.userAvatar} alt={comment.userName} className="w-8 h-8 rounded-full bg-slate-700" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </div>
                                )}
                            </div>
                            <div className={`flex flex-col max-w-[80%] ${comment.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xs font-medium text-slate-300">{comment.userName}</span>
                                    <span className="text-[10px] text-slate-500">{formatTime(comment.timestamp)}</span>
                                </div>
                                <div className={`px-3 py-2 rounded-lg text-sm ${comment.userId === currentUser.id
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                                    }`}>
                                    {comment.text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmitting}
                        className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-transparent disabled:text-slate-600 text-white rounded-full transition-colors"
                    >
                        {isSubmitting ? <span className="animate-spin text-xs inline-block">⌛</span> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommentsPanel;
