import { prisma } from "@/lib/prisma";

/**
 * GoFix runs as a single company (no multi-tenancy), so there is exactly
 * one Company row. This fetches it once rather than threading a companyId
 * through every call site.
 */
export async function getCompany() {
  const company = await prisma.company.findFirst();
  if (!company) {
    throw new Error(
      "No company record found. Run `npm run db:seed` to create the initial GoFix Services company record."
    );
  }
  return company;
}
