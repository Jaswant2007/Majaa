import { prisma } from "../src/lib/db";
import { executeJudgingDemoPipeline } from "../src/lib/pipeline";

async function testDirectPipeline() {
  console.log("Testing executeJudgingDemoPipeline directly in Node...");
  const admin = await prisma.user.findFirst();
  console.log("Admin user:", admin?.id, admin?.email);

  const supplier = await prisma.supplier.findFirst();
  console.log("Supplier:", supplier?.id, supplier?.name);

  const result = await executeJudgingDemoPipeline({
    filename: "test-direct.txt",
    rawText: "Test manifest content for direct test",
    uploadedBy: admin?.id,
    supplierId: supplier?.id,
  });

  console.log("Direct Pipeline Result Success:", result.success);
  console.log("Badge:", result.risk.complianceBadge);
  console.log("Calculated:", result.calculation.result);
}

testDirectPipeline()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
