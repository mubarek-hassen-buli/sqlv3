
import { parse } from 'pgsql-ast-parser';

const queries = [
    "SELECT * FROM users",
    "SELECT name, email FROM users WHERE id = 1",
    "SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE o.amount > 100",
    "SELECT job, COUNT(*) FROM emp GROUP BY job HAVING COUNT(*) > 5 ORDER BY 2 DESC LIMIT 10"
];

queries.forEach(q => {
    console.log("--- SQL ---");
    console.log(q);
    try {
        const ast = parse(q);
        console.log("--- AST ---");
        console.log(JSON.stringify(ast, null, 2));
    } catch (e) {
        console.error("Parse Error:", e);
    }
});
