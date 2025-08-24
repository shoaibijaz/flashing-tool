import React, { useState } from 'react';
import LayersPanel from './LayersPanel';
import DrawingLabel from './DrawingLabel';
import { Button } from "./ui/button";
import { Undo2, Redo2, Trash2, CheckCircle2, Text, Shapes, Image, Upload, Sparkles, StretchHorizontal } from "lucide-react";
import type { Line } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  onFinish?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  onToolSelect?: (tool: string) => void;
  activeTool?: string;
  isDrawMode?: boolean;
  onToggleTapered?: () => void;
  isTaperedCreated?: boolean;
  activeDiagram?: 'original' | 'tapered';
  setActiveDiagram?: (d: 'original' | 'tapered') => void;
  setTaperedLines?: (lines: Line[] | null) => void;
  setIsTaperedCreated?: (v: boolean) => void;
  hasOriginalDiagram?: boolean;
}

const tools = [
  { key: 'text', icon: <Text className="w-5 h-5" />, label: 'Text' },
  { key: 'shapes', icon: <Shapes className="w-5 h-5" />, label: 'Shapes' },
  { key: 'images', icon: <Image className="w-5 h-5" />, label: 'Images' },
  { key: 'uploads', icon: <Upload className="w-5 h-5" />, label: 'Uploads' },
];

export default function AppLayout({
  children,
  onFinish,
  onUndo,
  onRedo,
  onClear,
  onToolSelect,
  activeTool,
  isDrawMode = false,
  onToggleTapered,
  isTaperedCreated = false,
  activeDiagram = 'original',
  setActiveDiagram,
  setTaperedLines,
  setIsTaperedCreated,
  hasOriginalDiagram = false,
}: AppLayoutProps) {
  const [layersOpen, setLayersOpen] = useState(false);
  const [layersTab, setLayersTab] = useState<'original' | 'tapered' | 'endfolds'>("original");
  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      {/* Top Toolbar */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-blue-500" />
          <span className="font-bold text-lg tracking-tight hidden sm:inline">Flashing Creator</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Tapered toggle button: only show when not in drawing mode and original diagram exists */}
          {!isDrawMode && hasOriginalDiagram && (
            <>
              <Button
                variant="ghost"
                size="default"
                onClick={onToggleTapered}
                disabled={!isTaperedCreated && activeDiagram !== 'original'}
                aria-label={isTaperedCreated ? (activeDiagram === 'original' ? 'Switch to Tapered End 2' : 'Switch to Tapered End 1') : 'Make Tapered'}
              >
                <StretchHorizontal className="w-5 h-5" />
                <span className="hidden sm:inline ml-1">
                  {!isTaperedCreated ? 'Make Tapered' : (activeDiagram === 'original' ? 'Tapered End 2' : 'Tapered End 1')}
                </span>
              </Button>
              {/* Remove Tapered button: only show when tapered is created, next to Tapered button */}
              {isTaperedCreated && (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => {
                    if (activeDiagram === 'tapered' && typeof setActiveDiagram === 'function') {
                      setActiveDiagram('original');
                    }
                    if (typeof setTaperedLines === 'function') setTaperedLines(null);
                    if (typeof setIsTaperedCreated === 'function') setIsTaperedCreated(false);
                  }}
                  aria-label="Remove Tapered"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span className="hidden sm:inline ml-1 text-red-600">Remove Tapered</span>
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="default" onClick={onUndo} aria-label="Undo">
            <Undo2 className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Undo</span>
          </Button>
          <Button variant="ghost" size="default" onClick={onRedo} aria-label="Redo">
            <Redo2 className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Redo</span>
          </Button>
          <Button
            variant="ghost"
            size="default"
            onClick={() => {
              // Clear tapered
              if (typeof setTaperedLines === 'function') setTaperedLines(null);
              if (typeof setIsTaperedCreated === 'function') setIsTaperedCreated(false);
              if (typeof setActiveDiagram === 'function') setActiveDiagram('original');
              // Clear original drawing via onClear (should reset drawing lines in store)
              if (typeof onClear === 'function') onClear();
            }}
            aria-label="Clear"
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Clear</span>
          </Button>
          {/* Show Finish button only in new drawing mode (isDrawMode === true) */}
          {isDrawMode && (
            <Button
              variant="default"
              size="default"
              onClick={onFinish}
              className="ml-2 text-green-600 [&_svg]:text-green-600"
            >
              <CheckCircle2 className="w-5 h-5 mr-1" />
              <span className="hidden sm:inline">Finish</span>
            </Button>
          )}
          {/* Layers button after Finish */}
          <Button
            variant="ghost"
            size="default"
            onClick={() => setLayersOpen((v) => !v)}
            aria-label="Layers"
          >
            <Shapes className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Layers</span>
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden relative">
        {/* Drawing label: positioned under zoom control, always on top */}
        <div className="absolute right-4 mt-14 z-50">
          <DrawingLabel isTaperedCreated={isTaperedCreated} activeDiagram={activeDiagram} />
        </div>
        {/* Layers side panel */}
        {layersOpen && (
          <LayersPanel
            activeTab={layersTab}
            onTabChange={tab => {
              if (tab === layersTab) return;
              setLayersTab(tab as 'original' | 'tapered' | 'endfolds');
            }}
            onClose={() => setLayersOpen(false)}
          />
        )}
        {/* Sidebar (vertical on desktop, bottom on mobile) */}
        <aside className="hidden md:flex flex-col gap-2 p-2 border-r bg-white/80 backdrop-blur min-w-[60px] z-10">
          {tools.map(tool => (
            <Button
              key={tool.key}
              variant={activeTool === tool.key ? "default" : "ghost"}
              size="icon"
              aria-label={tool.label}
              onClick={() => onToolSelect?.(tool.key)}
              className="mb-1"
            >
              {tool.icon}
            </Button>
          ))}
        </aside>
        {/* Main content area */}
        <main className="flex-1 h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
