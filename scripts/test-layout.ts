import { createLogicalPlan } from '../lib/sql/planner';
import { layoutGraph } from '../lib/graph/layout';

const sql = "SELECT u.name, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id";

async function run() {
    console.log("Analyzing SQL...");
    const plan = createLogicalPlan(sql);
    console.log(`Nodes: ${plan.nodes.length}`);

    console.log("Running ELK Layout...");
    const layout = await layoutGraph(plan);
    
    console.log(`Layout Size: ${layout.width}x${layout.height}`);
    console.log("Nodes:");
    layout.nodes.forEach(n => {
        const label = n.nodeType === 'Relation' ? n.name : n.operator;
        console.log(`  [${label}] x=${n.x}, y=${n.y}`);
    });
    console.log("Edges:");
    layout.edges.forEach(e => {
        console.log(`  ${e.from} -> ${e.to} (Sections: ${e.sections.length})`);
    });
}

run().catch(console.error);
