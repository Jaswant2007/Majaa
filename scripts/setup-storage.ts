import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local and .env if not already in process.env
function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function setupStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    console.error("Ensure these are set in .env.local before running setup-storage.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const bucketName = "supplier-documents";
  console.log(`Checking Supabase Storage bucket: "${bucketName}"...`);

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("❌ Failed to list Supabase storage buckets:", listError.message);
    process.exit(1);
  }

  const existingBucket = buckets?.find((b) => b.name === bucketName);

  if (existingBucket) {
    console.log(`✅ Bucket "${bucketName}" already exists.`);
    if (existingBucket.public) {
      console.warn(`⚠️ Warning: Bucket "${bucketName}" is currently public. Updating to private...`);
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: false,
      });
      if (updateError) {
        console.error("Failed to update bucket to private:", updateError.message);
      } else {
        console.log(`🔒 Bucket "${bucketName}" successfully set to private.`);
      }
    } else {
      console.log(`🔒 Bucket "${bucketName}" is private.`);
    }
  } else {
    console.log(`Bucket "${bucketName}" not found. Creating private bucket...`);
    const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });

    if (createError) {
      console.error("❌ Failed to create bucket:", createError.message);
      process.exit(1);
    }

    console.log(`✅ Private bucket "${bucketName}" created successfully.`);
  }
}

setupStorage().catch((err) => {
  console.error("❌ Unexpected error during storage setup:", err.message);
  process.exit(1);
});
