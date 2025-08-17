import React from 'react';
import { Button } from "./ui/button";
import { Undo2, Redo2, Trash2, CheckCircle2, Text, Shapes, Image, Upload, Sparkles } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  onFinish?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  onToolSelect?: (tool: string) => void;
  activeTool?: string;
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
}: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      {/* Top Toolbar */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-white/80 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-blue-500" />
          <span className="font-bold text-lg tracking-tight hidden sm:inline">Flashing Creator</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="default" onClick={onUndo} aria-label="Undo">
            <Undo2 className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Undo</span>
          </Button>
          <Button variant="ghost" size="default" onClick={onRedo} aria-label="Redo">
            <Redo2 className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Redo</span>
          </Button>
          <Button variant="ghost" size="default" onClick={onClear} aria-label="Clear">
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline ml-1">Clear</span>
          </Button>
          <Button variant="default" size="default" onClick={onFinish} className="ml-2">
            <CheckCircle2 className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Finish</span>
          </Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
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
        {/* Main content (canvas area) */}
        <main className="flex-1 flex flex-col items-stretch overflow-auto relative">
          {children}
        </main>
      </div>
      {/* Bottom toolbar for mobile */}
      <nav className="flex md:hidden items-center justify-around border-t bg-white/80 backdrop-blur p-2 z-10">
        {tools.map(tool => (
          <Button
            key={tool.key}
            variant={activeTool === tool.key ? "default" : "ghost"}
            size="icon"
            aria-label={tool.label}
            onClick={() => onToolSelect?.(tool.key)}
          >
            {tool.icon}
          </Button>
        ))}
      </nav>
    </div>
  );
}
