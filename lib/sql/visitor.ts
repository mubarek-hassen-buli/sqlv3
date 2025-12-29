/**
 * SQL AST Visitor Pattern
 * defines the interface for traversing the AST produced by node-sql-parser.
 */

// Basic AST Shapes (Reversed engineered from node-sql-parser behavior)
export interface ASTNode {
  type?: string;
  [key: string]: any;
}

export interface Select {
  type: 'select';
  distinct: string | null;
  columns: any[];
  from: any[];
  where: any;
  groupby: any[];
  having: any;
  orderby: any[];
  limit: any;
  with: any; // CTEs
}

export interface From {
  db: string | null;
  table: string;
  as: string | null;
  join?: string; // "INNER JOIN", "LEFT JOIN", etc.
  on?: any;
}

export abstract class SqlVisitor {
  
  visit(node: any, context?: any): void {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(child => this.visit(child, context));
      return;
    }

    if (node.type === 'select') {
      this.visitSelect(node as Select, context);
    } else if (node.ast) {
        // Handle nested ASTs often found in subqueries or root container
        this.visit(node.ast, context);
    } 
    // Add other node type checks (insert, update, delete) if needed, 
    // but we focus on SELECT for visualization.
  }

  abstract visitSelect(node: Select, context?: any): void;
  
  // These are optional hooks, concrete analyzers can override internal logic
  // usually driven by visitSelect calling them.
  // abstract visitFrom(node: From, context?: any): void;
  // abstract visitWhere(expr: any, context?: any): void;
}
