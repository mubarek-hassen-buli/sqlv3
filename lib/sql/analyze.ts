import { SqlVisitor, Select, From } from './visitor';
import { ExecutionDAG, ExecutionNode, ExecutionEdge, NodeType, EdgeType } from './operators';
import { parseSql } from './parse';

class SemanticAnalyzer extends SqlVisitor {
  private nodes: ExecutionNode[] = [];
  private edges: ExecutionEdge[] = [];
  private nodeIdCounter = 0;

  constructor() {
    super();
  }

  getDAG(): ExecutionDAG {
    return { nodes: this.nodes, edges: this.edges };
  }

  private createNode(type: NodeType, label: string, metadata: any = {}): string {
    const id = `node-${this.nodeIdCounter++}`;
    this.nodes.push({
      id,
      type,
      label,
      metadata: { details: metadata }
    });
    return id;
  }

  private createEdge(source: string, target: string, type: EdgeType = EdgeType.DATA_FLOW, label?: string) {
    this.edges.push({
      id: `edge-${source}-${target}`,
      source,
      target,
      type,
      label
    });
  }

  /**
   * Main entry point for SELECT statements.
   * Builds the pipeline: FROM -> JOINs -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER -> LIMIT
   */
  visitSelect(node: Select, context?: any) {
    // 1. FROM & JOINs (Data Source)
    let lastNodeId: string | null = null;
    
    if (node.from && node.from.length > 0) {
      // Handle the first table (Driving Table)
      const firstSource = node.from[0];
      lastNodeId = this.processSource(firstSource);

      // Handle subsequent joins
      for (let i = 1; i < node.from.length; i++) {
        const joinSource = node.from[i];
        const joinNodeId = this.processSource(joinSource);
        
        // Create JOIN node
        const joinType = joinSource.join || "JOIN";
        const joinOperatorId = this.createNode(NodeType.JOIN, joinType, { on: joinSource.on });
        
        // Connect Left (previous stream) to JOIN
        if (lastNodeId) {
            this.createEdge(lastNodeId, joinOperatorId, EdgeType.DATA_FLOW, "left");
        }
        // Connect Right (new table) to JOIN
        this.createEdge(joinNodeId, joinOperatorId, EdgeType.DATA_FLOW, "right");
        
        // Output of JOIN is the new input stream
        lastNodeId = joinOperatorId;
      }
    }

    // 2. WHERE (Filter)
    if (node.where && lastNodeId) {
      const filterId = this.createNode(NodeType.FILTER, "WHERE", { condition: node.where });
      this.createEdge(lastNodeId, filterId);
      lastNodeId = filterId;
    }

    // 3. GROUP BY (Aggregate)
    if (node.groupby && lastNodeId) {
      const aggId = this.createNode(NodeType.AGGREGATE, "GROUP BY", { columns: node.groupby });
      this.createEdge(lastNodeId, aggId);
      lastNodeId = aggId;
    }

    // 4. SELECT (Project)
    if (node.columns && lastNodeId) {
      const projectId = this.createNode(NodeType.PROJECT, "SELECT", { columns: node.columns });
      this.createEdge(lastNodeId, projectId);
      lastNodeId = projectId;
    }
    
    // Fallback if no specific projection (e.g., SELECT * from table) and we haven't made a project node
    // In strict DAG, we usually always have a projection or output.
    if (!lastNodeId && node.columns) {
         // Special case: SELECT 1; (No FROM)
         lastNodeId = this.createNode(NodeType.VALUES, "Constant", { value: node.columns });
    }
  }

  private processSource(from: any): string {
    // Check if it's a subquery
    if (from.expr && from.expr.ast) {
       // Recursive Step for Subqueries
       // Note: In a real implementation, we would recursively visit the subquery AST
       // and link its final output node to here.
       // For now, we represent it as a generic SUBQUERY node to verify structure.
       const subqueryId = this.createNode(NodeType.SUBQUERY, `(Subquery) ${from.as || ''}`);
       // TODO: recurse -> this.visit(from.expr.ast)
       return subqueryId;
    }

    // Standard Table Scan
    const tableName = from.table;
    const alias = from.as ? `(${from.as})` : "";
    return this.createNode(NodeType.TABLE_SCAN, `${tableName} ${alias}`, { table: tableName, db: from.db });
  }
}

/**
 * Public API to analyze SQL string and return DAG
 */
export function analyzeSql(sql: string): ExecutionDAG {
  const { ast } = parseSql(sql);
  const analyzer = new SemanticAnalyzer();
  
  if (Array.isArray(ast)) {
    // Analyze first statement for now
    if (ast.length > 0) analyzer.visit(ast[0]);
  } else {
    analyzer.visit(ast);
  }

  return analyzer.getDAG();
}
