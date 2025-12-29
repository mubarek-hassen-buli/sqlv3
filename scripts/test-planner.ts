
import { createLogicalPlan } from "../lib/sql/planner";

const queries = [
    "SELECT * FROM users",
    "SELECT name, email FROM users WHERE id = 1",
    "SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE o.amount > 100",
    "SELECT job, COUNT(*) FROM emp GROUP BY job HAVING COUNT(*) > 5 ORDER BY 2 DESC LIMIT 10"
];

queries.forEach(q => {
    console.log("\n--- SQL ---");
    console.log(q);
    try {
        const plan = createLogicalPlan(q);
        console.log("--- Logical Plan ---");
        console.log(JSON.stringify(plan, null, 2));
    } catch (e: any) {
        console.error("Planner Error:", e.message);
    }
});
