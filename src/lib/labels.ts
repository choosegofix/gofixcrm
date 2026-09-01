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
  CommPreference,
} from "@prisma/client";

export const commPreferenceLabels: Record<CommPreference, string> = {
  EMAIL: "Email",
  SMS: "SMS",
  PHONE: "Phone",
  ANY: "Any",
};

export const tradeLabels: Record<Trade, string> = {
  HVAC: "HVAC",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
};

export const tradeColors: Record<Trade, string> = {
  HVAC: "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  ELECTRICAL: "bg-[#FBEEDC] text-[#8A5A19] border-[#E9CBA0]",
  PLUMBING: "bg-[#E1EEEA] text-[#1F5C51] border-[#BFDAD2]",
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
  REQUESTED: "bg-[#EEEAE1] text-[#5B6B82] border-[#DDD6C7]",
  SCHEDULED: "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  IN_PROGRESS: "bg-[#FBE7DB] text-[#B83A0A] border-[#F0BFA0]",
  COMPLETED: "bg-[#E1EEEA] text-[#1F5C51] border-[#BFDAD2]",
  INVOICED: "bg-[#EFE3ED] text-[#6B3A5E] border-[#D9C0D3]",
  PAID: "bg-[#DEEBDD] text-[#1F5C33] border-[#B9D6B7]",
  CANCELLED: "bg-[#F3DEDA] text-[#8C2F1F] border-[#E0B3A9]",
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

const leadSourceLabels: Record<string, string> = {
  PHONE_CALL: "Phone call",
  WEBSITE_FORM: "Website form",
  REFERRAL: "Referral",
  REPEAT_CUSTOMER: "Repeat customer",
  GOOGLE_SEARCH: "Google / search",
  SOCIAL_MEDIA: "Social media",
  WALK_IN: "Walk-in",
};

export function formatLeadSource(source: string | null) {
  if (!source) return null;
  return leadSourceLabels[source] ?? source;
}

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
  SCHEDULED: "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  IN_PROGRESS: "bg-[#FBE7DB] text-[#B83A0A] border-[#F0BFA0]",
  COMPLETED: "bg-[#E1EEEA] text-[#1F5C51] border-[#BFDAD2]",
  CANCELLED: "bg-[#F3DEDA] text-[#8C2F1F] border-[#E0B3A9]",
  MISSED: "bg-[#FBEEDC] text-[#8A5A19] border-[#E9CBA0]",
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  DRAFT: "bg-[#EEEAE1] text-[#5B6B82] border-[#DDD6C7]",
  SENT: "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  PARTIALLY_PAID: "bg-[#FBE7DB] text-[#B83A0A] border-[#F0BFA0]",
  PAID: "bg-[#DEEBDD] text-[#1F5C33] border-[#B9D6B7]",
  OVERDUE: "bg-[#F3DEDA] text-[#8C2F1F] border-[#E0B3A9]",
  VOID: "bg-[#EEEAE1] text-[#5B6B82] border-[#DDD6C7]",
};

export const quoteStatusColors: Record<QuoteStatus, string> = {
  DRAFT: "bg-[#EEEAE1] text-[#5B6B82] border-[#DDD6C7]",
  SENT: "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  VIEWED: "bg-[#E4EBF1] text-[#2E4A63] border-[#C7D6E3]",
  APPROVED: "bg-[#DEEBDD] text-[#1F5C33] border-[#B9D6B7]",
  DECLINED: "bg-[#F3DEDA] text-[#8C2F1F] border-[#E0B3A9]",
  EXPIRED: "bg-[#EEEAE1] text-[#5B6B82] border-[#DDD6C7]",
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
