// Prints the numbers the business review asked for, as Markdown for STATE.md.
// Counts only: no names, emails or any personal data.
//
//   DATABASE_URL=<production url> npm run state        (from backend/)
//
// "Euros collected" counts paid purchases only; hardship codes are amount 0
// and are listed separately. Authored hours come from `npm run curriculum:audit`
// at the repo root.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [signups, signupsWeek, purchases, certificates, completedRows] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.credentialPurchase.findMany({ select: { amountCents: true } }),
    prisma.certificate.count(),
    prisma.lessonProgress.findMany({
      where: { status: 'completed' },
      distinct: ['userId'],
      select: { userId: true },
    }),
  ]);

  const paid = purchases.filter((p) => p.amountCents > 0);
  const hardship = purchases.length - paid.length;
  const euros = paid.reduce((sum, p) => sum + p.amountCents, 0) / 100;
  const today = new Date().toISOString().slice(0, 10);

  console.log(`# State of Soft Reset School (${today})

| Number | Value |
| --- | --- |
| Signups (all time) | ${signups} |
| Signups, last 7 days | ${signupsWeek} |
| Learners who finished at least one lesson | ${completedRows.length} |
| Paid credentials | ${paid.length} |
| Hardship-code credentials | ${hardship} |
| Euros collected (paid, VAT-inclusive) | €${euros.toFixed(2)} |
| Certificates issued | ${certificates} |

Unique visitors come from your analytics (Umami or GA4), and authored hours from
\`npm run curriculum:audit\`.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
