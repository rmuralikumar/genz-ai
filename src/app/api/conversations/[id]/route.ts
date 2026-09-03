import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { updateConversationSchema } from "@/lib/validation/chat";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        userId: user.id, // Enforce strict ownership
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation details:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Verify ownership first
    const existing = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.isArchived !== undefined && {
          isArchived: parsed.data.isArchived,
        }),
      },
    });

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const existing = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
