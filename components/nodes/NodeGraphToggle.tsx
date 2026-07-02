import React from 'react';

interface NodeGraphToggleProps {
  onClick: () => void;
  isOpen: boolean;
}

export const NodeGraphToggle: React.FC<NodeGraphToggleProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        isOpen
          ? 'bg-[#7D2AE8] text-white shadow-lg shadow-[#7D2AE8]/25'
          : 'bg-surface-dark-3 border border-white/10 text-gray-300 hover:text-white hover:border-white/20'
      }`}
    >
      {isOpen ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Close</span>
        </>
      ) : (
        <>
          <span className="text-sm">⚡</span>
          <span>Workflows</span>
        </>
      )}
    </button>
  );
};
