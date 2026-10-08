import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, ROLE_LABELS, Role, ROLE_PERMISSIONS } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const allUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({
    authenticated: true,
    user,
    roleLabel: ROLE_LABELS[user.role],
    permissions: ROLE_PERMISSIONS[user.role] || [],
    availableRoles: (Object.keys(ROLE_LABELS) as Role[]).map((r) => ({
      role: r,
      label: ROLE_LABELS[r],
      user: allUsers.find((u) => u.role === r),
    })),
  });
}
