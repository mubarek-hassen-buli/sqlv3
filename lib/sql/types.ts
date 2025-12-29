/**
 * Logical Query Plan Types
 * Defines the structure for the Relational Algebra Tree
 */

export enum OperatorType {
  // Sources
  TABLE_SCAN = 'TABLE_SCAN',
  VALUES = 'VALUES',
  SUBQUERY_SCAN = 'SUBQUERY_SCAN',

  // Transformations
  FILTER = 'FILTER',
  PROJECT = 'PROJECT',
  JOIN = 'JOIN',
  AGGREGATE = 'AGGREGATE',
  SORT = 'SORT',
  LIMIT = 'LIMIT',

  // Sinks (Output)
  RESULT = 'RESULT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CREATE_TABLE = 'CREATE_TABLE',
  CREATE_VIEW = 'CREATE_VIEW'
}

export enum JoinType {
  INNER = 'INNER',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  FULL = 'FULL',
  CROSS = 'CROSS',
}

export interface ColumnSource {
  table?: string;
  column?: string;
  expression?: string; // For calculated columns like "sal * 12"
}

export interface Column {
  name: string;
  type: string; // e.g., 'INTEGER', 'VARCHAR', 'UNKNOWN'
  source?: ColumnSource;
}

export interface Schema {
  columns: Column[];
  relationName?: string; // e.g., "JOIN_RESULT_1"
}

// Base Interface for all Logical Nodes
export interface LogicalNode {
  id: string;
  type: OperatorType;
  schema: Schema;
  children: LogicalNode[];
  metadata?: Record<string, any>;
}

// --- Specific Node Interfaces ---

export interface TableScanNode extends LogicalNode {
  type: OperatorType.TABLE_SCAN;
  tableName: string;
  alias?: string;
}

export interface FilterNode extends LogicalNode {
  type: OperatorType.FILTER;
  condition: string; // e.g., "sal > 1000"
}

export interface ProjectNode extends LogicalNode {
  type: OperatorType.PROJECT;
  expressions: string[]; // e.g., ["name", "sal * 12 AS annual"]
}

export interface JoinNode extends LogicalNode {
  type: OperatorType.JOIN;
  joinType: JoinType;
  onCondition?: string; // e.g., "u.id = o.user_id"
}

export interface AggregateNode extends LogicalNode {
  type: OperatorType.AGGREGATE;
  groupByColumns: string[];
  aggregates: string[]; // e.g., ["COUNT(*)", "SUM(sal)"]
}

export interface SortNode extends LogicalNode {
  type: OperatorType.SORT;
  orderBy: string[]; // e.g., ["created_at DESC"]
}

export interface LimitNode extends LogicalNode {
  type: OperatorType.LIMIT;
  limit: number;
  offset?: number;
}
