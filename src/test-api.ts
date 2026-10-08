import { prisma } from "./lib/db";

async function testApiData() {
  console.log("Testing API database queries and integrity...");
  const enterprise = await prisma.enterprise.findFirst();
  console.log(`Enterprise: ${enterprise?.name} (${enterprise?.registrationNo})`);

  const users = await prisma.user.findMany();
  console.log(`Seeded Users: ${users.length} (${users.map((u) => u.role).join(", ")})`);

  const suppliers = await prisma.supplier.findMany({
    include: { alerts: true, certificates: true, shipments: true },
  });
  console.log(`Retrieved ${suppliers.length} suppliers directly from database.`);

  const auditEvents = await prisma.auditEvent.findMany({
    orderBy: { timestamp: "desc" },
    take: 10,
  });
  console.log(`Audit Event entries: ${auditEvents.length}`);
}

testApiData()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
