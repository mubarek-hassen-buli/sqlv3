import { analyzeSql } from '../lib/sql/analyze';
import { layoutGraph } from '../lib/graph/layout';

const sql = "SELECT u.name, o.id FROM users u LEFT JOIN orders o ON u.id = o.user_id";

async function run() {
    console.log("Analyzing SQL...");
    const dag = analyzeSql(sql);
    console.log(`DAG Nodes: ${dag.nodes.length}`);

    console.log("Running ELK Layout...");
    const layout = await layoutGraph(dag);
    
    console.log(`Layout Size: ${layout.width}x${layout.height}`);
    console.log("Nodes:");
    layout.nodes.forEach(n => {
        console.log(`  [${n.label}] x=${n.x}, y=${n.y}`);
    });
    console.log("Edges:");
    layout.edges.forEach(e => {
        console.log(`  ${e.source} -> ${e.target} (Sections: ${e.sections.length})`);
    });
}

run().catch(console.error);
