import express from "express";

import { testDbConnection } from "./lib/db.js";
import { dashbaordQueue } from "./lib/redis.js";
import { dashboardFastHandler } from "./api/dashboardFast.js";
import { dashboardLegacyHandler } from "./api/dashboardLegacy.js";

async function main() {
    console.log("Nexus-OMS API starting...");

    // DB Test
    const now = await testDbConnection();
    console.log("PostgreSQL connected, current time:", now);

    const app = express();
    
    app.use(express.json());

    // Fast dashboard endpoint
    app.get("/api/dashboard/fast", dashboardFastHandler);
    // Legacy dashboard endpoint
    app.get("/api/dashboard/legacy", dashboardLegacyHandler);

    // health
    app.get("/api/health", (req, res) => {
        res.json({ ok: true, message: "API is healthy" });
    });

    // start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Nexus-OMS API server running on port ${PORT}`);
    });

    // Redis/BullMQ Test
    // await dashbaordQueue.add("health-check", { timestamp: new Date().toISOString() });
    // console.log("Added health-check job to BullMQ queue");

    // console.log("Nexus-OMS API started successfully.");

    // console.log("Bull MQ is working (job enqueued).");
    // console.log("API boot complete.")
}

main().catch((err) => {
    console.error("Error during API startup:", err);
    process.exit(1);
});