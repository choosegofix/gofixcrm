import type {
  JobStatus,
  Trade,
  Role,
  LeadStatus,
  QuoteStatus,
  VisitStatus,
  InvoiceStatus,
  PricingResponsibility,
  CrewType,
} from "@prisma/client";

export const tradeLabels: Record<Trade, string> = {
  HVAC: "HVAC",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
};

export const tradeColors: Record<Trade, string> = {
  HVAC: "bg-sky-100 text-sky-800 border-sky-200",
  ELECTRICAL: "bg-amber-100 text-amber-800 border-amber-200",
  PLUMBING: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const jobStatusLabels: Record<JobStatus, string> = {
  REQUESTED: "Requested",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const jobStatusColors: Record<JobStatus, string> = {
  REQUESTED: "bg-gray-100 text-gray-700 border-gray-200",
  SCHEDULED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-teal-100 text-teal-800 border-teal-200",
  INVOICED: "bg-purple-100 text-purple-800 border-purple-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export const jobStatusOrder: JobStatus[] = [
  "REQUESTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICED",
  "PAID",
];

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUOTED: "Quoted",
  WON: "Won",
  LOST: "Lost",
};

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export const visitStatusLabels: Record<VisitStatus, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  MISSED: "Missed",
};

export const visitStatusColors: Record<VisitStatus, string> = {
  SCHEDULED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-teal-100 text-teal-800 border-teal-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  MISSED: "bg-orange-100 text-orange-800 border-orange-200",
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export const pricingResponsibilityLabels: Record<PricingResponsibility, string> = {
  COMPANY_PRICED: "Company-priced",
  SUBCONTRACTOR_PRICED: "Subcontractor-priced",
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  OFFICE: "Office / Dispatcher",
  FIELD: "Field / Crew",
  SUBCONTRACTOR: "Subcontractor",
};

export const crewTypeLabels: Record<CrewType, string> = {
  INTERNAL: "Internal crew",
  SUBCONTRACTOR: "Subcontractor",
};
