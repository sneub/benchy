import { prisma } from "./index";

async function main() {
  const users = Array.from({ length: 10000 }, (_, i) => ({
    email: `user${i + 1}@example.com`,
    name: `User ${i + 1}`,
  }));

  await prisma.user.createMany({
    data: users,
  });

  console.log("seed data added.");
}

main();
