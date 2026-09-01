import { prisma } from "@/lib/prisma";

/**
 * Resolves a typed name to an existing staff User or Contact, or creates a
 * new Contact if neither matches. Used everywhere a person gets typed into
 * the CRM (crew members, invoice billing contacts, ...) so the same name
 * always resolves to the same underlying person instead of creating
 * duplicates, and every person ends up with a contact card.
 */
export async function resolvePersonByName(
  companyId: string,
  typedName: string,
  extra?: { email?: string | null; phone?: string | null }
): Promise<{ userId: string } | { contactId: string }> {
  const name = typedName.trim();

  const matchedUser = await prisma.user.findFirst({
    where: { companyId, isActive: true, name: { equals: name, mode: "insensitive" } },
  });
  if (matchedUser) {
    await ensureContactForUser(matchedUser.id);
    return { userId: matchedUser.id };
  }

  const contacts = await prisma.contact.findMany({ where: { companyId, userId: null } });
  const matchedContact = contacts.find(
    (c) => `${c.firstName} ${c.lastName}`.trim().toLowerCase() === name.toLowerCase()
  );
  if (matchedContact) return { contactId: matchedContact.id };

  const [firstName, ...rest] = name.split(" ");
  const newContact = await prisma.contact.create({
    data: {
      companyId,
      firstName,
      lastName: rest.join(" "),
      email: extra?.email || null,
      phone: extra?.phone || null,
    },
  });
  return { contactId: newContact.id };
}

/** Same resolution as resolvePersonByName, but always returns a Contact id
 *  (ensuring one exists for a matched User) -- for callers that need to
 *  point a foreign key at a contact specifically, e.g. Invoice.billingContactId. */
export async function resolvePersonContactId(
  companyId: string,
  typedName: string,
  extra?: { email?: string | null; phone?: string | null }
): Promise<string> {
  const person = await resolvePersonByName(companyId, typedName, extra);
  if ("contactId" in person) return person.contactId;
  const contact = await ensureContactForUser(person.userId);
  return contact.id;
}

/** Every staff User gets a linked contact card -- create one if it's missing. */
export async function ensureContactForUser(userId: string) {
  const existing = await prisma.contact.findUnique({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const [firstName, ...rest] = user.name.split(" ");
  return prisma.contact.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      firstName,
      lastName: rest.join(" "),
      email: user.email,
      phone: user.phone,
      title: "Staff",
    },
  });
}
