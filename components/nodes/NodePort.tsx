import { memo, useState, useCallback } from 'react';
import { NodePort as NodePortDefinition } from '../../types/nodes';

interface NodePortProps {
  port: NodePortDefinition;
  side: 'input' | 'output';
  nodeId: string;
  color: string;
  onMouseDown: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
  onMouseUp: (e: React.MouseEvent, nodeId: string, portId: string, side: 'input' | 'output') => void;
}

function NodePort({ port, side, nodeId, color, onMouseDown, onMouseUp }: NodePortProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMouseDown(e, nodeId, port.id, side);
    },
    [nodeId, port.id, side, onMouseDown]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMouseUp(e, nodeId, port.id, side);
    },
    [nodeId, port.id, side, onMouseUp]
  );

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);

  const isInput = side === 'input';

  return (
    <div
      className={`relative flex items-center ${isInput ? 'justify-start' : 'justify-end'}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative group">
        <div
          className={`w-3 h-3 rounded-full border-2 border-surface-dark-2 ${color} cursor-crosshair hover:scale-125 transition-transform`}
        />
        {showTooltip && (
          <div
            className={`absolute z-50 px-2 py-1 rounded bg-surface-dark-1 text-white text-[10px] whitespace-nowrap pointer-events-none ${
              isInput ? 'left-5 top-1/2 -translate-y-1/2' : 'right-5 top-1/2 -translate-y-1/2'
            }`}
          >
            {port.label}
            <span className="ml-1 text-white/40">{port.dataType}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(NodePort);
