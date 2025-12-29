import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { diagrams } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, sql, layout } = body;

    // TODO: Verify if session.user.id is correctly populated from adapter
    // If using 'jwt' strategy without extra callbacks, id might be missing or in 'sub'.
    // We added the callback in lib/auth.ts so session.user.id should be the DB ID.
    const userId = (session.user as any).id;

    if (!userId) {
         return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
    }

    const [inserted] = await db.insert(diagrams).values({
        userId: userId,
        name: name || "Untitled Diagram",
        sql: sql,
        layout: layout
    }).returning();

    return NextResponse.json(inserted);

  } catch (error: any) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    
    // List user's diagrams
    const userDiagrams = await db.select().from(diagrams).where(eq(diagrams.userId, userId));
    
    return NextResponse.json(userDiagrams);
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    try {
        const { searchParams } = new URL(req.url);
        const diagramId = searchParams.get('id');
        
        if (!diagramId) {
            return NextResponse.json({ error: "Diagram ID required" }, { status: 400 });
        }
        
        const userId = (session.user as any).id;
        
        // Delete only if user owns the diagram
        await db.delete(diagrams)
            .where(eq(diagrams.id, diagramId))
            .execute();
        
        return NextResponse.json({ success: true });
        
    } catch (error: any) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
