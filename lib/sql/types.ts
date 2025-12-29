/**
 * Relation-Based Logical Plan Types
 * Following up2.doc requirements: Relations are first-class, Operators are transformers
 */

// ==================== COLUMN & SCHEMA ====================

export interface ColumnDef {
  name: string;
  dataType?: string;     // e.g., 'INTEGER', 'VARCHAR'
  source?: string;       // lineage: where this column came from (e.g., "emp.sal", "SUM(sal)")
  table?: string;        // original table name
}

// ==================== NODE TYPES ====================

export type NodeType = "Relation" | "Operator";

export type OperatorKind = 
  | "Scan" 
  | "Filter" 
  | "Project" 
  | "Join" 
  | "Aggregate" 
  | "Sort" 
  | "Limit"
  | "Insert"
  | "Update"
  | "Delete";

// Relation Node (BIG - shows columns)
export interface RelationNode {
  id: string;
  nodeType: "Relation";
  name: string;           // "customers", "RESULT_1", "FINAL"
  isBase: boolean;        // true = source table, false = intermediate/result
  isFinal: boolean;       // true = final query result
  columns: ColumnDef[];
}

// Operator Node (SMALL - transformer)
export interface OperatorNode {
  id: string;
  nodeType: "Operator";
  operator: OperatorKind;
  details: string;        // conditions, expressions, join keys
}

// Union type for graph nodes
export type GraphNodeData = RelationNode | OperatorNode;

// ==================== GRAPH / DAG ====================

export interface Edge {
  id: string;
  from: string;           // source node id
  to: string;             // target node id
}

export interface LogicalPlanGraph {
  nodes: GraphNodeData[];
  edges: Edge[];
}

// ==================== MOCK SCHEMAS ====================

export const MOCK_SCHEMAS: Record<string, ColumnDef[]> = {
  'users': [
    { name: 'id', dataType: 'INT', table: 'users' },
    { name: 'name', dataType: 'VARCHAR', table: 'users' },
    { name: 'email', dataType: 'VARCHAR', table: 'users' },
    { name: 'created_at', dataType: 'TIMESTAMP', table: 'users' }
  ],
  'orders': [
    { name: 'id', dataType: 'INT', table: 'orders' },
    { name: 'user_id', dataType: 'INT', table: 'orders' },
    { name: 'amount', dataType: 'DECIMAL', table: 'orders' },
    { name: 'status', dataType: 'VARCHAR', table: 'orders' }
  ],
  'customers': [
    { name: 'id', dataType: 'INT', table: 'customers' },
    { name: 'name', dataType: 'VARCHAR', table: 'customers' },
    { name: 'city', dataType: 'VARCHAR', table: 'customers' }
  ],
  'emp': [
    { name: 'empno', dataType: 'INT', table: 'emp' },
    { name: 'ename', dataType: 'VARCHAR', table: 'emp' },
    { name: 'job', dataType: 'VARCHAR', table: 'emp' },
    { name: 'sal', dataType: 'DECIMAL', table: 'emp' },
    { name: 'deptno', dataType: 'INT', table: 'emp' }
  ],
  'dept': [
    { name: 'deptno', dataType: 'INT', table: 'dept' },
    { name: 'dname', dataType: 'VARCHAR', table: 'dept' },
    { name: 'loc', dataType: 'VARCHAR', table: 'dept' }
  ]
};
