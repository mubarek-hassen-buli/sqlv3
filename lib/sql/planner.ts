
import { parse } from 'pgsql-ast-parser';
import { 
  LogicalNode, OperatorType, JoinType, 
  TableScanNode, FilterNode, ProjectNode, JoinNode, 
  AggregateNode, SortNode, LimitNode, Schema, Column 
} from './types';

// Mock Schema Catalog for inferencing
const MOCK_SCHEMAS: Record<string, string[]> = {
  'users': ['id', 'name', 'email', 'image', 'created_at'],
  'orders': ['id', 'user_id', 'amount', 'status', 'created_at'],
  'products': ['id', 'name', 'price', 'category'],
  'emp': ['empno', 'ename', 'job', 'mgr', 'hiredate', 'sal', 'comm', 'deptno'],
  'dept': ['deptno', 'dname', 'loc'],
  'scott.emp': ['empno', 'ename', 'job', 'mgr', 'hiredate', 'sal', 'comm', 'deptno'],
  'scott.dept': ['deptno', 'dname', 'loc']
};

let nodeIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}-${nodeIdCounter++}`;
}

function getExprString(expr: any): string {
    if (!expr) return "";
    switch (expr.type) {
        case 'ref': 
            if (expr.table) return `${expr.table.name}.${expr.name}`;
            return expr.name;
        case 'string': return `'${expr.value}'`;
        case 'integer': return String(expr.value);
        case 'numeric': return String(expr.value);
        case 'boolean': return expr.value ? 'TRUE' : 'FALSE';
        case 'null': return 'NULL';
        case 'star': return '*';
        case 'call': 
            const funcName = expr.function?.name || 'func';
            const args = expr.args?.map(getExprString).join(', ') || '';
            return `${funcName}(${args})`;
        case 'binary': return `${getExprString(expr.left)} ${expr.op} ${getExprString(expr.right)}`;
        case 'unary': return `${expr.op} ${getExprString(expr.operand)}`;
        default: 
            if (typeof expr === 'string') return expr;
            if (typeof expr === 'number') return String(expr);
            return 'expr';
    }
}

/**
 * Main Planner - with fallback for unsupported dialects
 */
export function createLogicalPlan(sql: string): LogicalNode {
  nodeIdCounter = 0;
  const cleanSql = sql.replace(/\r/g, '').trim();
  
  try {
    const ast = parse(cleanSql);
    if (ast && ast.length > 0) {
      const statement: any = ast[0];
      if (statement.type === 'select') {
        return buildSelectPlan(statement);
      }
    }
  } catch (err: any) {
    console.warn("Parser failed, using fallback:", err.message);
  }

  // FALLBACK: Regex-based extraction for unsupported syntax
  return buildFallbackPlan(cleanSql);
}

/**
 * Fallback plan builder using regex (handles any SQL dialect)
 */
function buildFallbackPlan(sql: string): LogicalNode {
  const upperSql = sql.toUpperCase();
  let root: LogicalNode | null = null;

  // Extract tables
  const tablePatterns = [
    /\bFROM\s+([A-Z_][A-Z0-9_.]*)/gi,
    /\bJOIN\s+([A-Z_][A-Z0-9_.]*)/gi,
    /\bINTO\s+([A-Z_][A-Z0-9_.]*)/gi,
    /\bUPDATE\s+([A-Z_][A-Z0-9_.]*)/gi,
    /\bTABLE\s+([A-Z_][A-Z0-9_.]*)/gi,
  ];

  const tables: string[] = [];
  tablePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(sql)) !== null) {
      const t = match[1].replace(/[`"\[\]]/g, '');
      if (t && !tables.includes(t)) tables.push(t);
    }
  });

  // Build scans
  if (tables.length > 0) {
    root = createScanNode(tables[0]);
    for (let i = 1; i < Math.min(tables.length, 6); i++) {
      const nextScan = createScanNode(tables[i]);
      root = {
        id: generateId('join'),
        type: OperatorType.JOIN,
        joinType: JoinType.INNER,
        schema: mergeSchemas(root.schema, nextScan.schema),
        children: [root, nextScan]
      } as JoinNode;
    }
  } else {
    root = { id: generateId('source'), type: OperatorType.VALUES, schema: { columns: [] }, children: [] };
  }

  // Detect clauses
  if (/\bWHERE\b/i.test(upperSql)) {
    root = { id: generateId('filter'), type: OperatorType.FILTER, condition: 'WHERE ...', schema: root.schema, children: [root] } as FilterNode;
  }
  if (/\bGROUP\s+BY\b/i.test(upperSql)) {
    root = { id: generateId('agg'), type: OperatorType.AGGREGATE, groupByColumns: [], aggregates: [], schema: { columns: [{ name: 'agg', type: 'UNKNOWN' }] }, children: [root] } as AggregateNode;
  }
  if (/\bSELECT\b/i.test(upperSql) && !/\bGROUP\s+BY\b/i.test(upperSql)) {
    root = { id: generateId('project'), type: OperatorType.PROJECT, expressions: ['*'], schema: root.schema, children: [root] } as ProjectNode;
  }
  if (/\bORDER\s+BY\b/i.test(upperSql)) {
    root = { id: generateId('sort'), type: OperatorType.SORT, orderBy: [], schema: root.schema, children: [root] } as SortNode;
  }
  if (/\bLIMIT\b/i.test(upperSql)) {
    root = { id: generateId('limit'), type: OperatorType.LIMIT, limit: 10, schema: root.schema, children: [root] } as LimitNode;
  }
  if (/\bINSERT\b/i.test(upperSql)) {
    root = { id: generateId('insert'), type: OperatorType.INSERT, schema: { columns: [] }, children: [root] };
  }
  if (/\bCREATE\s+TABLE\b/i.test(upperSql)) {
    root = { id: generateId('create'), type: OperatorType.CREATE_TABLE, schema: { columns: [] }, children: [root] };
  }
  if (/\bCREATE\s+VIEW\b/i.test(upperSql)) {
    root = { id: generateId('view'), type: OperatorType.CREATE_VIEW, schema: { columns: [] }, children: [root] };
  }

  return root;
}

function createScanNode(tableName: string): TableScanNode {
  return {
    id: generateId(`scan-${tableName}`),
    type: OperatorType.TABLE_SCAN,
    tableName,
    schema: {
      columns: (MOCK_SCHEMAS[tableName] || MOCK_SCHEMAS[tableName.toLowerCase()] || ['col1']).map(c => ({
        name: c, type: 'UNKNOWN', source: { table: tableName, column: c }
      })),
      relationName: tableName
    },
    children: []
  };
}

function buildSelectPlan(stmt: any): LogicalNode {
  let root: LogicalNode | null = null;
  const fromItems = stmt.from || [];

  if (fromItems.length > 0) {
    root = processFromItem(fromItems[0]);
    for (let i = 1; i < fromItems.length; i++) {
      const nextNode = processFromItem(fromItems[i]);
      root = { id: generateId('join-cross'), type: OperatorType.JOIN, joinType: JoinType.CROSS, schema: mergeSchemas(root.schema, nextNode.schema), children: [root, nextNode] } as JoinNode;
    }
  } else {
    root = { id: generateId('values'), type: OperatorType.VALUES, schema: { columns: [] }, children: [] };
  }

  if (stmt.where) {
    root = { id: generateId('filter'), type: OperatorType.FILTER, condition: getExprString(stmt.where), schema: root.schema, children: [root] } as FilterNode;
  }

  if (stmt.groupBy) {
    const cols = (stmt.columns || []).map((c: any) => ({ name: c.alias?.name || getExprString(c.expr), type: 'UNKNOWN' }));
    root = { id: generateId('agg'), type: OperatorType.AGGREGATE, groupByColumns: (stmt.groupBy || []).map(getExprString), aggregates: [], schema: { columns: cols }, children: [root] } as AggregateNode;
  }

  if (stmt.having) {
    root = { id: generateId('filter-having'), type: OperatorType.FILTER, condition: getExprString(stmt.having), schema: root.schema, children: [root], metadata: { isHaving: true } } as FilterNode;
  }

  if (!stmt.groupBy) {
    const cols = (stmt.columns || []).map((c: any) => ({ name: c.alias?.name || getExprString(c.expr), type: 'UNKNOWN' }));
    root = { id: generateId('project'), type: OperatorType.PROJECT, expressions: (stmt.columns || []).map((c: any) => getExprString(c.expr)), schema: { columns: cols }, children: [root] } as ProjectNode;
  }

  if (stmt.orderBy) {
    root = { id: generateId('sort'), type: OperatorType.SORT, orderBy: (stmt.orderBy || []).map((o: any) => `${getExprString(o.by)} ${o.order || 'ASC'}`), schema: root.schema, children: [root] } as SortNode;
  }

  if (stmt.limit) {
    root = { id: generateId('limit'), type: OperatorType.LIMIT, limit: 10, schema: root.schema, children: [root] } as LimitNode;
  }

  return root;
}

function processFromItem(item: any): LogicalNode {
  if (item.type === 'table') {
    const tableName = item.name?.schema ? `${item.name.schema}.${item.name.name}` : item.name?.name || 'unknown';
    let node: LogicalNode = createScanNode(tableName);
    if (item.alias?.name) (node as TableScanNode).alias = item.alias.name;

    if (item.joins?.length) {
      for (const join of item.joins) {
        const rightNode = processFromItem(join.from);
        node = { id: generateId('join'), type: OperatorType.JOIN, joinType: JoinType.INNER, onCondition: getExprString(join.on), schema: mergeSchemas(node.schema, rightNode.schema), children: [node, rightNode] } as JoinNode;
      }
    }
    return node;
  }

  if (item.type === 'statement' || item.type === 'select') {
    const subPlan = buildSelectPlan(item.statement || item);
    return { id: generateId('subquery'), type: OperatorType.SUBQUERY_SCAN, schema: subPlan.schema, children: [subPlan] };
  }

  return { id: generateId('unknown'), type: OperatorType.VALUES, schema: { columns: [] }, children: [] };
}

function mergeSchemas(left: Schema, right: Schema): Schema {
  return { columns: [...left.columns, ...right.columns], relationName: `${left.relationName || 'L'}_${right.relationName || 'R'}` };
}
