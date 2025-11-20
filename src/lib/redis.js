import IORedis from "ioredis";
import { Queue } from "bullmq";
import { config } from "../config/env.js";

export const redis = new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null, // Important for BullMQ
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

redis.on("connect", () => {
    console.log("Connected to Redis server");
});

export const dashbaordQueue = new Queue(config.queueName, {
    connection: redis,
});