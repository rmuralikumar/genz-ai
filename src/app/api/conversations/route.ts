import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createConversationSchema } from "@/lib/validation/chat";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  try {
    const whereClause: Prisma.ConversationWhereInput = {
      userId: user.id,
      isArchived: false,
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { messages: { some: { content: { contains: search } } } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const title = parsed.data.title || "New Chat";
    const model = parsed.data.model || "genz-fast";

    const conversation = await prisma.conversation.create({
      data: {
        title,
        model,
        userId: user.id,
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
