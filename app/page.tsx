import Link from "next/link";
import { ArrowRight, Database, Share2, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 h-16 flex items-center border-b border-white/5 backdrop-blur-sm">
          <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            SQL Visualizer
          </div>
          <nav className="ml-auto flex gap-6 text-sm font-medium text-zinc-400">
            <Link href="https://github.com/mubarek-hassen-buli/sqlv3" className="hover:text-white transition-colors">GitHub</Link>
            <Link href="/visualize" className="hover:text-white transition-colors">Docs</Link>
          </nav>
          <div className="ml-6">
             <Link 
                href="/visualize"
                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
             >
                Get Started
             </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                v1.0 is now live
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mb-6">
                Understand your SQL <br/>
                <span className="text-zinc-500">before you run it.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
                Visualize execution flows, debug complex joins, and optimize query performance with our enterprise-grade semantic analysis engine.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-sm sm:max-w-none">
                <Link 
                    href="/visualize"
                    className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-white transition-all hover:scale-105 active:scale-95"
                >
                    Try Visualizer
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                    href="https://github.com/mubarek-hassen-buli/sqlv3"
                    className="flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl font-medium text-zinc-300 transition-colors"
                >
                    View Source
                </Link>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl w-full px-4 text-left">
                <FeatureCard 
                    icon={<Database className="w-6 h-6 text-blue-400" />}
                    title="Semantic Analysis"
                    desc="Deep understanding of SQL logic, not just syntax. Detects implicit joins, lateral dependencies, and more."
                />
                <FeatureCard 
                    icon={<Zap className="w-6 h-6 text-purple-400" />}
                    title="Real-time Layout"
                    desc="Powered by ELK.js, our engine calculates optimal node positions and edge routing in milliseconds."
                />
                <FeatureCard 
                    icon={<Share2 className="w-6 h-6 text-green-400" />}
                    title="Cloud Persistence"
                    desc="Save your diagrams to the cloud securely. Share insights with your team instantly."
                />
            </div>
        </main>

        <footer className="border-t border-white/5 py-8 text-center text-zinc-500 text-sm">
            © 2025 SQL Visualizer. Built with Next.js, Neon, and Drizzle.
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="mb-4 p-3 bg-white/5 w-fit rounded-lg">
                {icon}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-zinc-200">{title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
                {desc}
            </p>
        </div>
    );
}