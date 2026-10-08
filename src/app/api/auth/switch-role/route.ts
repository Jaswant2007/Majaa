import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Role, ROLE_LABELS } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!role || !ROLE_LABELS[role as Role]) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { role },
    });

    if (!user) {
      return NextResponse.json({ error: `No seeded user found for role ${role}` }, { status: 404 });
    }

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set cookie
    res.cookies.set("sourcetrace_role", user.role, { path: "/", httpOnly: false });
    res.cookies.set("sourcetrace_user_id", user.id, { path: "/", httpOnly: false });

    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Role switch failed" },
      { status: 500 }
    );
  }
}
