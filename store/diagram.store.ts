import { create } from 'zustand';
import { analyzeSql } from '@/lib/sql/analyze';
import { layoutGraph } from '@/lib/graph/layout';
import { ExecutionDAG } from '@/lib/sql/operators';
import { LayoutGraph } from '@/lib/graph/types';

interface DiagramState {
  sql: string;
  isAnalyzing: boolean;
  error: string | null;
  dag: ExecutionDAG | null;
  layout: LayoutGraph | null;
  
  // Actions
  setSql: (sql: string) => void;
  analyze: () => Promise<void>;
  reset: () => void;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  sql: "SELECT * FROM users", // Default Value
  isAnalyzing: false,
  error: null,
  dag: null,
  layout: null,

  setSql: (sql) => set({ sql }),

  analyze: async () => {
    const { sql } = get();
    set({ isAnalyzing: true, error: null });

    try {
      // 1. Analyze (CPU bound, but fast enough for now to run in main thread)
      // In a real heavy app, might move to WebWorker
      const dag = analyzeSql(sql);

      // 2. Layout (Async ELK)
      const layout = await layoutGraph(dag);

      set({ dag, layout, isAnalyzing: false });
    } catch (err: any) {
      console.error("Analysis Failed:", err);
      set({ 
        error: err.message || "Failed to analyze SQL", 
        isAnalyzing: false,
        dag: null,
        layout: null
      });
    }
  },

  reset: () => set({ 
    sql: "", 
    error: null, 
    dag: null, 
    layout: null 
  })
}));
