import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const adapter = new PrismaMariaDb({
  host: getRequiredEnvironmentVariable("DATABASE_HOST"),
  port: Number(getRequiredEnvironmentVariable("DATABASE_PORT")),
  user: getRequiredEnvironmentVariable("DATABASE_USER"),
  password: getRequiredEnvironmentVariable("DATABASE_PASSWORD"),
  database: getRequiredEnvironmentVariable("DATABASE_NAME"),
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

async function upsertUser(data: {
  name: string;
  email: string;
  role: "STUDENT" | "STAFF" | "ADMIN";
  passwordHash: string;
  department?: string;
  rollNo?: string;
}) {
  return prisma.user.upsert({
    where: {
      email: data.email,
    },

    update: {
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role,
      department: data.department,
      rollNo: data.rollNo,
    },

    create: {
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      department: data.department,
      rollNo: data.rollNo,
    },
  });
}

async function main() {
  console.log("Starting CampusResolve database seed...");

  const defaultPassword = getRequiredEnvironmentVariable(
    "SEED_DEFAULT_PASSWORD"
  );

  const passwordHash = await hash(defaultPassword, 12);

  const admin = await upsertUser({
    name: "System Administrator",
    email: "admin@campusresolve.local",
    role: "ADMIN",
    passwordHash,
    department: "Administration",
  });

  const maintenanceStaff = await upsertUser({
    name: "Maintenance Head",
    email: "maintenance@campusresolve.local",
    role: "STAFF",
    passwordHash,
    department: "Maintenance",
  });

  const hod = await upsertUser({
    name: "Academic HOD",
    email: "hod@campusresolve.local",
    role: "STAFF",
    passwordHash,
    department: "Academic",
  });

  const hostelWarden = await upsertUser({
    name: "Hostel Warden",
    email: "warden@campusresolve.local",
    role: "STAFF",
    passwordHash,
    department: "Hostel",
  });

  const antiRaggingStaff = await upsertUser({
    name: "Anti-Ragging Committee",
    email: "antiragging@campusresolve.local",
    role: "STAFF",
    passwordHash,
    department: "Student Safety",
  });

  const administrationStaff = await upsertUser({
    name: "Administration Office",
    email: "administration@campusresolve.local",
    role: "STAFF",
    passwordHash,
    department: "Administration",
  });

  const studentAffairsStaff = await upsertUser({
    name: "Student Affairs Officer",
    email: "studentaffairs@campusresolve.local",
    role: "STAFF",
    passwordHash,
    department: "Student Affairs",
  });

  const student = await upsertUser({
    name: "Test Student",
    email: "student@campusresolve.local",
    role: "STUDENT",
    passwordHash,
    department: "CSE-AIML",
    rollNo: "TEST-001",
  });

  const categories = [
    {
      name: "Infrastructure",
      responsibleStaffId: maintenanceStaff.id,
      highSlaHours: 6,
      mediumSlaHours: 48,
      lowSlaHours: 120,
    },
    {
      name: "Faculty/Academic",
      responsibleStaffId: hod.id,
      highSlaHours: 6,
      mediumSlaHours: 48,
      lowSlaHours: 120,
    },
    {
      name: "Hostel",
      responsibleStaffId: hostelWarden.id,
      highSlaHours: 6,
      mediumSlaHours: 24,
      lowSlaHours: 72,
    },
    {
      name: "Safety/Ragging",
      responsibleStaffId: antiRaggingStaff.id,
      highSlaHours: 1,
      mediumSlaHours: 6,
      lowSlaHours: 24,
    },
    {
      name: "Administration",
      responsibleStaffId: administrationStaff.id,
      highSlaHours: 12,
      mediumSlaHours: 48,
      lowSlaHours: 120,
    },
    {
      name: "Other",
      responsibleStaffId: studentAffairsStaff.id,
      highSlaHours: 12,
      mediumSlaHours: 48,
      lowSlaHours: 120,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        name: category.name,
      },

      update: {
        responsibleStaffId: category.responsibleStaffId,
        highSlaHours: category.highSlaHours,
        mediumSlaHours: category.mediumSlaHours,
        lowSlaHours: category.lowSlaHours,
        active: true,
      },

      create: {
        name: category.name,
        responsibleStaffId: category.responsibleStaffId,
        highSlaHours: category.highSlaHours,
        mediumSlaHours: category.mediumSlaHours,
        lowSlaHours: category.lowSlaHours,
        active: true,
      },
    });
  }

  console.log("Seed completed successfully.");
  console.log(`Admin created: ${admin.email}`);
  console.log(`Test student created: ${student.email}`);
  console.log(`${categories.length} complaint categories created.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });