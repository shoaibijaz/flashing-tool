import React, { useRef, useState, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { Line as LineType, Point } from '../types/core';
import { FinishedLines, DrawingPreview } from './canvas';
import { useSettingsStore } from '../store/settingsStore';
import useTaperedStore from '../store/taperedStore';

export interface Canvas2DProps {
    zoom: number;
    panX: number;
    panY: number;
    polyPoints: Point[];
    hoverPoint: Point | null;
    isDrawingMode: boolean;
    drawings: LineType[];
    isLocked: boolean;
    onStageClick: (e: KonvaEventObject<MouseEvent>) => void;
    onStageMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
    onStageMouseLeave: () => void;
    onStageWheel: (e: KonvaEventObject<WheelEvent>) => void;
    onStageMouseDown: (e: KonvaEventObject<MouseEvent>) => void;
    onStageMouseUp: (e: KonvaEventObject<MouseEvent>) => void;
    onContextMenu: (e: KonvaEventObject<MouseEvent>) => void;
    onPointDrag: (pointIndex: number, e: KonvaEventObject<DragEvent>) => void;
    onFinishedLinePointDrag: (lineIdx: number, pointIdx: number, e: KonvaEventObject<DragEvent>) => void;
    onLabelDragMove?: (lineId: string, segmentIndex: number, e: KonvaEventObject<DragEvent>) => void;
    onAngleLabelDragMove?: (lineId: string, vertexIndex: number, e: KonvaEventObject<DragEvent>) => void;
}

const Canvas2D: React.FC<Canvas2DProps> = ({
    zoom,
    panX,
    panY,
    polyPoints,
    hoverPoint,
    isDrawingMode,
    drawings,
    isLocked,
    onStageClick,
    onStageMouseMove,
    onStageMouseLeave,
    onStageWheel,
    onStageMouseDown,
    onStageMouseUp,
    onContextMenu,
    onPointDrag,
    onFinishedLinePointDrag,
    onLabelDragMove,
    onAngleLabelDragMove,
}) => {
    const stageRef = useRef<StageType>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const layerRef = useRef<Konva.Layer | null>(null);

    // Force re-render on mount to ensure proper sizing
    const [isReady, setIsReady] = useState(false);

    // Get tapered state from store
    const { activeTaperedDiagram, canvasMode } = useTaperedStore();

    // Example: Set Konva Layer z-index after mount
    useEffect(() => {
        if (layerRef.current) {
            console.log('Layer ref:', layerRef.current);
            layerRef.current.setZIndex(0); // Set z-index among Konva layers
        } else {
            console.log('Layer ref is still null');
        }
    }, [isReady]);

    // Get settings from store
    const { settings } = useSettingsStore();
    const { canvas } = settings;

    // Get drawings to display based on mode
    const getDisplayDrawings = (): LineType[] => {
        if (canvasMode === 'tapered' && activeTaperedDiagram) {
            // Return tapered diagram as a LineType for canvas rendering
            return [{
                id: activeTaperedDiagram.id,
                points: activeTaperedDiagram.points,
                color: '#2563eb', // Blue color for tapered diagram
                metadata: { isTapered: true }
            }];
        }
        return drawings;
    };

    const displayDrawings = getDisplayDrawings();

    // Canvas dimensions based on actual container size
    const [dimensions, setDimensions] = useState({
        width: 0,
        height: 0
    });


    useEffect(() => {
        const measureContainer = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                // Round to integers to avoid fractional pixel issues in Chrome
                const width = Math.floor(rect.width);
                const height = Math.floor(rect.height);

                setDimensions({ width, height });
                setIsReady(true);
            }
        };

        // Multiple measurement attempts for Chrome compatibility
        const timer1 = setTimeout(measureContainer, 50);
        const timer2 = setTimeout(measureContainer, 100);
        const timer3 = setTimeout(measureContainer, 200);

        // Set up ResizeObserver for responsive updates
        const resizeObserver = new ResizeObserver(() => {
            // Debounce the resize to avoid excessive calls
            setTimeout(measureContainer, 16);
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            resizeObserver.disconnect();
        };
    }, []);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (stageRef.current && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                // Round to integers to avoid fractional pixel issues
                const newWidth = Math.floor(rect.width);
                const newHeight = Math.floor(rect.height);

                setDimensions({ width: newWidth, height: newHeight });
                stageRef.current.width(newWidth);
                stageRef.current.height(newHeight);
                stageRef.current.draw();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // CSS Grid Background Style
    const gridStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: canvas.showGrid ? `
            linear-gradient(to right, #ddd 1px, transparent 1px),
            linear-gradient(to bottom, #ddd 1px, transparent 1px)
        ` : 'none',
        backgroundSize: `${canvas.gridSize}px ${canvas.gridSize}px`,
        opacity: canvas.gridOpacity,
        pointerEvents: 'none',
    };

    // CSS Background Image Style
    const backgroundImageStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: canvas.showBackgroundImage ? `url("${canvas.backgroundImageUrl}")` : 'none',
        backgroundSize: canvas.backgroundImageFit,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        opacity: canvas.backgroundImageOpacity,
        pointerEvents: 'none',
    };

    if (!isReady || dimensions.width === 0 || dimensions.height === 0) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    background: '#e6f3ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                }}
                className="bg-white dark:bg-gray-900"
            >
                <div>Loading canvas...</div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1,
            }}
            className={`bg-white dark:bg-gray-900 ${canvasMode === 'tapered' ? 'border-2 border-blue-300' : ''}`}
        >
            {/* Mode Indicator */}
            {canvasMode === 'tapered' && (
                <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium z-10">
                    Tapered Mode - Angles Preserved
                </div>
            )}


            {/* CSS Background Image */}
            <div style={backgroundImageStyle} />
            {/* CSS Grid Background */}
            <div style={gridStyle} />
            {/* Konva Stage */}
            <Stage
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                scaleX={zoom}
                scaleY={zoom}
                x={panX}
                y={panY}
                onWheel={onStageWheel}
                onClick={onStageClick}
                onMouseMove={onStageMouseMove}
                onMouseLeave={onStageMouseLeave}
                onMouseDown={onStageMouseDown}
                onMouseUp={onStageMouseUp}
                onContextMenu={onContextMenu}
            >
                {/* Drawing Layer */}
                <Layer ref={layerRef}>
                    {/* Finished lines */}
                    <FinishedLines
                        drawings={displayDrawings}
                        isLocked={isLocked}
                        onFinishedLinePointDrag={onFinishedLinePointDrag}
                        onLabelDragMove={onLabelDragMove}
                        onAngleLabelDragMove={onAngleLabelDragMove}
                    />

                    {/* Drawing preview */}
                    <DrawingPreview
                        isDrawingMode={isDrawingMode}
                        polyPoints={polyPoints}
                        hoverPoint={hoverPoint}
                        isLocked={isLocked}
                        onPointDrag={onPointDrag}
                    />
                </Layer>
            </Stage>



        </div>
    );
};

export default Canvas2D;
