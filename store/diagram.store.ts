import { create } from 'zustand';
import { createLogicalPlan } from '@/lib/sql/planner';
import { layoutGraph } from '@/lib/graph/layout';
import { LogicalPlanGraph } from '@/lib/sql/types';
import { LayoutGraph } from '@/lib/graph/types';

interface DiagramState {
  sql: string;
  isAnalyzing: boolean;
  error: string | null;
  plan: LogicalPlanGraph | null;
  layout: LayoutGraph | null;
  
  setSql: (sql: string) => void;
  analyze: () => Promise<void>;
  reset: () => void;
  save: (name: string) => Promise<void>;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  sql: "SELECT id, city FROM customers WHERE city = 'London'", 
  isAnalyzing: false,
  error: null,
  plan: null,
  layout: null,

  setSql: (sql) => set({ sql }),

  analyze: async () => {
    const { sql } = get();
    set({ isAnalyzing: true, error: null });

    try {
      // 1. Create Logical Plan Graph (Relation → Operator → Relation)
      const plan = createLogicalPlan(sql);

      // 2. Layout with ELK
      const layout = await layoutGraph(plan);

      set({ plan, layout, isAnalyzing: false });
    } catch (err: any) {
      console.error("Analysis Failed:", err);
      set({ 
        error: err.message || "Failed to analyze SQL", 
        isAnalyzing: false,
        plan: null,
        layout: null
      });
    }
  },

  save: async (name: string) => {
      const { sql, layout } = get();
      try {
          const res = await fetch("/api/diagrams", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, sql, layout })
          });
          
          if (!res.ok) throw new Error("Failed to save");
      } catch (err: any) {
          console.error("Save error:", err);
          throw err;
      }
  },

  reset: () => set({ 
    sql: "", 
    error: null, 
    plan: null, 
    layout: null 
  })
}));
