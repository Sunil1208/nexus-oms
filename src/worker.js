import { Worker } from "bullmq";
import { redis } from "./lib/redis.js";
import { config } from "./config/env.js";
import { startScheduler } from "./worker/scheduler.js";
import { processOrder } from "./worker/orderProcessor.js";

async function main() {
  console.log("Nexus-OMS Worker starting...");

  const worker = new Worker(
    config.queueName,
    async (job) => {
      //   console.log(
      //     `Processing job ${job.id} of type ${job.name} with data:`,
      //     job.data
      //   );

      const { orderId } = job.data;
      await processOrder(orderId);

      // console.log(`Job ${job.id} for order_id ${orderId} processed successfully.`);
      return { ok: true };
    },
    { connection: redis }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} has completed.`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} has failed with error:`, err);
  });

  startScheduler();

  console.log("Worker online and awaiting jobs...");
}

main().catch((err) => {
  console.error("Error in worker:", err);
  process.exit(1);
});
