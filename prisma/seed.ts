import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const company = await prisma.company.upsert({
    where: { id: "gofix-company" },
    update: {},
    create: {
      id: "gofix-company",
      name: "GoFix Services",
      city: "Toronto",
      province: "ON",
      currency: "CAD",
      timezone: "America/Toronto",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@gofixservices.ca" },
    update: {},
    create: {
      companyId: company.id,
      name: "Sam Fixit (Admin)",
      email: "admin@gofixservices.ca",
      passwordHash,
      role: "ADMIN",
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: "office@gofixservices.ca" },
    update: {},
    create: {
      companyId: company.id,
      name: "Priya Nair (Office)",
      email: "office@gofixservices.ca",
      passwordHash,
      role: "OFFICE",
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: "field@gofixservices.ca" },
    update: {},
    create: {
      companyId: company.id,
      name: "Dave Chen (Field)",
      email: "field@gofixservices.ca",
      passwordHash,
      role: "FIELD",
      hourlyRate: 42.5,
    },
  });

  const subcontractor = await prisma.user.upsert({
    where: { email: "sub@brightsparkelectric.example" },
    update: {},
    create: {
      companyId: company.id,
      name: "Mo Aziz (Subcontractor)",
      email: "sub@brightsparkelectric.example",
      passwordHash,
      role: "SUBCONTRACTOR",
    },
  });

  const areaNames = ["Toronto", "North York", "Scarborough", "Mississauga", "Vaughan", "Markham"];
  const areas = Object.fromEntries(
    await Promise.all(
      areaNames.map(async (name) => {
        const area = await prisma.serviceArea.upsert({
          where: { companyId_name: { companyId: company.id, name } },
          update: {},
          create: { companyId: company.id, name },
        });
        return [name, area] as const;
      })
    )
  );

  const crew = await prisma.crew.upsert({
    where: { id: "crew-1" },
    update: {},
    create: {
      id: "crew-1",
      companyId: company.id,
      name: "Crew 1 — Dave & Mo",
      type: "INTERNAL",
      trades: ["HVAC", "ELECTRICAL"],
      serviceAreas: { create: [{ serviceAreaId: areas["Toronto"].id }, { serviceAreaId: areas["North York"].id }] },
    },
  });

  await prisma.crewMember.upsert({
    where: { crewId_userId: { crewId: crew.id, userId: tech.id } },
    update: {},
    create: { crewId: crew.id, userId: tech.id },
  });

  const subCrew = await prisma.crew.upsert({
    where: { id: "crew-subcontractor-1" },
    update: {},
    create: {
      id: "crew-subcontractor-1",
      companyId: company.id,
      name: "BrightSpark Electric",
      type: "SUBCONTRACTOR",
      trades: ["ELECTRICAL"],
      contactEmail: "dispatch@brightsparkelectric.example",
      serviceAreas: { create: [{ serviceAreaId: areas["Toronto"].id }] },
    },
  });

  await prisma.crewMember.upsert({
    where: { crewId_userId: { crewId: subCrew.id, userId: subcontractor.id } },
    update: {},
    create: { crewId: subCrew.id, userId: subcontractor.id },
  });

  const clientA = await prisma.client.upsert({
    where: { id: "client-maple-ridge" },
    update: {},
    create: {
      id: "client-maple-ridge",
      companyId: company.id,
      name: "Maple Ridge Property Management",
      notes: "Manages 4 buildings in North York. Prefers email.",
    },
  });

  const contactA = await prisma.contact.upsert({
    where: { id: "contact-maple-ridge-1" },
    update: {},
    create: {
      id: "contact-maple-ridge-1",
      clientId: clientA.id,
      firstName: "Linda",
      lastName: "Osei",
      title: "Property Manager",
      email: "linda@mapleridgepm.example",
      phone: "416-555-0142",
      commPreference: "EMAIL",
      isPrimary: true,
      isBilling: true,
    },
  });
  void contactA;

  const propertyA = await prisma.property.upsert({
    where: { id: "property-maple-ridge-1" },
    update: { serviceAreaId: areas["Toronto"].id, lat: 43.6488, lng: -79.3776 },
    create: {
      id: "property-maple-ridge-1",
      clientId: clientA.id,
      label: "Building A — 100 Yonge St",
      addressLine1: "100 Yonge St",
      city: "Toronto",
      province: "ON",
      postalCode: "M5C 2W1",
      serviceAreaId: areas["Toronto"].id,
      lat: 43.6488,
      lng: -79.3776,
      accessNotes: "Loading dock code: 4471#. Check in with concierge.",
    },
  });

  const clientB = await prisma.client.upsert({
    where: { id: "client-riverside" },
    update: {},
    create: {
      id: "client-riverside",
      companyId: company.id,
      name: "Riverside Medical Clinic",
    },
  });

  await prisma.contact.upsert({
    where: { id: "contact-riverside-1" },
    update: {},
    create: {
      id: "contact-riverside-1",
      clientId: clientB.id,
      firstName: "Marcus",
      lastName: "Webb",
      title: "Office Manager",
      email: "marcus@riversideclinic.example",
      phone: "416-555-0199",
      commPreference: "PHONE",
      isPrimary: true,
    },
  });

  const propertyB = await prisma.property.upsert({
    where: { id: "property-riverside-1" },
    update: { serviceAreaId: areas["Toronto"].id, lat: 43.6656, lng: -79.4093 },
    create: {
      id: "property-riverside-1",
      clientId: clientB.id,
      addressLine1: "455 Bloor St W",
      city: "Toronto",
      province: "ON",
      postalCode: "M5S 1X8",
      serviceAreaId: areas["Toronto"].id,
      lat: 43.6656,
      lng: -79.4093,
    },
  });

  const jobInProgress = await prisma.job.upsert({
    where: { id: "job-1001" },
    update: {},
    create: {
      id: "job-1001",
      companyId: company.id,
      clientId: clientA.id,
      propertyId: propertyA.id,
      jobNumber: "J-1001",
      title: "Rooftop RTU not cooling — Building A",
      description: "Tenants on 3rd floor reporting no cold air. Likely low refrigerant.",
      trade: "HVAC",
      status: "SCHEDULED",
      pricingResponsibility: "COMPANY_PRICED",
      scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24),
      scheduledEnd: new Date(Date.now() + 1000 * 60 * 60 * 26),
      createdByUserId: dispatcher.id,
    },
  });

  await prisma.visit.upsert({
    where: { id: "visit-1001-1" },
    update: {},
    create: {
      id: "visit-1001-1",
      jobId: jobInProgress.id,
      visitNumber: 1,
      scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24),
      scheduledEnd: new Date(Date.now() + 1000 * 60 * 60 * 26),
      status: "SCHEDULED",
    },
  });

  await prisma.jobAssignment.upsert({
    where: { id: "assignment-1001-1" },
    update: {},
    create: {
      id: "assignment-1001-1",
      jobId: jobInProgress.id,
      crewId: crew.id,
      role: "Lead",
    },
  });

  const jobElectrical = await prisma.job.upsert({
    where: { id: "job-1002" },
    update: {
      status: "SCHEDULED",
      scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 48),
      scheduledEnd: new Date(Date.now() + 1000 * 60 * 60 * 50),
    },
    create: {
      id: "job-1002",
      companyId: company.id,
      clientId: clientB.id,
      propertyId: propertyB.id,
      jobNumber: "J-1002",
      title: "Exam room outlet not working",
      description: "GFCI outlet in exam room 2 keeps tripping.",
      trade: "ELECTRICAL",
      status: "SCHEDULED",
      pricingResponsibility: "SUBCONTRACTOR_PRICED",
      scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 48),
      scheduledEnd: new Date(Date.now() + 1000 * 60 * 60 * 50),
      createdByUserId: dispatcher.id,
    },
  });

  await prisma.jobAssignment.upsert({
    where: { id: "assignment-1002-1" },
    update: {},
    create: {
      id: "assignment-1002-1",
      jobId: jobElectrical.id,
      crewId: subCrew.id,
      role: "Lead",
    },
  });

  console.log("Seed complete:");
  console.log(`  Company: ${company.name}`);
  console.log("  Staff logins (password: password123):");
  console.log(`    ${admin.email} — Admin`);
  console.log(`    ${dispatcher.email} — Office`);
  console.log(`    ${tech.email} — Field`);
  console.log(`    ${subcontractor.email} — Subcontractor (assigned to J-1002 only)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
