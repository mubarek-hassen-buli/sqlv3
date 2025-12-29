import { RelationNode, OperatorNode, GraphNodeData } from '../sql/types';

export interface Point {
  x: number;
  y: number;
}

// Base layout properties
export interface LayoutProperties {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Layout node = GraphNodeData + position/size
export type LayoutNode = GraphNodeData & LayoutProperties;

export interface LayoutEdge {
  id: string;
  from: string;
  to: string;
  sections: {
    startPoint: Point;
    endPoint: Point;
    bendPoints?: Point[];
  }[];
}

export interface LayoutGraph {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}
