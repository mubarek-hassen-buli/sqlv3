import { Parser, AST } from 'node-sql-parser';

export interface ParseResult {
  ast: AST | AST[];
  error?: string;
}

/**
 * Parses raw SQL string into an Abstract Syntax Tree (AST).
 * Configured for multiple dialects to be robust.
 */
export function parseSql(sql: string): ParseResult {
  const parser = new Parser();
  
  try {
    // We default to 'postgresql' as it's a standard, robust dialect for visualization goals.
    // 'transactsql' (T-SQL) or 'mysql' could be options, but Postgres is a safe default for standard SQL.
    const ast = parser.astify(sql, { database: 'postgresql' });
    return { ast };
  } catch (err: any) {
    console.error("SQL Parse Error:", err);
    return { 
      ast: [], 
      error: err.message || "Failed to parse SQL. Check syntax." 
    };
  }
}
