"use client";

import React, { useEffect } from 'react';
import { SqlEditor } from '@/components/SqlEditor';
import { DiagramCanvas } from '@/components/DiagramCanvas';
import { useDiagramStore } from '@/store/diagram.store';
// import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'; // Not executing this yet

// NOTE: checking package.json, we have "radix-ui" but maybe not the "resizable" component installed yet.
// I'll assume we might need to use a standard flex implementation or install a library if complex resizing is needed.
// For now, I'll use a simple Flexbox with 50/50 split to verify integration.
// Wait, package.json has "shadcn" and "radix-ui". I'll try to use a standard split layout using Tailwind.

export default function VisualizePage() {
  const { analyze } = useDiagramStore();

  useEffect(() => {
    // Initial Analysis
    analyze();
  }, [analyze]);

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Header / Toolbar */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/50 backdrop-blur-md">
        <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          SQL Visualizer
        </div>
        <div className="ml-auto flex gap-2">
            <button 
                onClick={() => analyze()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
            >
                Run Analysis
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div className="w-1/2 h-full border-r border-zinc-800 relative">
            <SqlEditor />
        </div>

        {/* Diagram Pane */}
        <div className="w-1/2 h-full bg-zinc-900 relative">
            <DiagramCanvas />
        </div>
      </div>
    </div>
  );
}
