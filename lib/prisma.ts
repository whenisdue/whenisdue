import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      event: {
        async findMany({ args, query }) {
          // Global "95% Safety" Filter: Never show archived events to the public
          args.where = { ...args.where, isArchived: false };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, isArchived: false };
          return query(args);
        },
      },
    },
  });
};

// Explicitly tell TypeScript this global variable is allowed
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Use this "publicPrisma" for all user-facing queries
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;