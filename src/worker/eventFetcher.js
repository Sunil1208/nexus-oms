import { pool } from "../lib/db.js";
import { dashbaordQueue } from "../lib/redis.js";

export async function fetchAndQueueEvents(batchSize = 10000) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Fetch DISTINCT order_ids that have pending events
    // Get DISTINCT order_ids (No locking)
    const res = await client.query(
      `
                SELECT DISTINCT order_id
                FROM sync_events_log
                WHERE status = 'PENDING'
                ORDER BY order_id
                LIMIT $1
            `,
      [batchSize]
    );

    if (res.rows.length === 0) {
      await client.query("COMMIT");
      console.log("No pending events to process.");
      return 0;
    }

    const orderIds = res.rows.map((row) => row.order_id);

    // Mark these events as LOCKED (still PENDING)
    // We do not change the status yet - worker will mark COMPLETED later
    // console.log(`Fetched ${orderIds.length} pending order(s) from outbox`);

    // Lock only the rows belonging to these order_ids
    await client.query(
      `
                SELECT event_id
                FROM sync_events_log
                WHERE status = 'PENDING'
                AND order_id = ANY($1::bigint[])
                FOR UPDATE SKIP LOCKED
            `,
      [orderIds]
    );
    // console.log(`Fetched and locked ${orderIds.length} order(s)`);

    // Enqueue a job for each order_id
    for (const orderId of orderIds) {
      await dashbaordQueue.add("sync-order", { orderId });
      //   console.log(`Enqueued sync-order job for order_id: ${orderId}`);
    }

    await client.query("COMMIT");
    return orderIds.length;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error fetching and queuing events:", err);
    throw err;
  } finally {
    client.release();
  }
}
