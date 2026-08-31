import type { Prisma } from "@prisma/client";

// Ontario HST. Revisit if GoFix ever bills work outside Ontario.
export const TAX_RATE = 0.13;

export function formatCurrency(value: Prisma.Decimal | number | string) {
  return `$${Number(value).toLocaleString("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
