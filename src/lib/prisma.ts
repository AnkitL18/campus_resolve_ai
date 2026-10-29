import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: getRequiredEnvironmentVariable("DATABASE_HOST"),
    port: Number(
      getRequiredEnvironmentVariable("DATABASE_PORT")
    ),
    user: getRequiredEnvironmentVariable("DATABASE_USER"),
    password: getRequiredEnvironmentVariable("DATABASE_PASSWORD"),
    database: getRequiredEnvironmentVariable("DATABASE_NAME"),
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });

  return new PrismaClient({
    adapter,
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
