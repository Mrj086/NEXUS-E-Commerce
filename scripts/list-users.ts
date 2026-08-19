import { db } from '../src/lib/db';

async function main() {
  const users = await db.user.findMany({
    where: { role: { in: ['CUSTOMER', 'SELLER'] } },
    select: { email: true, role: true, name: true },
    orderBy: [{ role: 'asc' }, { email: 'asc' }]
  });
  console.log('All accounts use password: demo1234\n');
  console.log('EMAIL | ROLE | NAME');
  console.log('------|------|-----');
  for (const u of users) {
    console.log(`${u.email} | ${u.role} | ${u.name}`);
  }
  await db.$disconnect();
}
main();
