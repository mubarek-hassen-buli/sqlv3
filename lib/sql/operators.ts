/**
 * SQL Execution Operator Types
 * Defines the building blocks of the Semantic Execution DAG.
 */

export enum NodeType {
  // Data Sources
  TABLE_SCAN = "TABLE_SCAN",
  CTE_SCAN = "CTE_SCAN",
  VALUES = "VALUES", // SELECT * FROM (VALUES (1), (2))

  // Relational Operators
  JOIN = "JOIN",
  FILTER = "FILTER", // WHERE / HAVING
  PROJECT = "PROJECT", // SELECT list
  AGGREGATE = "AGGREGATE", // GROUP BY
  SORT = "SORT", // ORDER BY
  LIMIT = "LIMIT", // LIMIT / OFFSET
  WINDOW = "WINDOW", // Window functions (OVER)

  // Set Operations
  UNION = "UNION",
  INTERSECT = "INTERSECT",
  EXCEPT = "EXCEPT",

  // Advanced Flow
  CTE_PRODUCER = "CTE_PRODUCER", // Define a CTE
  SUBQUERY = "SUBQUERY", // Lateral / Scalar subquery wrapper
}

export interface NodeMetadata {
  /** Original SQL snippet directly related to this node */
  codeSnippet?: string;
  /** Estimated cost (if we were a real planner, but here for visual hinting) */
  cost?: number;
  /** Specific details for different node types */
  details: Record<string, unknown>;
}

export interface ExecutionNode {
  id: string;
  type: NodeType;
  label: string; // Display name (e.g., "SCAN users", "JOIN (Left)")
  metadata: NodeMetadata;
  
  /** 
   * Lineage tracking: Which columns does this node output?
   * Important for connecting nodes correctly in complex flows.
   */
  outputColumns?: string[];
}

export enum EdgeType {
  DATA_FLOW = "DATA_FLOW", // Standard row flow
  CONTROL_FLOW = "CONTROL_FLOW", // Dependency (e.g., CTE must run before User)
}

export interface ExecutionEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  type: EdgeType;
  label?: string; // e.g., "ON u.id = o.user_id"
}

export interface ExecutionDAG {
  nodes: ExecutionNode[];
  edges: ExecutionEdge[];
}
