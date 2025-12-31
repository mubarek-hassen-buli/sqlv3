import { createLogicalPlan } from '../lib/sql/planner';

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
        const plan = createLogicalPlan(sql);
        console.log(`Nodes: ${plan.nodes.length}, Edges: ${plan.edges.length}`);
        
        console.log("Nodes:");
        plan.nodes.forEach(n => {
            const label = n.nodeType === 'Relation' ? n.name : n.operator;
            console.log(`  [${n.nodeType}] ${label} (ID: ${n.id})`);
        });
        
        console.log("Edges:");
        plan.edges.forEach(e => console.log(`  ${e.from} -> ${e.to}`));

    } catch (e) {
        console.error("FAILED:", e);
    }
});
