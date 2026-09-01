"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireAdmin } from "@/lib/session";
import { ensureContactForUser } from "@/lib/people";
import type { Role } from "@prisma/client";

export async function createStaffUser(formData: FormData) {
  await requireAdmin();
  const company = await getCompany();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "FIELD") as Role;

  if (!name || !email || password.length < 8) {
    throw new Error("Name, email, and an 8+ character password are required.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name,
      email,
      passwordHash,
      role,
      phone: String(formData.get("phone") ?? "") || null,
    },
  });

  await ensureContactForUser(user.id);

  revalidatePath("/settings/users");
  revalidatePath("/contacts");
}

export async function deactivateUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  revalidatePath("/settings/users");
}
