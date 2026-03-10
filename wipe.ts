import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Wiping old Event tables to allow schema update...")
  
  // This bypasses Prisma's type safety to drop the data directly in the database
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Event" CASCADE;`)
  
  console.log("Old events wiped! You are safe to db push now.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })