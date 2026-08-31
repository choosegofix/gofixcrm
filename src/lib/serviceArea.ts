import { prisma } from "@/lib/prisma";

/**
 * Finds a company's service area by name (case-insensitive, trimmed) or
 * creates one. This is how a plain "city" text field typed into a property
 * or lead form quietly turns into the area-of-operation badge, without
 * anyone having to pick from a dropdown.
 */
export async function findOrCreateServiceArea(companyId: string, rawName: string) {
  const name = rawName.trim();
  if (!name) return null;

  const existing = await prisma.serviceArea.findFirst({
    where: { companyId, name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;

  return prisma.serviceArea.create({ data: { companyId, name } });
}

// A small, muted palette in the same family as the rest of the badge
// system. Areas are open-ended data, so colors are assigned deterministically
// by name rather than hand-picked per area.
const AREA_PALETTE = [
  "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  "bg-[#FBEEDC] text-[#8A5A19] border-[#E9CBA0]",
  "bg-[#E1EEEA] text-[#1F5C51] border-[#BFDAD2]",
  "bg-[#EFE3ED] text-[#6B3A5E] border-[#D9C0D3]",
  "bg-[#F3DEDA] text-[#8C2F1F] border-[#E0B3A9]",
  "bg-[#E9E6F5] text-[#3F3577] border-[#CFC7EA]",
];

export function areaColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AREA_PALETTE[hash % AREA_PALETTE.length];
}
