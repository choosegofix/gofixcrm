"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseISO } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { formatRecordNumber } from "@/lib/numbers";
import { TAX_RATE } from "@/lib/currency";
import type { Trade, PaymentMethod } from "@prisma/client";

function parseLineItems(formData: FormData) {
  const rowCount = Number(formData.get("rowCount") ?? 0);
  const items: { description: string; quantity: number; unitPrice: number; isOptional: boolean }[] = [];

  for (let i = 0; i < rowCount; i++) {
    const description = String(formData.get(`desc_${i}`) ?? "").trim();
    const quantity = Number(formData.get(`qty_${i}`) ?? 0);
    const unitPrice = Number(formData.get(`price_${i}`) ?? 0);
    const isOptional = formData.get(`optional_${i}`) === "on";
    if (!description || quantity <= 0) continue;
    items.push({ description, quantity, unitPrice, isOptional });
  }

  return items;
}

export async function createQuote(formData: FormData) {
  const user = await requireUser();
  const company = await getCompany();

  const clientId = String(formData.get("clientId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const trade = String(formData.get("trade") ?? "") as Trade;
  const leadId = String(formData.get("leadId") ?? "") || null;

  if (!clientId || !propertyId || !title || !trade) {
    throw new Error("Client, property, title, and trade are required.");
  }

  const items = parseLineItems(formData);
  if (items.length === 0) throw new Error("Add at least one line item.");

  // Optional line items don't count toward the quoted total until a client opts in.
  const billableItems = items.filter((i) => !i.isOptional);
  const subtotal = billableItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  const quoteCount = await prisma.quote.count({ where: { companyId: company.id } });
  const depositRequiredRaw = String(formData.get("depositRequired") ?? "");
  const validUntilRaw = String(formData.get("validUntil") ?? "");

  const quote = await prisma.quote.create({
    data: {
      companyId: company.id,
      clientId,
      propertyId,
      leadId,
      quoteNumber: formatRecordNumber("Q", quoteCount),
      title,
      trade,
      subtotal,
      taxAmount,
      total,
      depositRequired: depositRequiredRaw ? Number(depositRequiredRaw) : null,
      validUntil: validUntilRaw ? parseISO(validUntilRaw) : null,
      notes: String(formData.get("notes") ?? "") || null,
      termsAndConditions: String(formData.get("termsAndConditions") ?? "") || null,
      createdByUserId: user.id,
      lineItems: {
        create: items.map((item, i) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isOptional: item.isOptional,
          sortOrder: i,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  });

  await logAudit({
    companyId: company.id,
    entityType: "Quote",
    entityId: quote.id,
    action: "created",
    performedByUserId: user.id,
  });

  redirect(`/quotes/${quote.id}`);
}

export async function markQuoteSent(quoteId: string) {
  const user = await requireUser();
  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "SENT", sentAt: new Date() },
  });
  await logAudit({
    companyId: quote.companyId,
    entityType: "Quote",
    entityId: quote.id,
    action: "sent",
    performedByUserId: user.id,
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function declineQuote(quoteId: string) {
  const user = await requireUser();
  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "DECLINED", declinedAt: new Date() },
  });
  await logAudit({
    companyId: quote.companyId,
    entityType: "Quote",
    entityId: quote.id,
    action: "declined",
    performedByUserId: user.id,
  });
  revalidatePath(`/quotes/${quoteId}`);
}

/**
 * Marks a quote approved and converts it into a Job. This stands in for the
 * client portal's self-serve approval flow (Phase 5) — for now, staff record
 * the approval on the client's behalf (e.g. after a phone call or email reply).
 */
export async function approveQuote(quoteId: string) {
  const user = await requireUser();

  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
  if (quote.status === "APPROVED") return;

  const jobCount = await prisma.job.count({ where: { companyId: quote.companyId } });

  const job = await prisma.$transaction(async (tx) => {
    const updated = await tx.quote.update({
      where: { id: quoteId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    return tx.job.create({
      data: {
        companyId: updated.companyId,
        clientId: updated.clientId,
        propertyId: updated.propertyId,
        quoteId: updated.id,
        jobNumber: formatRecordNumber("J", jobCount),
        title: updated.title,
        trade: updated.trade,
        quotedTotal: updated.total,
        createdByUserId: user.id,
      },
    });
  });

  await logAudit({
    companyId: quote.companyId,
    entityType: "Quote",
    entityId: quote.id,
    action: "approved",
    performedByUserId: user.id,
    metadata: { jobId: job.id },
  });

  revalidatePath(`/quotes/${quoteId}`);
  redirect(`/jobs/${job.id}`);
}

export async function recordDeposit(quoteId: string, formData: FormData) {
  const user = await requireUser();
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });

  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "CARD") as PaymentMethod;
  if (amount <= 0) throw new Error("Enter a deposit amount greater than zero.");

  await prisma.payment.create({
    data: {
      clientId: quote.clientId,
      type: "DEPOSIT",
      method,
      amount,
      notes: `Deposit for quote ${quote.quoteNumber}`,
    },
  });

  await logAudit({
    companyId: quote.companyId,
    entityType: "Quote",
    entityId: quote.id,
    action: "deposit_recorded",
    performedByUserId: user.id,
    metadata: { amount },
  });

  revalidatePath(`/quotes/${quoteId}`);
}
