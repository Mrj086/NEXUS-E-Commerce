import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
  const r = await db.product.deleteMany({
    where: { name: { in: ['CRUD Test', 'DevTest', 'Standalone Test', 'URL Test Product', 'Fix Test Product'] } }
  })
  console.log('Cleaned', r.count, 'test products')
  const c = await db.product.count({ where: { sellerId: 'cmsxnyyop0004oinvqpgte8zx' } })
  console.log('Remaining:', c)
  await db.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
