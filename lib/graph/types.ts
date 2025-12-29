/**
 * Graph Rendering Types
 * This is what the frontend (Excalidraw/Canvas) assumes.
 * Decoupled from ELK-specifics where possible.
 */

export interface HelperLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: "dotted" | "solid";
}

export interface GraphNode {
  id: string;
  type: string;
  label: string; 
  x: number;
  y: number;
  width: number;
  height: number;
  data: Record<string, unknown>; // Original execution node metadata
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  sections: Array<{
    startPoint: { x: number; y: number };
    endPoint: { x: number; y: number };
    bendPoints?: Array<{ x: number; y: number }>;
  }>;
}

export interface LayoutGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}
