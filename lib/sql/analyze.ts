import { ExecutionDAG, ExecutionNode, ExecutionEdge, NodeType, EdgeType } from './operators';

/**
 * Robust SQL Analyzer - 100% regex-based
 * Handles any SQL dialect without parser dependencies
 */

let nodeCounter = 0;

function createNode(type: NodeType, label: string, metadata: any = {}): ExecutionNode {
  const id = `node-${nodeCounter++}`;
  return {
    id,
    type,
    label,
    metadata: { details: metadata }
  };
}

function createEdge(source: string, target: string, type: EdgeType = EdgeType.DATA_FLOW, label?: string): ExecutionEdge {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    type,
    label
  };
}

export function analyzeSql(sql: string): ExecutionDAG {
  nodeCounter = 0;
  const nodes: ExecutionNode[] = [];
  const edges: ExecutionEdge[] = [];

  // Normalize the SQL
  const normalizedSql = sql
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  if (!normalizedSql) {
    return { nodes: [], edges: [] };
  }

  let lastNodeId: string | null = null;

  // Detect statement types
  const isSelect = /\bSELECT\b/.test(normalizedSql);
  const isInsert = /\bINSERT\b/.test(normalizedSql);
  const isUpdate = /\bUPDATE\b/.test(normalizedSql);
  const isDelete = /\bDELETE\b/.test(normalizedSql);
  const isCreate = /\bCREATE\b/.test(normalizedSql);
  const isDrop = /\bDROP\b/.test(normalizedSql);

  // Extract tables - look for table names after FROM, JOIN, INTO, UPDATE, TABLE
  const tablePatterns = [
    /\bFROM\s+([A-Z_][A-Z0-9_]*(?:\.[A-Z_][A-Z0-9_]*)?)/gi,
    /\bJOIN\s+([A-Z_][A-Z0-9_]*(?:\.[A-Z_][A-Z0-9_]*)?)/gi,
    /\bINTO\s+([A-Z_][A-Z0-9_]*(?:\.[A-Z_][A-Z0-9_]*)?)/gi,
    /\bUPDATE\s+([A-Z_][A-Z0-9_]*(?:\.[A-Z_][A-Z0-9_]*)?)/gi,
    /\bTABLE\s+([A-Z_][A-Z0-9_]*(?:\.[A-Z_][A-Z0-9_]*)?)/gi,
  ];

  const tables: string[] = [];
  tablePatterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.source, 'gi');
    while ((match = regex.exec(sql)) !== null) {
      const tableName = match[1].replace(/[`"\[\]]/g, '');
      if (tableName && !tables.includes(tableName.toUpperCase())) {
        tables.push(tableName);
      }
    }
  });

  // Check for clauses
  const hasWhere = /\bWHERE\b/i.test(normalizedSql);
  const hasGroupBy = /\bGROUP\s+BY\b/i.test(normalizedSql);
  const hasOrderBy = /\bORDER\s+BY\b/i.test(normalizedSql);
  const hasHaving = /\bHAVING\b/i.test(normalizedSql);
  const hasLimit = /\bLIMIT\b/i.test(normalizedSql);
  const hasUnion = /\bUNION\b/i.test(normalizedSql);
  const hasSubquery = /\(\s*SELECT\b/i.test(normalizedSql);

  // Count JOINs
  const joinMatches = normalizedSql.match(/\b(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|JOIN)\b/gi) || [];

  // Build the execution graph based on detected patterns

  // 1. Table Scans
  if (tables.length > 0) {
    const firstTable = tables[0];
    const scanNode = createNode(NodeType.TABLE_SCAN, `SCAN ${firstTable}`);
    nodes.push(scanNode);
    lastNodeId = scanNode.id;

    // Handle additional tables as joins
    for (let i = 1; i < Math.min(tables.length, 5); i++) { // Limit to 5 tables for clean visualization
      const table = tables[i];
      const tableScanNode = createNode(NodeType.TABLE_SCAN, `SCAN ${table}`);
      nodes.push(tableScanNode);

      const joinType = joinMatches[i - 1] || 'JOIN';
      const joinNode = createNode(NodeType.JOIN, joinType.replace(/\s+/g, ' '));
      nodes.push(joinNode);

      edges.push(createEdge(lastNodeId!, joinNode.id, EdgeType.DATA_FLOW, 'left'));
      edges.push(createEdge(tableScanNode.id, joinNode.id, EdgeType.DATA_FLOW, 'right'));
      lastNodeId = joinNode.id;
    }
  } else {
    // No tables detected - maybe it's a VALUES or dual query
    const sourceNode = createNode(NodeType.VALUES, 'SOURCE');
    nodes.push(sourceNode);
    lastNodeId = sourceNode.id;
  }

  // 2. Subquery indicator
  if (hasSubquery && lastNodeId) {
    const subNode = createNode(NodeType.SUBQUERY, 'SUBQUERY');
    nodes.push(subNode);
    edges.push(createEdge(lastNodeId, subNode.id));
    lastNodeId = subNode.id;
  }

  // 3. WHERE Filter
  if (hasWhere && lastNodeId) {
    const filterNode = createNode(NodeType.FILTER, 'WHERE');
    nodes.push(filterNode);
    edges.push(createEdge(lastNodeId, filterNode.id));
    lastNodeId = filterNode.id;
  }

  // 4. GROUP BY Aggregation
  if (hasGroupBy && lastNodeId) {
    const aggNode = createNode(NodeType.AGGREGATE, 'GROUP BY');
    nodes.push(aggNode);
    edges.push(createEdge(lastNodeId, aggNode.id));
    lastNodeId = aggNode.id;
  }

  // 5. HAVING Filter
  if (hasHaving && lastNodeId) {
    const havingNode = createNode(NodeType.FILTER, 'HAVING');
    nodes.push(havingNode);
    edges.push(createEdge(lastNodeId, havingNode.id));
    lastNodeId = havingNode.id;
  }

  // 6. SELECT Projection
  if (isSelect && lastNodeId) {
    const projectNode = createNode(NodeType.PROJECT, 'SELECT');
    nodes.push(projectNode);
    edges.push(createEdge(lastNodeId, projectNode.id));
    lastNodeId = projectNode.id;
  }

  // 7. UNION
  if (hasUnion && lastNodeId) {
    const unionNode = createNode(NodeType.UNION, 'UNION');
    nodes.push(unionNode);
    edges.push(createEdge(lastNodeId, unionNode.id));
    lastNodeId = unionNode.id;
  }

  // 8. ORDER BY Sort
  if (hasOrderBy && lastNodeId) {
    const sortNode = createNode(NodeType.SORT, 'ORDER BY');
    nodes.push(sortNode);
    edges.push(createEdge(lastNodeId, sortNode.id));
    lastNodeId = sortNode.id;
  }

  // 9. LIMIT
  if (hasLimit && lastNodeId) {
    const limitNode = createNode(NodeType.LIMIT, 'LIMIT');
    nodes.push(limitNode);
    edges.push(createEdge(lastNodeId, limitNode.id));
    lastNodeId = limitNode.id;
  }

  // 10. DDL Operations
  if (isCreate) {
    const createNode_n = createNode(NodeType.PROJECT, 'CREATE');
    if (nodes.length === 0) {
      nodes.push(createNode_n);
    }
  }

  if (isInsert && lastNodeId) {
    const insertNode = createNode(NodeType.PROJECT, 'INSERT');
    nodes.push(insertNode);
    edges.push(createEdge(lastNodeId, insertNode.id));
    lastNodeId = insertNode.id;
  }

  if (isUpdate && lastNodeId) {
    const updateNode = createNode(NodeType.PROJECT, 'UPDATE');
    nodes.push(updateNode);
    edges.push(createEdge(lastNodeId, updateNode.id));
    lastNodeId = updateNode.id;
  }

  if (isDelete && lastNodeId) {
    const deleteNode = createNode(NodeType.PROJECT, 'DELETE');
    nodes.push(deleteNode);
    edges.push(createEdge(lastNodeId, deleteNode.id));
    lastNodeId = deleteNode.id;
  }

  // Fallback: if no nodes were created, create a simple representation
  if (nodes.length === 0) {
    const queryNode = createNode(NodeType.PROJECT, 'QUERY');
    nodes.push(queryNode);
  }

  return { nodes, edges };
}
