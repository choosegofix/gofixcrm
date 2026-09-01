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
import { resolvePersonContactId } from "@/lib/people";
import type { PaymentMethod } from "@prisma/client";

function parseLineItems(formData: FormData) {
  const rowCount = Number(formData.get("rowCount") ?? 0);
  const items: { description: string; quantity: number; unitPrice: number }[] = [];

  for (let i = 0; i < rowCount; i++) {
    const description = String(formData.get(`desc_${i}`) ?? "").trim();
    const quantity = Number(formData.get(`qty_${i}`) ?? 0);
    const unitPrice = Number(formData.get(`price_${i}`) ?? 0);
    if (!description || quantity <= 0) continue;
    items.push({ description, quantity, unitPrice });
  }

  return items;
}

export async function createInvoice(formData: FormData) {
  const user = await requireUser();
  const company = await getCompany();

  const jobId = String(formData.get("jobId") ?? "");
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  if (!jobId || !dueDateRaw) throw new Error("Job and due date are required.");

  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });

  const items = parseLineItems(formData);
  if (items.length === 0) throw new Error("Add at least one line item.");

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  const invoiceCount = await prisma.invoice.count({ where: { companyId: company.id } });

  const billingContactName = String(formData.get("billingContactName") ?? "").trim();
  const billingContactId = billingContactName
    ? await resolvePersonContactId(company.id, billingContactName, {
        email: String(formData.get("billingContactEmail") ?? "") || null,
        phone: String(formData.get("billingContactPhone") ?? "") || null,
      })
    : null;

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      clientId: job.clientId,
      jobId: job.id,
      billingContactId,
      invoiceNumber: formatRecordNumber("INV", invoiceCount),
      status: "SENT",
      issueDate: new Date(),
      dueDate: parseISO(dueDateRaw),
      subtotal,
      taxAmount,
      total,
      notes: String(formData.get("notes") ?? "") || null,
      createdByUserId: user.id,
      lineItems: {
        create: items.map((item, i) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: i,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  });

  await prisma.job.update({ where: { id: job.id }, data: { status: "INVOICED", invoicedAt: new Date() } });

  await logAudit({
    companyId: company.id,
    entityType: "Invoice",
    entityId: invoice.id,
    action: "created",
    performedByUserId: user.id,
    metadata: { jobId: job.id },
  });

  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(invoiceId: string, formData: FormData) {
  const user = await requireUser();
  const company = await getCompany();

  const existing = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (existing.status === "VOID" || Number(existing.amountPaid) > 0) {
    throw new Error("This invoice can't be edited anymore — it's void or already has payments recorded.");
  }

  const dueDateRaw = String(formData.get("dueDate") ?? "");
  if (!dueDateRaw) throw new Error("Due date is required.");

  const items = parseLineItems(formData);
  if (items.length === 0) throw new Error("Add at least one line item.");

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;

  const billingContactName = String(formData.get("billingContactName") ?? "").trim();
  const billingContactId = billingContactName
    ? await resolvePersonContactId(company.id, billingContactName, {
        email: String(formData.get("billingContactEmail") ?? "") || null,
        phone: String(formData.get("billingContactPhone") ?? "") || null,
      })
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLineItem.deleteMany({ where: { invoiceId } });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        dueDate: parseISO(dueDateRaw),
        billingContactId,
        subtotal,
        taxAmount,
        total,
        notes: String(formData.get("notes") ?? "") || null,
        lineItems: {
          create: items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sortOrder: i,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
    });
  });

  await logAudit({
    companyId: company.id,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "updated",
    performedByUserId: user.id,
  });

  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

export async function recordPayment(invoiceId: string, formData: FormData) {
  const user = await requireUser();

  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "CARD") as PaymentMethod;
  if (amount <= 0) throw new Error("Enter a payment amount greater than zero.");

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      type: "INVOICE_PAYMENT",
      method,
      amount,
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  const newAmountPaid = Number(invoice.amountPaid) + amount;
  const newStatus = newAmountPaid >= Number(invoice.total) ? "PAID" : "PARTIALLY_PAID";

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { amountPaid: newAmountPaid, status: newStatus },
  });

  await logAudit({
    companyId: invoice.companyId,
    entityType: "Invoice",
    entityId: invoice.id,
    action: "payment_recorded",
    performedByUserId: user.id,
    metadata: { paymentId: payment.id, amount },
  });

  revalidatePath(`/invoices/${invoiceId}`);
}
