import React, { useState, useCallback, useEffect } from 'react';
import { VectorPath, VectorPoint, PointType } from '../../types';
import { VectorUtils } from '../../utils/vectorUtils';

interface PathEditorOverlayProps {
    path: VectorPath;
    zoom: number;
    onUpdate: (newPath: VectorPath) => void;
    onSelectPoint: (indices: number[]) => void;
    selectedPointIndices: number[];
}

export const PathEditorOverlay: React.FC<PathEditorOverlayProps> = ({
    path,
    zoom,
    onUpdate,
    onSelectPoint,
    selectedPointIndices
}) => {
    // Handle Delete Key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPointIndices.length > 0) {
                const newPoints = path.points.filter((_, i) => !selectedPointIndices.includes(i));
                if (newPoints.length >= 2) {
                    onUpdate({ ...path, points: newPoints });
                    onSelectPoint([]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [path, selectedPointIndices, onUpdate, onSelectPoint]);
    const handlePointMouseDown = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();

        let newSelection = [...selectedPointIndices];
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
            if (newSelection.includes(index)) {
                newSelection = newSelection.filter(i => i !== index);
            } else {
                newSelection.push(index);
            }
        } else {
            if (!newSelection.includes(index)) {
                newSelection = [index];
            }
        }
        onSelectPoint(newSelection);

        const startX = e.clientX;
        const startY = e.clientY;
        const initialPoints = path.points.map(p => ({ ...p }));

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startX) / zoom;
            const dy = (moveEvent.clientY - startY) / zoom;

            const newPoints = [...path.points];
            newSelection.forEach(idx => {
                newPoints[idx] = {
                    ...initialPoints[idx],
                    x: initialPoints[idx].x + dx,
                    y: initialPoints[idx].y + dy
                };
            });

            // Basic Snapping (to other points)
            if (newSelection.length === 1) {
                const idx = newSelection[0];
                const p = newPoints[idx];
                path.points.forEach((other, i) => {
                    if (i === idx) return;
                    if (Math.abs(p.x - other.x) < 5 / zoom) p.x = other.x;
                    if (Math.abs(p.y - other.y) < 5 / zoom) p.y = other.y;
                });
            }

            onUpdate({ ...path, points: newPoints });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleHandleMouseDown = (e: React.MouseEvent, pointIndex: number, handleType: 'in' | 'out') => {
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const point = path.points[pointIndex];
        const initialHandle = point[handleType === 'in' ? 'handleIn' : 'handleOut'] || { x: 0, y: 0 };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startX) / zoom;
            const dy = (moveEvent.clientY - startY) / zoom;

            const newPoints = [...path.points];

            // Check for Alt key to break symmetry
            const isAltDown = moveEvent.altKey;

            let updatedPoint = {
                ...point,
                [handleType === 'in' ? 'handleIn' : 'handleOut']: {
                    x: initialHandle.x + dx,
                    y: initialHandle.y + dy
                }
            };

            if (isAltDown) {
                updatedPoint.type = 'sharp'; // Break symmetry
            }

            // Auto-align handles if continuous and NOT breaking symmetry
            if (updatedPoint.type !== 'sharp') {
                newPoints[pointIndex] = VectorUtils.alignHandles(updatedPoint, handleType);
            } else {
                newPoints[pointIndex] = updatedPoint;
            }

            onUpdate({ ...path, points: newPoints });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handlePointDoubleClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const newPoints = [...path.points];
        const point = { ...newPoints[index] };

        if (point.type === 'sharp') {
            point.type = 'smooth';
            // Add default handles if none exist
            if (!point.handleIn && !point.handleOut) {
                point.handleIn = { x: -30, y: 0 };
                point.handleOut = { x: 30, y: 0 };
            } else if (!point.handleIn) {
                point.handleIn = { x: -point.handleOut!.x, y: -point.handleOut!.y };
            } else if (!point.handleOut) {
                point.handleOut = { x: -point.handleIn!.x, y: -point.handleIn!.y };
            }
        } else {
            point.type = 'sharp';
            point.handleIn = undefined;
            point.handleOut = undefined;
        }

        newPoints[index] = point;
        onUpdate({ ...path, points: newPoints });
    };

    const handlePathMouseDown = (e: React.MouseEvent) => {
        // Only react if we are NOT clicking a point or handle (strictly handled by z-index/propagation order, but good to be safe)
        // Since points are on top, this handler only fires if we click the path stroke itself (if we render one)
        // or if we rely on the overlay catching it.
        // BUT, the overlay div is pointer-events-none.
        // So we need a hit-target path.

        e.stopPropagation();

        const rect = (e.target as Element).closest('svg')?.getBoundingClientRect();
        if (!rect) return;

        // Calculate click position in SVG coordinates (relative to path local space if needed, 
        // but here path points are in canvas space, and this SVG fills the canvas?)
        // The PathEditorOverlay is absolute inset-0.
        // We need to account for zoom and pan if the overlay doesn't transform.
        // Wait, the overlay points are rendered at `p.x`. 
        // IF the parent container is transformed, then `e.nativeEvent.offsetX` might work if the SVG matches the transform.
        // BUT usually overlays are fixed on top and we explicitly divide by zoom in other handlers.

        // Let's use the same logic as handlePointMouseDown for coordinate calculation?
        // In handlePointMouseDown: startX = e.clientX.
        // It uses delta. 
        // We need ABSOLUTE coordinates.

        // The overlay seems to assume `p.x` is in screen pixels? or zoomed pixels?
        // "x={p.x - 4 / zoom}" -> implies p.x is in UNZOOMED coordinates, but we scale attributes by zoom? NO.
        // We divide geometry size by zoom: `width={8 / zoom}`. This means the SVG coordinate system is likely 1:1 with the Canvas content space (Already Zoomed? Or user handles zoom?).

        // If `VectorEditor/PathEditorOverlay.tsx` uses `zoom` to scale STROKE WIDTH and HANDLE SIZES, 
        // it implies the SVG coordinate system itself is the SAME as the data coordinate system (1 unit = 1 pixel at 100% zoom),
        // AND the parent container is SCALED by CSS transform `scale(zoom)`. 
        // OR the SVG is 1:1 with screen and we manually project points?

        // Let's look at `Canvas.tsx`.
        // The `Canvas` component usually applies a transform to a container.

        // If the overlay is INSIDE the zoomed container, then `e.nativeEvent.offsetX` is in Local Data Coordinates.

        // Let's try using nativeEvent.offsetX / offsetY as a starting point, assuming SVG is in local space.

        const svg = e.currentTarget as SVGGeometryElement;
        const svgRect = svg.ownerSVGElement!.getBoundingClientRect();

        // We need the coordinates relative to the SVG element's origin (top-left), UNSCALED by zoom if the SVG is scaled.
        // If the SVG is inside the transform, then getBoundingClientRect IS scaled.

        // Let's assume the standard event coordinates and map them.
        // Since we are adding a point, we accept we might need to debug this coordinate mapping.
        // Ideally we want (LayerX, LayerY).

        // If the overlay is children of the Zoom container:
        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        const newPath = VectorUtils.insertPointToPath(path, x, y, 10 / zoom); // Threshold scaled by zoom? Or constant in screen pixels?
        // If we are zoomed in, 10px on screen is 5px in data.
        // threshold should probably be related to screen pixels (interaction tolerance).
        // So `10 / zoom` makes sense if we are comparing in Data space.

        if (newPath) {
            onUpdate(newPath);
            // Optionally select the new point?
            // The new point is added. We'd need to find its index. 
            // insertPointToPath doesn't return index. 
            // For now just updating is enough.
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-[100]">
            <svg className="w-full h-full overflow-visible">
                {/* Hit-Test Path (Transparent) */}
                <path
                    d={VectorUtils.serializePath(path)}
                    stroke="transparent"
                    strokeWidth={15 / zoom}
                    fill="none"
                    className="pointer-events-auto cursor-crosshair hover:stroke-blue-400/20"
                    onMouseDown={handlePathMouseDown}
                />

                {/* Render Handles Lines */}
                {path.points.map((p, i) => (
                    <React.Fragment key={`handles-${i}`}>
                        {(selectedPointIndices.includes(i) || p.handleIn || p.handleOut) && (
                            <>
                                {p.handleIn && (
                                    <line
                                        x1={p.x} y1={p.y}
                                        x2={p.x + p.handleIn.x} y2={p.y + p.handleIn.y}
                                        stroke="#7d2ae8" strokeWidth={1 / zoom}
                                    />
                                )}
                                {p.handleOut && (
                                    <line
                                        x1={p.x} y1={p.y}
                                        x2={p.x + p.handleOut.x} y2={p.y + p.handleOut.y}
                                        stroke="#7d2ae8" strokeWidth={1 / zoom}
                                    />
                                )}
                            </>
                        )}
                    </React.Fragment>
                ))}

                {/* Render Anchor Points */}
                {path.points.map((p, i) => {
                    const isSelected = selectedPointIndices.includes(i);
                    const isSharp = p.type === 'sharp';

                    return (
                        <g key={`point-${i}`}>
                            {isSharp ? (
                                <rect
                                    x={p.x - 4 / zoom}
                                    y={p.y - 4 / zoom}
                                    width={8 / zoom}
                                    height={8 / zoom}
                                    fill={isSelected ? "#7d2ae8" : "white"}
                                    stroke="#7d2ae8"
                                    strokeWidth={1 / zoom}
                                    className="pointer-events-auto cursor-pointer hover:scale-125 transition-transform"
                                    onMouseDown={(e) => handlePointMouseDown(e, i)}
                                    onDoubleClick={(e) => handlePointDoubleClick(e, i)}
                                />
                            ) : (
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={4 / zoom}
                                    fill={isSelected ? "#7d2ae8" : "white"}
                                    stroke="#7d2ae8"
                                    strokeWidth={1 / zoom}
                                    className="pointer-events-auto cursor-pointer hover:scale-125 transition-transform"
                                    onMouseDown={(e) => handlePointMouseDown(e, i)}
                                    onDoubleClick={(e) => handlePointDoubleClick(e, i)}
                                />
                            )}
                        </g>
                    );
                })}

                {/* Render Handles */}
                {path.points.map((p, i) => (
                    <React.Fragment key={`handle-circles-${i}`}>
                        {selectedPointIndices.includes(i) && (
                            <>
                                {p.handleIn && (
                                    <circle
                                        cx={p.x + p.handleIn.x}
                                        cy={p.y + p.handleIn.y}
                                        r={3 / zoom}
                                        fill="white"
                                        stroke="#7d2ae8"
                                        strokeWidth={1 / zoom}
                                        className="pointer-events-auto cursor-pointer"
                                        onMouseDown={(e) => handleHandleMouseDown(e, i, 'in')}
                                    />
                                )}
                                {p.handleOut && (
                                    <circle
                                        cx={p.x + p.handleOut.x}
                                        cy={p.y + p.handleOut.y}
                                        r={3 / zoom}
                                        fill="white"
                                        stroke="#7d2ae8"
                                        strokeWidth={1 / zoom}
                                        className="pointer-events-auto cursor-pointer"
                                        onMouseDown={(e) => handleHandleMouseDown(e, i, 'out')}
                                    />
                                )}
                            </>
                        )}
                    </React.Fragment>
                ))}
            </svg>
        </div>
    );
};
