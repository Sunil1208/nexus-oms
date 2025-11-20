import fetch from "node-fetch";

async function testFast(iterations = 1000) {
    const url = "http://localhost:3000/api/dashboard/fast";

    let total = 0;

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        await fetch(url).then(r => r.json());
        const end = performance.now();

        total += (end - start);

        if (i % 100 === 0) {
             console.log(`FAST: ${i} requests done...`);
        }
    }

    console.log("------ FAST DASHBOARD RESULTS ------");
    console.log(`Total requests: ${iterations}`);
    console.log(`Average latency: ${(total / iterations).toFixed(2)} ms`);
}

testFast();