"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Database, Zap, Sparkles, Layout, MousePointer2, CheckCircle2 } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 h-16 flex items-center border-b border-white/5 backdrop-blur-md sticky top-0 bg-zinc-950/50">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="ml-auto font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Documentation
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="flex items-center gap-3 text-blue-400 mb-4">
              <BookOpen className="w-6 h-6" />
              <span className="text-sm font-bold tracking-widest uppercase">Overview</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Master SQL <br/>
              <span className="text-zinc-500">Visualization & Analysis</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
              SQL Visualizer is an enterprise-grade platform designed to help developers and data engineers 
              understand, debug, and optimize complex SQL queries through semantic data-flow visualization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Core Concepts */}
            <section id="concepts">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Core Concepts
              </h2>
              <div className="space-y-8">
                <DocItem 
                  title="Semantic Data Flow" 
                  content="Unlike traditional tools that visualize SQL syntax, our engine models the logical data flow. We use a Relation → Operator → Relation pattern to show how data is transformed at every step."
                />
                <DocItem 
                  title="Operator Nodes" 
                  content="Transformation steps like JOIN, FILTER, and AGGREGATE are represented as interactive operator nodes. Hovering over them reveals human-friendly explanations and technical logic."
                />
                <DocItem 
                  title="Schema Propagation" 
                  content="The visualizer automatically infers schema evolution. You can see which columns are added, removed, or transformed at any stage of the execution plan."
                />
              </div>
            </section>

            {/* Features */}
            <section id="features">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Key Features
              </h2>
              <div className="space-y-6">
                <FeatureItem icon={<MousePointer2 className="w-4 h-4" />} title="Interactive Canvas" desc="Pan, zoom, and drag nodes to explore complex query paths with ease." />
                <FeatureItem icon={<Sparkles className="w-4 h-4" />} title="AI Explanations" desc="Deep integration with Gemini AI provides natural language insights into complex query logic." />
                <FeatureItem icon={<Layout className="w-4 h-4" />} title="Auto-Layout" desc="Powered by ELK.js, ensuring your diagrams are always perfectly organized regardless of complexity." />
                <FeatureItem icon={<CheckCircle2 className="w-4 h-4" />} title="Real-time Validation" desc="Instant feedback on SQL syntax and logical planning errors as you type." />
              </div>
            </section>
          </div>

          {/* User Guide Section */}
          <section className="mt-20 p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StepCard num="01" title="Write SQL" desc="Paste your query into the professional Monaco-based editor." />
                <StepCard num="02" title="Analyze" desc="Click 'Run Analysis' to generate the semantic execution DAG." />
                <StepCard num="03" title="Explore" desc="Interact with the plan, hover for details, and use AI to understand deep logic." />
            </div>
            <div className="mt-10 flex justify-center">
                 <Link 
                    href="/visualize"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all"
                 >
                    Start Visualizing
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                 </Link>
            </div>
          </section>
        </main>

        <footer className="mt-auto border-t border-white/5 py-8 text-center text-zinc-500 text-sm">
            © 2025 SQL Visualizer Documentation
        </footer>
      </div>
    </div>
  );
}

function DocItem({ title, content }: { title: string, content: string }) {
    return (
        <div className="group">
            <h3 className="text-lg font-semibold text-zinc-200 mb-2 group-hover:text-blue-400 transition-colors">{title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{content}</p>
        </div>
    );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
            <div className="mt-1 p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-white">
                {icon}
            </div>
            <div>
                <h4 className="font-semibold text-zinc-200 text-sm mb-1">{title}</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function StepCard({ num, title, desc }: { num: string, title: string, desc: string }) {
    return (
        <div className="relative">
            <div className="text-4xl font-black text-white/5 absolute -top-4 -left-2 select-none">{num}</div>
            <h4 className="text-lg font-bold text-zinc-200 mb-2 relative z-10">{title}</h4>
            <p className="text-zinc-400 text-sm relative z-10">{desc}</p>
        </div>
    );
}
