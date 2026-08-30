import { PrismaClient } from "@prisma/client";

// dev 热重载下复用同一个 client，避免连接泄漏
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
