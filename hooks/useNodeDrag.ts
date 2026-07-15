import { useCallback, useRef } from 'react';
import { useNodeGraph } from './useNodeGraph';

export const useNodeDrag = () => {
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragNodeStart = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const panStartPos = useRef<{ x: number; y: number } | null>(null);
  const panStartViewport = useRef<{ x: number; y: number } | null>(null);
  const spaceDown = useRef(false);

  const {
    viewport,
    moveNode,
    startWireDrag,
    updateWireDrag,
    endWireDrag,
    setViewport,
  } = useNodeGraph();

  const onNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      const node = useNodeGraph.getState().graph.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      dragStartPos.current = { x: e.clientX, y: e.clientY };
      dragNodeStart.current = { x: node.x, y: node.y };

      useNodeGraph.setState({
        dragState: {
          isDragging: true,
          nodeId,
          offset: {
            x: (e.clientX - viewport.x) / viewport.zoom - node.x,
            y: (e.clientY - viewport.y) / viewport.zoom - node.y,
          },
        },
        selectedNodeId: nodeId,
        selectedWireId: null,
      });
    },
    [viewport]
  );

  const onCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { dragState: ds, wireState: ws, viewport: vp, snapToGrid } =
        useNodeGraph.getState();

      if (ds.isDragging && ds.nodeId) {
        let newX = (e.clientX - vp.x) / vp.zoom - ds.offset.x;
        let newY = (e.clientY - vp.y) / vp.zoom - ds.offset.y;

        if (snapToGrid) {
          const gridSize = 20;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        moveNode(ds.nodeId, newX, newY);
        return;
      }

      if (ws.isDrawing) {
        const x = (e.clientX - vp.x) / vp.zoom;
        const y = (e.clientY - vp.y) / vp.zoom;
        updateWireDrag(x, y);
        return;
      }

      if (isPanning.current && panStartPos.current && panStartViewport.current) {
        const dx = e.clientX - panStartPos.current.x;
        const dy = e.clientY - panStartPos.current.y;
        setViewport({
          x: panStartViewport.current.x + dx,
          y: panStartViewport.current.y + dy,
        });
      }
    },
    [moveNode, updateWireDrag, setViewport]
  );

  const onCanvasMouseUp = useCallback(() => {
    const { dragState: ds, wireState: ws, endWireDrag: endWire } =
      useNodeGraph.getState();

    if (ds.isDragging) {
      useNodeGraph.setState({
        dragState: { isDragging: false, nodeId: null, offset: { x: 0, y: 0 } },
      });
    }

    if (ws.isDrawing) {
      endWire(null, null);
    }

    isPanning.current = false;
    panStartPos.current = null;
    panStartViewport.current = null;
    dragStartPos.current = null;
    dragNodeStart.current = null;
  }, []);

  const startWireDraw = useCallback(
    (fromNode: string, fromPort: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const { viewport: vp } = useNodeGraph.getState();
      const x = (e.clientX - vp.x) / vp.zoom;
      const y = (e.clientY - vp.y) / vp.zoom;
      startWireDrag(fromNode, fromPort, x, y);
    },
    [startWireDrag]
  );

  const updateWireDraw = useCallback(
    (e: React.MouseEvent) => {
      const { viewport: vp } = useNodeGraph.getState();
      const x = (e.clientX - vp.x) / vp.zoom;
      const y = (e.clientY - vp.y) / vp.zoom;
      updateWireDrag(x, y);
    },
    [updateWireDrag]
  );

  const endWireDraw = useCallback(
    (toNode: string | null, toPort: string | null) => {
      endWireDrag(toNode, toPort);
    },
    [endWireDrag]
  );

  const onCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
        e.preventDefault();
        isPanning.current = true;
        panStartPos.current = { x: e.clientX, y: e.clientY };
        const { viewport: vp } = useNodeGraph.getState();
        panStartViewport.current = { x: vp.x, y: vp.y };
        return;
      }

      if (e.button === 0) {
        useNodeGraph.setState({
          selectedNodeId: null,
          selectedWireId: null,
        });
      }
    },
    []
  );

  const onWheel = useCallback(
    (e: any) => {
      e.preventDefault();
      const { viewport: vp } = useNodeGraph.getState();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(vp.zoom * delta, 0.1), 5);

      const container = document.querySelector('.node-graph-bg') || (e.currentTarget || e.target) as HTMLElement;
      const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - vp.x) * (newZoom / vp.zoom);
      const newY = mouseY - (mouseY - vp.y) * (newZoom / vp.zoom);

      setViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [setViewport]
  );

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      spaceDown.current = true;
    }
  }, []);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      spaceDown.current = false;
      if (isPanning.current) {
        isPanning.current = false;
        panStartPos.current = null;
        panStartViewport.current = null;
      }
    }
  }, []);

  return {
    handlers: {
      onNodeMouseDown,
      onCanvasMouseMove,
      onCanvasMouseUp,
      onCanvasMouseDown,
      onWheel,
      onKeyDown,
      onKeyUp,
      startWireDraw,
      updateWireDraw,
      endWireDraw,
    },
  };
};
