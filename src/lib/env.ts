import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string({
      required_error: "DATABASE_URL is required",
    })
    .url("DATABASE_URL must be a valid URL")
    .refine(
      (url) => url.includes("pgbouncer=true"),
      "DATABASE_URL must end with or include '?pgbouncer=true' (Supabase Transaction Pooler)"
    ),
  DIRECT_URL: z
    .string({
      required_error: "DIRECT_URL is required",
    })
    .url("DIRECT_URL must be a valid URL (Supabase Session Pooler)"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({
      required_error: "NEXT_PUBLIC_SUPABASE_URL is required",
    })
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({
      required_error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required",
    })
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY must not be empty"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({
      required_error: "SUPABASE_SERVICE_ROLE_KEY is required",
    })
    .min(1, "SUPABASE_SERVICE_ROLE_KEY must not be empty"),
  LLM_API_KEY: z
    .string({
      required_error: "LLM_API_KEY is required",
    })
    .min(1, "LLM_API_KEY must not be empty"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missingOrInvalidVars = result.error.issues.map((issue) => {
      const varName = issue.path.join(".");
      return ` - ${varName}: ${issue.message}`;
    });

    const errorMessage = [
      "❌ Invalid or missing environment variables:",
      ...missingOrInvalidVars,
      "\nEnsure all required variables are set in .env.local (and DATABASE_URL/DIRECT_URL in .env).",
    ].join("\n");

    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return result.data;
}

// Lazy evaluation / singleton so importing the module in build or test doesn't fail unless accessed
let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (!parsedEnv) {
    parsedEnv = validateEnv();
  }
  return parsedEnv;
}

// Proxy export to allow direct access like env.DATABASE_URL
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
