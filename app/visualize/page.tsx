"use client";

import React, { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { SqlEditor } from '@/components/SqlEditor';
import { DiagramCanvas } from '@/components/DiagramCanvas';
import { useDiagramStore } from '@/store/diagram.store';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
// import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'; 

export default function VisualizePage() {
  const { data: session, status } = useSession();
  const { analyze, save } = useDiagramStore();
  const [saveName, setSaveName] = useState("");
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
        signIn("google");
    }
  }, [status]);

  if (status === "loading") {
      return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>;
  }

  if (!session) {
      return null;
  }

  const handleSave = async () => {
    if(!saveName) return;
    await save(saveName);
    setIsSaveOpen(false);
    setSaveName("");
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Header / Toolbar */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/50 backdrop-blur-md">
        <Link href="/" className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-6">
          SQL Visualizer
        </Link>
        <nav className="flex gap-4 text-sm font-medium text-zinc-400 border-l border-zinc-800 pl-6 h-full items-center">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-zinc-400 mr-4">
                 {session?.user?.image && (
                     <img src={session.user.image} alt="User" className="w-6 h-6 rounded-full" />
                 )}
                 <span>{session?.user?.name}</span>
             </div>
        <div className="flex gap-2">
            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-8 bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white">
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle>Save Diagram</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Give your diagram a name to save it to your dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="col-span-3 bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
                      placeholder="e.g. User Analytics"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleSave} className="bg-blue-600 hover:bg-blue-500">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <button 
                onClick={() => analyze()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
            >
                Run Analysis
            </button>
        </div>
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
