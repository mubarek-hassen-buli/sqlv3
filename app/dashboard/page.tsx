"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Plus, Trash2 } from "lucide-react";

interface Diagram {
  id: string;
  name: string;
  createdAt: string;
  sql: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiagrams = async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/diagrams");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDiagrams(data);
      }
    } catch (error) {
      console.error("Failed to fetch diagrams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("google");
    }
  }, [status]);

  useEffect(() => {
    fetchDiagrams();
  }, [session]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this diagram?")) return;

    try {
      const res = await fetch(`/api/diagrams?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDiagrams(diagrams.filter(d => d.id !== id));
      } else {
        alert("Failed to delete diagram");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-zinc-800 rounded-full mb-4"></div>
            <div className="text-zinc-500">Loading your diagrams...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center px-8 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/" className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mr-8">
          SQL Visualizer
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-zinc-400">
           <Link href="/dashboard" className="text-white">Dashboard</Link>
           <Link href="/visualize" className="hover:text-white transition-colors">Workspace</Link>
        </nav>
        <div className="ml-auto flex items-center gap-4">
             {session?.user?.image && (
                 <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full border border-zinc-700" />
             )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Your Diagrams</h1>
            <Link 
                href="/visualize" 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-sm transition-colors"
            >
                <Plus className="w-4 h-4" />
                New Diagram
            </Link>
        </div>

        {diagrams.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-900/30 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No diagrams yet</h3>
                <p className="text-zinc-500 max-w-sm mx-auto mb-6">Create your first SQL visualization to understand your queries better.</p>
                <Link 
                    href="/visualize" 
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-lg font-medium text-sm transition-colors"
                >
                    Create Diagram
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {diagrams.map((diagram) => (
                    <div key={diagram.id} className="group border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 rounded-xl p-5 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                <Database className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-zinc-500">
                                {new Date(diagram.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-400 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                            {diagram.name}
                        </h3>
                        <p className="text-zinc-500 text-sm mb-4 line-clamp-2 h-10 font-mono bg-zinc-950/50 p-2 rounded border border-white/5 disabled-select">
                            {diagram.sql}
                        </p>
                        <div className="flex gap-2">
                             <Link 
                                href="/visualize" 
                                className="flex-1 text-center py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
                             >
                                Open
                             </Link>
                             <button 
                                onClick={(e) => handleDelete(diagram.id, e)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                title="Delete diagram"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
