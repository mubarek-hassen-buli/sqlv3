import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log("=== Explain API Called ===");
    console.log("API Key exists:", !!apiKey);
    console.log("API Key first 10 chars:", apiKey?.slice(0, 10) + "...");
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment");
      return NextResponse.json({ error: "API key not configured. Add GEMINI_API_KEY to your .env file." }, { status: 500 });
    }

    const body = await req.json();
    console.log("Request body keys:", Object.keys(body));
    console.log("SQL received:", body.sql?.slice(0, 100) + "...");
    console.log("Plan received:", body.plan ? "Yes" : "No");

    const { sql, plan } = body;

    if (!sql) {
      return NextResponse.json({ error: "SQL is required" }, { status: 400 });
    }

    // Build prompt
    const prompt = `You are a SQL expert explaining queries to non-technical users.

Explain this SQL query in clear, simple language. Focus on:
1. What data is being retrieved
2. From which tables
3. What filters are applied
4. Any joins, groupings, or sorting
5. The final result

SQL Query:
\`\`\`sql
${sql}
\`\`\`

Provide a clear, concise explanation (3-5 paragraphs max). Use bullet points where helpful.
Do NOT include SQL code in your response - explain in plain English only.`;

    console.log("Calling Gemini API...");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini response received, length:", text.length);

    return NextResponse.json({ explanation: text });

  } catch (error: any) {
    console.error("=== Explain API Error ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
