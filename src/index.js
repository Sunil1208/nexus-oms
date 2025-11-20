import { testDbConnection } from "./lib/db.js";
import { dashbaordQueue } from "./lib/redis.js";

async function main() {
    console.log("Nexus-OMS API starting...");

    // DB Test
    const now = await testDbConnection();
    console.log("PostgreSQL connected, current time:", now);

    // Redis/BullMQ Test
    await dashbaordQueue.add("health-check", { timestamp: new Date().toISOString() });
    console.log("Added health-check job to BullMQ queue");

    console.log("Nexus-OMS API started successfully.");

    console.log("Bull MQ is working (job enqueued).");
    console.log("API boot complete.")
}

main().catch((err) => {
    console.error("Error during API startup:", err);
    process.exit(1);
});