
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const adapter = new PrismaMariaDb({
  host: requiredEnv("DATABASE_HOST"),
  port: Number(requiredEnv("DATABASE_PORT")),
  user: requiredEnv("DATABASE_USER"),
  password: requiredEnv("DATABASE_PASSWORD"),
  database: requiredEnv("DATABASE_NAME"),
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const rl = createInterface({ input, output });

  try {
    console.log("\nCreate Campus Resolve AI Test Student\n");

    const name = (await rl.question("Student name: ")).trim();

    const email = (
      await rl.question("Your real email: ")
    ).trim().toLowerCase();

    const rollNo = (
      await rl.question("Test roll number [TEST-2026-002]: ")
    ).trim() || "TEST-2026-002";

    const department = (
      await rl.question("Department [CSE-AIML]: ")
    ).trim() || "CSE-AIML";

    const password = await rl.question("New test password: ");

    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8
    ) {
      throw new Error(
        "Provide a name, valid email, and password of at least 8 characters."
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { rollNo }],
      },
      select: { id: true },
    });

    if (existing) {
      throw new Error(
        "A user with this email or roll number already exists. No changes made."
      );
    }

    const passwordHash = await hash(password, 12);

    const student = await prisma.user.create({
      data: {
        name,
        email,
        rollNo,
        department,
        role: "STUDENT",
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true,
        department: true,
        role: true,
      },
    });

    console.log("\nStudent account created successfully!");
    console.table(student);
  } finally {
    rl.close();
  }
}

main()
  .catch((error) => {
    console.error("Account creation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
