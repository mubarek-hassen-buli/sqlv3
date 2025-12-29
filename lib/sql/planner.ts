
import { parse } from 'pgsql-ast-parser';
import { 
  RelationNode, OperatorNode, GraphNodeData, Edge, 
  LogicalPlanGraph, ColumnDef, MOCK_SCHEMAS, OperatorKind 
} from './types';

let nodeCounter = 0;
let resultCounter = 0;

function genId(prefix: string): string {
  return `${prefix}-${nodeCounter++}`;
}

function genResultName(): string {
  return `RESULT_${++resultCounter}`;
}

// Get columns for a table (from mock or default)
function getTableColumns(tableName: string): ColumnDef[] {
  const key = tableName.toLowerCase();
  if (MOCK_SCHEMAS[key]) {
    return MOCK_SCHEMAS[key].map(c => ({ ...c }));
  }
  // Default columns for unknown tables
  return [
    { name: 'col1', dataType: 'UNKNOWN', table: tableName },
    { name: 'col2', dataType: 'UNKNOWN', table: tableName }
  ];
}

// Helper to stringify expressions
function exprToString(expr: any): string {
  if (!expr) return "";
  switch (expr.type) {
    case 'ref': return expr.table ? `${expr.table.name}.${expr.name}` : expr.name;
    case 'string': return `'${expr.value}'`;
    case 'integer': case 'numeric': return String(expr.value);
    case 'boolean': return expr.value ? 'TRUE' : 'FALSE';
    case 'null': return 'NULL';
    case 'star': return '*';
    case 'call': return `${expr.function?.name || 'fn'}(${(expr.args || []).map(exprToString).join(', ')})`;
    case 'binary': return `${exprToString(expr.left)} ${expr.op} ${exprToString(expr.right)}`;
    default: return typeof expr === 'string' ? expr : 'expr';
  }
}

/**
 * Main entry: SQL → LogicalPlanGraph
 */
export function createLogicalPlan(sql: string): LogicalPlanGraph {
  nodeCounter = 0;
  resultCounter = 0;
  
  const nodes: GraphNodeData[] = [];
  const edges: Edge[] = [];
  
  try {
    const cleanSql = sql.replace(/\r/g, '').trim();
    const ast = parse(cleanSql);
    
    if (ast && ast.length > 0 && (ast[0] as any).type === 'select') {
      buildSelectGraph(ast[0] as any, nodes, edges);
    } else {
      // Fallback for non-select or parse failure
      buildFallbackGraph(cleanSql, nodes, edges);
    }
  } catch (err) {
    console.warn("Parse failed, using fallback:", err);
    buildFallbackGraph(sql, nodes, edges);
  }
  
  return { nodes, edges };
}

/**
 * Build graph for SELECT statement
 */
function buildSelectGraph(stmt: any, nodes: GraphNodeData[], edges: Edge[]): string {
  const fromItems = stmt.from || [];
  let currentRelationId: string | null = null;

  // 1. Process FROM clause - create base relation(s)
  if (fromItems.length > 0) {
    currentRelationId = processFromItem(fromItems[0], nodes, edges);
    
    // Handle JOINs (additional FROM items = implicit cross join)
    for (let i = 1; i < fromItems.length; i++) {
      const rightRelId = processFromItem(fromItems[i], nodes, edges);
      currentRelationId = addOperatorAndResult(
        'Join', 'CROSS JOIN', [currentRelationId!, rightRelId],
        mergeColumns(getRelationColumns(currentRelationId!, nodes), getRelationColumns(rightRelId, nodes)),
        nodes, edges
      );
    }
  } else {
    // No FROM - create empty source
    const rel: RelationNode = {
      id: genId('rel'),
      nodeType: 'Relation',
      name: 'VALUES',
      isBase: true,
      isFinal: false,
      columns: []
    };
    nodes.push(rel);
    currentRelationId = rel.id;
  }

  // 2. WHERE → Filter operator
  if (stmt.where && currentRelationId) {
    const condition = exprToString(stmt.where);
    const inputCols = getRelationColumns(currentRelationId, nodes);
    currentRelationId = addOperatorAndResult(
      'Filter', condition, [currentRelationId],
      inputCols, // Filter doesn't change columns
      nodes, edges
    );
  }

  // 3. GROUP BY → Aggregate operator
  if (stmt.groupBy && currentRelationId) {
    const groupCols = (stmt.groupBy || []).map(exprToString);
    const selectCols = (stmt.columns || []).map((c: any) => ({
      name: c.alias?.name || exprToString(c.expr),
      dataType: 'UNKNOWN',
      source: exprToString(c.expr)
    }));
    
    currentRelationId = addOperatorAndResult(
      'Aggregate', `GROUP BY ${groupCols.join(', ')}`, [currentRelationId],
      selectCols,
      nodes, edges
    );
  }

  // 4. HAVING → Filter after aggregate
  if (stmt.having && currentRelationId) {
    const condition = exprToString(stmt.having);
    const inputCols = getRelationColumns(currentRelationId, nodes);
    currentRelationId = addOperatorAndResult(
      'Filter', `HAVING ${condition}`, [currentRelationId],
      inputCols,
      nodes, edges
    );
  }

  // 5. SELECT (Project) - only if not aggregated
  if (!stmt.groupBy && stmt.columns && currentRelationId) {
    const projectedCols: ColumnDef[] = [];
    const exprs: string[] = [];
    
    for (const col of stmt.columns) {
      const exprStr = exprToString(col.expr);
      exprs.push(exprStr);
      projectedCols.push({
        name: col.alias?.name || exprStr,
        dataType: 'UNKNOWN',
        source: exprStr
      });
    }
    
    // Only add Project if not SELECT *
    if (!exprs.includes('*')) {
      currentRelationId = addOperatorAndResult(
        'Project', exprs.join(', '), [currentRelationId],
        projectedCols,
        nodes, edges
      );
    }
  }

  // 6. ORDER BY → Sort
  if (stmt.orderBy && currentRelationId) {
    const sortExprs = (stmt.orderBy || []).map((o: any) => 
      `${exprToString(o.by)} ${o.order || 'ASC'}`
    );
    const inputCols = getRelationColumns(currentRelationId, nodes);
    currentRelationId = addOperatorAndResult(
      'Sort', sortExprs.join(', '), [currentRelationId],
      inputCols,
      nodes, edges
    );
  }

  // 7. LIMIT
  if (stmt.limit && currentRelationId) {
    const limitVal = exprToString(stmt.limit.limit);
    const inputCols = getRelationColumns(currentRelationId, nodes);
    currentRelationId = addOperatorAndResult(
      'Limit', `LIMIT ${limitVal}`, [currentRelationId],
      inputCols,
      nodes, edges
    );
  }

  // Mark final relation
  const finalRel = nodes.find(n => n.id === currentRelationId) as RelationNode;
  if (finalRel && finalRel.nodeType === 'Relation') {
    finalRel.isFinal = true;
    finalRel.name = 'FINAL';
  }

  return currentRelationId!;
}

/**
 * Process FROM item → returns relation node id
 */
function processFromItem(item: any, nodes: GraphNodeData[], edges: Edge[]): string {
  if (item.type === 'table') {
    const tableName = item.name?.schema 
      ? `${item.name.schema}.${item.name.name}` 
      : item.name?.name || 'table';
    const alias = item.alias?.name;
    
    // Create base relation
    const rel: RelationNode = {
      id: genId('rel'),
      nodeType: 'Relation',
      name: alias || tableName,
      isBase: true,
      isFinal: false,
      columns: getTableColumns(tableName)
    };
    nodes.push(rel);
    
    // Handle explicit JOINs attached to this table
    let currentId = rel.id;
    if (item.joins && Array.isArray(item.joins)) {
      for (const join of item.joins) {
        const rightId = processFromItem(join.from, nodes, edges);
        const joinType = (join.type || 'INNER').replace(' JOIN', '');
        const onCond = exprToString(join.on);
        
        currentId = addOperatorAndResult(
          'Join', `${joinType} ON ${onCond}`, [currentId, rightId],
          mergeColumns(getRelationColumns(currentId, nodes), getRelationColumns(rightId, nodes)),
          nodes, edges
        );
      }
    }
    
    return currentId;
  }
  
  // Subquery
  if (item.type === 'statement' || item.type === 'select') {
    return buildSelectGraph(item.statement || item, nodes, edges);
  }
  
  // Fallback
  const rel: RelationNode = {
    id: genId('rel'),
    nodeType: 'Relation',
    name: 'UNKNOWN',
    isBase: true,
    isFinal: false,
    columns: []
  };
  nodes.push(rel);
  return rel.id;
}

/**
 * Add operator + output relation, return new relation id
 */
function addOperatorAndResult(
  opKind: OperatorKind,
  details: string,
  inputRelIds: string[],
  outputColumns: ColumnDef[],
  nodes: GraphNodeData[],
  edges: Edge[]
): string {
  // Create operator node
  const op: OperatorNode = {
    id: genId('op'),
    nodeType: 'Operator',
    operator: opKind,
    details: details
  };
  nodes.push(op);
  
  // Edge from each input relation to operator
  for (const inputId of inputRelIds) {
    edges.push({ id: genId('e'), from: inputId, to: op.id });
  }
  
  // Create output relation
  const result: RelationNode = {
    id: genId('rel'),
    nodeType: 'Relation',
    name: genResultName(),
    isBase: false,
    isFinal: false,
    columns: outputColumns
  };
  nodes.push(result);
  
  // Edge from operator to output relation
  edges.push({ id: genId('e'), from: op.id, to: result.id });
  
  return result.id;
}

function getRelationColumns(relId: string, nodes: GraphNodeData[]): ColumnDef[] {
  const rel = nodes.find(n => n.id === relId && n.nodeType === 'Relation') as RelationNode | undefined;
  return rel?.columns || [];
}

function mergeColumns(left: ColumnDef[], right: ColumnDef[]): ColumnDef[] {
  return [...left, ...right];
}

/**
 * Fallback for unparseable SQL
 */
function buildFallbackGraph(sql: string, nodes: GraphNodeData[], edges: Edge[]) {
  const upperSql = sql.toUpperCase();
  
  // Extract tables
  const tables: string[] = [];
  const tableMatches = sql.match(/(?:FROM|JOIN|INTO|UPDATE)\s+([A-Za-z_][A-Za-z0-9_.]*)/gi) || [];
  for (const m of tableMatches) {
    const t = m.split(/\s+/)[1];
    if (t && !tables.includes(t)) tables.push(t);
  }
  
  // Create base relations
  let currentId: string | null = null;
  for (const t of tables) {
    const rel: RelationNode = {
      id: genId('rel'),
      nodeType: 'Relation',
      name: t,
      isBase: true,
      isFinal: false,
      columns: getTableColumns(t)
    };
    nodes.push(rel);
    
    if (!currentId) {
      currentId = rel.id;
    } else {
      // Join with previous
      currentId = addOperatorAndResult(
        'Join', 'JOIN', [currentId, rel.id],
        mergeColumns(getRelationColumns(currentId, nodes), rel.columns),
        nodes, edges
      );
    }
  }
  
  if (!currentId) {
    const rel: RelationNode = { id: genId('rel'), nodeType: 'Relation', name: 'SOURCE', isBase: true, isFinal: false, columns: [] };
    nodes.push(rel);
    currentId = rel.id;
  }
  
  // Add operators based on keywords
  if (/\bWHERE\b/i.test(upperSql)) {
    currentId = addOperatorAndResult('Filter', 'WHERE ...', [currentId], getRelationColumns(currentId, nodes), nodes, edges);
  }
  if (/\bGROUP\s+BY\b/i.test(upperSql)) {
    currentId = addOperatorAndResult('Aggregate', 'GROUP BY', [currentId], [{ name: 'agg', dataType: 'UNKNOWN' }], nodes, edges);
  }
  if (/\bSELECT\b/i.test(upperSql) && !/\bGROUP\s+BY\b/i.test(upperSql)) {
    currentId = addOperatorAndResult('Project', 'SELECT', [currentId], getRelationColumns(currentId, nodes), nodes, edges);
  }
  if (/\bORDER\s+BY\b/i.test(upperSql)) {
    currentId = addOperatorAndResult('Sort', 'ORDER BY', [currentId], getRelationColumns(currentId, nodes), nodes, edges);
  }
  if (/\bLIMIT\b/i.test(upperSql)) {
    currentId = addOperatorAndResult('Limit', 'LIMIT', [currentId], getRelationColumns(currentId, nodes), nodes, edges);
  }
  
  // Mark final
  const finalRel = nodes.find(n => n.id === currentId) as RelationNode;
  if (finalRel) {
    finalRel.isFinal = true;
    finalRel.name = 'FINAL';
  }
}
