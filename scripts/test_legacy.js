import fetch from "node-fetch";

async function testLegacy(iterations = 100) {
  const url = "http://localhost:3000/api/dashboard/legacy";

  let total = 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fetch(url).then((r) => r.json());
    const end = performance.now();

    total += end - start;

    if (i % 10 === 0) {
      console.log(`LEGACY: ${i} requests done...`);
    }
  }

  console.log("------ LEGACY DASHBOARD RESULTS ------");
  console.log(`Total requests: ${iterations}`);
  console.log(`Average latency: ${(total / iterations).toFixed(2)} ms`);
}

testLegacy();
