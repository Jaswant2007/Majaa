import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Cross-Supplier Duplicate SHA-256 Hashes
    const allDocuments = await prisma.document.findMany({
      include: {
        supplier: { select: { id: true, name: true, tier: true, registrationNo: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const hashMap: Record<string, any[]> = {};
    allDocuments.forEach((doc) => {
      if (!doc.sha256Hash) return;
      if (!hashMap[doc.sha256Hash]) hashMap[doc.sha256Hash] = [];
      hashMap[doc.sha256Hash].push(doc);
    });

    const duplicateHashCases: any[] = [];
    Object.entries(hashMap).forEach(([hash, docs]) => {
      // Find cases where distinct suppliers uploaded identical hash
      const uniqueSupplierIds = new Set(docs.map((d) => d.supplierId));
      if (uniqueSupplierIds.size > 1 || docs.length > 1) {
        duplicateHashCases.push({
          sha256Hash: hash,
          totalOccurrences: docs.length,
          uniqueSuppliersCount: uniqueSupplierIds.size,
          isCrossSupplier: uniqueSupplierIds.size > 1,
          filename: docs[0].filename,
          documents: docs.map((d) => ({
            id: d.id,
            filename: d.filename,
            version: d.version,
            uploadedAt: d.createdAt,
            verificationStatus: d.verificationStatus,
            supplier: d.supplier,
          })),
        });
      }
    });

    // 2. Certificate Number Collusion / Reuse across Suppliers
    const allCertificates = await prisma.certificate.findMany({
      include: {
        supplier: { select: { id: true, name: true, tier: true, registrationNo: true } },
      },
    });

    const certNumberMap: Record<string, any[]> = {};
    allCertificates.forEach((c) => {
      if (!c.number) return;
      const cleanNum = c.number.trim().toUpperCase();
      if (!certNumberMap[cleanNum]) certNumberMap[cleanNum] = [];
      certNumberMap[cleanNum].push(c);
    });

    const certReuseCases: any[] = [];
    Object.entries(certNumberMap).forEach(([num, certs]) => {
      const uniqueSupplierIds = new Set(certs.map((c) => c.supplierId));
      if (uniqueSupplierIds.size > 1 || certs.length > 1) {
        certReuseCases.push({
          certificateNumber: num,
          type: certs[0].type,
          issuer: certs[0].issuer,
          expiryDate: certs[0].expiryDate,
          isCrossSupplier: uniqueSupplierIds.size > 1,
          occurrences: certs.length,
          suppliers: certs.map((c) => ({
            id: c.id,
            status: c.status,
            supplier: c.supplier,
          })),
        });
      }
    });

    // 3. Fraud / Mismatch Alerts
    const fraudAlerts = await prisma.alert.findMany({
      where: {
        OR: [
          { type: "IDENTITY_MISMATCH" },
          { type: "BLACKLIST_MATCH" },
          { type: "DUPLICATE_DOCUMENT" },
          { type: "CERTIFICATE_MISMATCH" },
          { severity: "CRITICAL" },
        ],
      },
      include: {
        supplier: { select: { id: true, name: true, tier: true, registrationNo: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 4. Linked Collusion Clusters
    const collusionClusters: any[] = [];
    duplicateHashCases.forEach((caseItem, idx) => {
      if (caseItem.isCrossSupplier) {
        collusionClusters.push({
          id: `CLUSTER-${idx + 1}`,
          title: `Collusive Manifest Mirroring (${caseItem.uniqueSuppliersCount} Suppliers)`,
          type: "CROSS_SUPPLIER_HASH_DUPLICATION",
          severity: "CRITICAL",
          hash: caseItem.sha256Hash,
          affectedSuppliers: caseItem.documents.map((d: any) => d.supplier),
          evidence: `Identical SHA-256 payload claimed by multiple separate commercial entities.`,
        });
      }
    });

    return NextResponse.json({
      summary: {
        totalDuplicateHashCases: duplicateHashCases.length,
        crossSupplierCollusionCases: duplicateHashCases.filter((c) => c.isCrossSupplier).length,
        reusedCertificatesCount: certReuseCases.length,
        criticalFraudAlertsCount: fraudAlerts.length,
      },
      duplicateHashCases,
      certReuseCases,
      fraudAlerts,
      collusionClusters,
    });
  } catch (error: any) {
    console.error("Fraud analysis API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to conduct fraud analysis." },
      { status: 500 }
    );
  }
}
