import { LogicalNode } from '../sql/types';

export interface Point {
  x: number;
  y: number;
}

export interface GraphNode extends LogicalNode {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sections: {
    startPoint: Point;
    endPoint: Point;
    bendPoints?: Point[];
  }[];
}

export interface LayoutGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}
