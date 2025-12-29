"use client";

import React, { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { SqlEditor } from '@/components/SqlEditor';
import { DiagramCanvas } from '@/components/DiagramCanvas';
import { useDiagramStore } from '@/store/diagram.store';
// import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'; 

export default function VisualizePage() {
  const { data: session, status } = useSession();
  const { analyze, save } = useDiagramStore();

  useEffect(() => {
    if (status === "unauthenticated") {
        signIn("google");
    }
  }, [status]);

  useEffect(() => {
    // Initial Analysis
    if (session) analyze();
  }, [analyze, session]);

  if (status === "loading") {
      return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>;
  }

  if (!session) {
      return null;
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Header / Toolbar */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/50 backdrop-blur-md">
        <div className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          SQL Visualizer
        </div>
        <div className="ml-6 flex items-center gap-2 text-sm text-zinc-400">
             {session?.user?.image && (
                 <img src={session.user.image} alt="User" className="w-6 h-6 rounded-full" />
             )}
             <span>{session?.user?.name}</span>
        </div>
        <div className="ml-auto flex gap-2">
            <button
                onClick={() => {
                    const name = prompt("Enter diagram name", "My Query");
                    if(name) {
                        save(name);
                    }
                }} 
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm font-medium transition-colors"
            >
                Save
            </button>
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
