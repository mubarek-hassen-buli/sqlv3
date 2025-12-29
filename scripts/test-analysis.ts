import { analyzeSql } from '../lib/sql/analyze';

const queries = [
    // 1. Simple Select
    "SELECT * FROM users",
    
    // 2. Join with alias
    "SELECT u.name, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id",

    // 3. Aggregation and Filter
    "SELECT role, COUNT(*) FROM users WHERE active = 1 GROUP BY role"
];

queries.forEach((sql, idx) => {
    console.log(`\n--- Query ${idx + 1} ---`);
    console.log(`SQL: ${sql}`);
    try {
        const dag = analyzeSql(sql);
        console.log(`Nodes: ${dag.nodes.length}, Edges: ${dag.edges.length}`);
        
        console.log("Nodes:");
        dag.nodes.forEach(n => console.log(`  [${n.type}] ${n.label} (ID: ${n.id})`));
        
        console.log("Edges:");
        dag.edges.forEach(e => console.log(`  ${e.source} -> ${e.target} (${e.label || ''})`));

    } catch (e) {
        console.error("FAILED:", e);
    }
});
