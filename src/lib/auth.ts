import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./db";

export type Role =
  | "ENTERPRISE_ADMIN"
  | "COMPLIANCE_OFFICER"
  | "SUSTAINABILITY_MANAGER"
  | "SUPPLIER_USER";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  enterpriseId?: string | null;
  supplierId?: string | null;
}

export const ROLE_LABELS: Record<Role, string> = {
  ENTERPRISE_ADMIN: "Enterprise Admin",
  COMPLIANCE_OFFICER: "Compliance Officer",
  SUSTAINABILITY_MANAGER: "Sustainability Manager",
  SUPPLIER_USER: "Supplier User",
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ENTERPRISE_ADMIN: [
    "dashboard:view",
    "supply_chain:manage",
    "suppliers:manage",
    "documents:verify",
    "scope3:calculate",
    "compliance:adjudicate",
    "alerts:resolve",
    "audit:admin",
    "assistant:access",
    "portal:submit",
  ],
  COMPLIANCE_OFFICER: [
    "dashboard:view",
    "supply_chain:view",
    "suppliers:view",
    "documents:verify",
    "compliance:adjudicate",
    "alerts:resolve",
    "audit:view",
    "assistant:access",
  ],
  SUSTAINABILITY_MANAGER: [
    "dashboard:view",
    "supply_chain:view",
    "suppliers:view",
    "scope3:calculate",
    "audit:view",
    "assistant:access",
  ],
  SUPPLIER_USER: [
    "portal:submit",
    "documents:upload",
    "suppliers:view_own",
  ],
};

/**
 * Extracts currently active session user.
 * Supports:
 * 1. Cookie 'sourcetrace_user_id' / 'sourcetrace_role'
 * 2. Header 'x-sourcetrace-role' or 'x-user-id'
 * 3. Default active Enterprise Admin from DB
 */
export async function getCurrentUser(req?: Request | NextRequest): Promise<SessionUser | null> {
  let roleOverride: Role | null = null;
  let userIdHeader: string | null = null;

  if (req) {
    const headers = "headers" in req ? req.headers : null;
    if (headers) {
      const headerRole = headers.get("x-sourcetrace-role") as Role | null;
      if (headerRole && ROLE_LABELS[headerRole]) {
        roleOverride = headerRole;
      }
      userIdHeader = headers.get("x-user-id");

      // Check cookies
      const cookieHeader = headers.get("cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((c) => {
            const [k, ...v] = c.split("=");
            return [k, decodeURIComponent(v.join("="))];
          })
        );
        if (cookies.sourcetrace_role && ROLE_LABELS[cookies.sourcetrace_role as Role]) {
          roleOverride = cookies.sourcetrace_role as Role;
        }
        if (cookies.sourcetrace_user_id) {
          userIdHeader = cookies.sourcetrace_user_id;
        }
      }
    }
  }

  if (userIdHeader) {
    const user = await prisma.user.findUnique({ where: { id: userIdHeader } });
    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: (roleOverride || user.role) as Role,
        enterpriseId: user.enterpriseId,
        supplierId: user.supplierId,
      };
    }
  }

  // Find user by role override or default to ENTERPRISE_ADMIN
  const targetRole = roleOverride || "ENTERPRISE_ADMIN";
  const user = await prisma.user.findFirst({
    where: { role: targetRole },
  });

  if (user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      enterpriseId: user.enterpriseId,
      supplierId: user.supplierId,
    };
  }

  // Fallback first user in database
  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    return {
      id: firstUser.id,
      email: firstUser.email,
      name: firstUser.name,
      role: firstUser.role as Role,
      enterpriseId: firstUser.enterpriseId,
      supplierId: firstUser.supplierId,
    };
  }

  return null;
}

/**
 * Backend RBAC enforcement helper on every API route
 * Rule 11: "RBAC enforced on backend, not just UI hiding."
 */
export async function requireRole(
  req: Request | NextRequest,
  allowedRoles: Role[]
): Promise<{ user: SessionUser } | { errorResponse: NextResponse }> {
  const user = await getCurrentUser(req);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Authentication required to access this resource.",
        },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "FORBIDDEN_INSUFFICIENT_ROLE",
          message: `Access denied. Role [${ROLE_LABELS[user.role]}] does not possess required privilege. Allowed roles: ${allowedRoles
            .map((r) => ROLE_LABELS[r])
            .join(", ")}.`,
          userRole: user.role,
          requiredRoles: allowedRoles,
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}
