"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireUser } from "@/lib/session";

const TAG_PALETTE = ["#2E4A63", "#8A5A19", "#1F5C51", "#6B3A5E", "#8C2F1F", "#3F3577"];

function colorForTag(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

export async function addTagToJob(jobId: string, formData: FormData) {
  await requireUser();
  const company = await getCompany();

  const existingTagId = String(formData.get("tagId") ?? "");
  const newTagName = String(formData.get("newTagName") ?? "").trim();

  let tagId = existingTagId;
  if (!tagId && newTagName) {
    const tag = await prisma.tag.upsert({
      where: { companyId_name: { companyId: company.id, name: newTagName } },
      update: {},
      create: { companyId: company.id, name: newTagName, color: colorForTag(newTagName) },
    });
    tagId = tag.id;
  }

  if (!tagId) throw new Error("Pick an existing tag or type a new one.");

  await prisma.tagOnJob.upsert({
    where: { tagId_jobId: { tagId, jobId } },
    update: {},
    create: { tagId, jobId },
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function removeTagFromJob(jobId: string, tagId: string) {
  await requireUser();
  await prisma.tagOnJob.delete({ where: { tagId_jobId: { tagId, jobId } } });
  revalidatePath(`/jobs/${jobId}`);
}
