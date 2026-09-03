import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { userSettingsSchema } from "@/lib/validation/chat";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.userSetting.findUnique({
      where: { userId: user.id },
    });

    const usage = await prisma.usageRecord.aggregate({
      where: { userId: user.id },
      _sum: {
        totalTokens: true,
        promptTokens: true,
        completionTokens: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      settings,
      usage: {
        totalTokens: usage._sum.totalTokens || 0,
        promptTokens: usage._sum.promptTokens || 0,
        completionTokens: usage._sum.completionTokens || 0,
        requestsCount: usage._count.id || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = userSettingsSchema.safeParse(body.settings || body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updatedSettings = await prisma.userSetting.upsert({
      where: { userId: user.id },
      update: {
        ...(parsed.data.theme && { theme: parsed.data.theme }),
        ...(parsed.data.defaultModel && { defaultModel: parsed.data.defaultModel }),
        ...(parsed.data.enterToSend !== undefined && { enterToSend: parsed.data.enterToSend }),
        ...(parsed.data.autoScroll !== undefined && { autoScroll: parsed.data.autoScroll }),
        ...(parsed.data.compactMode !== undefined && { compactMode: parsed.data.compactMode }),
      },
      create: {
        userId: user.id,
        theme: parsed.data.theme || "dark",
        defaultModel: parsed.data.defaultModel || "genz-fast",
        enterToSend: parsed.data.enterToSend ?? true,
        autoScroll: parsed.data.autoScroll ?? true,
        compactMode: parsed.data.compactMode ?? false,
      },
    });

    // Optionally update user name if passed
    if (body.name && typeof body.name === "string" && body.name.trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: body.name.trim() },
      });
    }

    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
