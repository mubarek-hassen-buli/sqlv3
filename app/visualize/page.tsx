"use client";

import React, { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { SqlEditor } from '@/components/SqlEditor';
import { DiagramCanvas } from '@/components/DiagramCanvas';
import { useDiagramStore } from '@/store/diagram.store';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { LogOut, ChevronDown, Sparkles, X } from "lucide-react";

export default function VisualizePage() {
  const { data: session, status } = useSession();
  const { analyze, save, sql, plan } = useDiagramStore();
  const [saveName, setSaveName] = useState("");
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  
  // Explanation state
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

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

  const handleExplain = async () => {
    if (!sql || !plan) return;
    
    setIsExplaining(true);
    setShowExplanation(true);
    setExplanation(null);
    
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, plan })
      });
      
      if (!res.ok) throw new Error('Failed to explain');
      
      const data = await res.json();
      setExplanation(data.explanation);
    } catch (err) {
      console.error('Explain error:', err);
      setExplanation('Failed to generate explanation. Please try again.');
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Header / Toolbar */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/50 backdrop-blur-md">
        <Link href="/" className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-6">
          SQL Visualizer
        </Link>
        <nav className="flex gap-5 text-sm font-medium text-zinc-400 border-l border-zinc-800 ml-6 pl-6 h-full items-center">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors text-zinc-500">
              Docs
            </Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
             {/* Profile Dropdown */}
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800">
                        {session?.user?.image && (
                            <img src={session.user.image} alt="User" className="w-6 h-6 rounded-full" />
                        )}
                        <span>{session?.user?.name}</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-zinc-900 border-zinc-800 text-white">
                    <DropdownMenuLabel>
                        <div className="text-sm font-medium truncate">{session?.user?.name}</div>
                        <div className="text-xs text-zinc-500 truncate font-normal">{session?.user?.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem 
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="text-red-400 focus:text-red-400 focus:bg-zinc-800 cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
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

            {/* Explain Button */}
            <button 
                onClick={handleExplain}
                disabled={!plan || isExplaining}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
                <Sparkles className="w-4 h-4" />
                {isExplaining ? 'Explaining...' : 'Explain'}
            </button>

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
            
            {/* Explanation Panel (Slides in from right) */}
            {showExplanation && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm z-50 overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">AI Explanation</h3>
                    </div>
                    <button 
                      onClick={() => setShowExplanation(false)}
                      className="p-1 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <X className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>
                  
                  {isExplaining ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-zinc-400 animate-pulse flex items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-spin" />
                        Generating explanation...
                      </div>
                    </div>
                  ) : explanation ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {explanation}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
