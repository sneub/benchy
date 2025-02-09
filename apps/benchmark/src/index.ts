import { prisma as prismaPpg } from "@repo/prisma-postgres";
import { prisma as prismaNeon } from "@repo/neon-postgres";
import { prisma as prismaSupabase } from "@repo/supabase-postgres";

async function runBenchmarks(prisma: typeof prismaPpg, dbName: string) {
  // Test 1: Connection cold start test (empty query)
  const firstQueryStart = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const firstQueryDuration = performance.now() - firstQueryStart;

  // Test 2: Connection latency test (empty query)
  const latencyStart = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const latencyDuration = performance.now() - latencyStart;

  // Test 3: Measure findMany performance
  const findManyStart = performance.now();
  const users = await prisma.user.findMany();
  const findManyDuration = performance.now() - findManyStart;

  // Test 4: Measure single record lookup by ID
  const sampleId = users[0].id;
  const findUniqueStart = performance.now();
  await prisma.user.findUnique({ where: { id: sampleId } });
  const findUniqueDuration = performance.now() - findUniqueStart;

  // Test 5: Measure batch operations (100 records at a time)
  const batchSize = 100;
  const batches = Math.ceil(users.length / batchSize);
  let totalBatchTime = 0;

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    // const end = Math.min(start + batchSize, users.length);
    const batchStart = performance.now();
    await prisma.user.findMany({
      skip: start,
      take: batchSize,
    });
    totalBatchTime += performance.now() - batchStart;
  }

  // Summary
  console.log(`\nBenchmark Summary for ${dbName}:`);
  console.log("------------------");
  console.log(`Total records: ${users.length}`);
  console.log(`First query time: ${firstQueryDuration.toFixed(2)}ms`);
  console.log(`Connection latency: ${latencyDuration.toFixed(2)}ms`);
  console.log(`Full table scan: ${findManyDuration.toFixed(2)}ms`);
  console.log(`Single record lookup: ${findUniqueDuration.toFixed(2)}ms`);
  console.log(
    `Avg batch query time: ${(totalBatchTime / batches).toFixed(2)}ms`
  );
}

async function main() {
  console.log("Starting database benchmark tests...");

  const clients = [
    { client: prismaPpg, name: "Prisma" },
    { client: prismaNeon, name: "Neon" },
    { client: prismaSupabase, name: "Supabase" },
  ];

  for (const { client, name } of clients) {
    await runBenchmarks(client, name);
  }
}

main();
