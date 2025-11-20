import { pool } from "../lib/db.js";

/**
 * Fetch a fully-joined snapshot for a given order_id.
 * Fetch fresh steps for CQRS.
 */
async function fetchOrderSnapshot(client, orderId) {
    const { rows } = await client.query(
        `
            SELECT
                o.id AS order_id,
                u.full_name AS customer_name,
                m.tier AS vip_tier,
                o.status AS order_status,
                COALESCE(pmt.status, 'UNKNOWN') AS payment_status,
                COALESCE(shp.status, 'UNKNOWN') AS shipping_status,
                w.city AS warehouse_city,
                (
                    shp.expected_delivery IS NOT NULL
                    AND NOW() > shp.expected_delivery
                    AND shp.status <> 'DELIVERED'
                ) AS is_delayed,
                st.severity AS ticket_severity,
                o.created_at AS order_created_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN memberships m
                ON m.user_id = u.id
                AND (m.valid_until IS NULL OR m.valid_until >= NOW())
            -- latest payment for this order
            LEFT JOIN LATERAL (
                SELECT status
                FROM payments p
                WHERE p.order_id = o.id
                ORDER BY p.created_at DESC
                LIMIT 1
            ) pmt ON TRUE
            -- latest shipment for this order
            LEFT JOIN LATERAL (
                SELECT status, expected_delivery
                FROM shipments s
                WHERE s.order_id = o.id
                ORDER BY s.created_at DESC
                LIMIT 1
            ) shp ON TRUE
            LEFT JOIN warehouses w ON w.id = o.warehouse_id
            -- most severe / latest support ticket
            LEFT JOIN LATERAL (
                SELECT severity
                FROM support_tickets t
                WHERE t.order_id = o.id
                ORDER BY
                    CASE t.severity
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    WHEN 'LOW' THEN 4
                    ELSE 5
                    END,
                    t.created_at DESC
                LIMIT 1
            ) st ON TRUE
            WHERE o.id = $1
            LIMIT 1
                `,
        [orderId]
    );

    if (rows.length === 0) {
        return null; // order no longer exists (deleted)
    }
    return rows[0];
}

/**
 * Upser into read_ops_dashbaord (idempotent)
 */
async function upsertReadModel(client, snapshot) {
    const {
        order_id,
        customer_name,
        vip_tier,
        order_status,
        payment_status,
        shipping_status,
        warehouse_city,
        is_delayed,
        ticket_severity,
        order_created_at,
    } = snapshot;

     await client.query(
    `
    INSERT INTO read_ops_dashboard (
      order_id,
      customer_name,
      vip_tier,
      order_status,
      payment_status,
      shipping_status,
      warehouse_city,
      is_delayed,
      ticket_severity,
      order_created_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    ON CONFLICT (order_id) DO UPDATE
    SET
      customer_name   = EXCLUDED.customer_name,
      vip_tier        = EXCLUDED.vip_tier,
      order_status    = EXCLUDED.order_status,
      payment_status  = EXCLUDED.payment_status,
      shipping_status = EXCLUDED.shipping_status,
      warehouse_city  = EXCLUDED.warehouse_city,
      is_delayed      = EXCLUDED.is_delayed,
      ticket_severity = EXCLUDED.ticket_severity,
      order_created_at = EXCLUDED.order_created_at
    `,
    [
      order_id,
      customer_name,
      vip_tier,
      order_status,
      payment_status,
      shipping_status,
      warehouse_city,
      is_delayed,
      ticket_severity,
      order_created_at,
    ]
  );
}

/**
 * Delete from read_ops dashboard when the order no longer exists.
 */
async function deleteFromReadModel(client, orderId) {
    await client.query(
    `DELETE FROM read_ops_dashboard WHERE order_id = $1`,
    [orderId]
  );
}

/**
 * Mark all PENDING outbox events for this order as COMPLETED.
 */
async function markOutboxCompleted(client, orderId) {
  await client.query(
    `
    UPDATE sync_events_log
    SET status = 'COMPLETED',
        updated_at = NOW(),
        last_error = NULL
    WHERE order_id = $1
      AND status = 'PENDING'
    `,
    [orderId]
  );
}

/**
 * Increment retry_count and persist last_error on failure.
 */
async function markOutboxFailed(client, orderId, error) {
  await client.query(
    `
    UPDATE sync_events_log
    SET retry_count = retry_count + 1,
        last_error  = $1,
        updated_at  = NOW()
    WHERE order_id = $2
      AND status = 'PENDING'
    `,
    [String(error), orderId]
  );
}

/**
 * Main processing function for a single order_id:
 * - Fetch Fresh snapshot from normalized DB
 * - Upsert (or delete) read model entry
 * - Mark outbox as COMPLETED or increment retry on failure
 */
export async function processOrder(orderId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const snapshot = await fetchOrderSnapshot(client, orderId);

    if (!snapshot) {
      // Order doesn't exist anymore → ensure read model also doesn't
      await deleteFromReadModel(client, orderId);
    } else {
      await upsertReadModel(client, snapshot);
    }

    await markOutboxCompleted(client, orderId);

    await client.query("COMMIT");
  } catch (err) {
    console.error(`❌ Error processing order_id=${orderId}:`, err);

    try {
      // Abort current transaction first
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("❌ Error during ROLLBACK:", rollbackErr);
    }

    // Record failure stats (outside the aborted transaction)
    try {
      await markOutboxFailed(client, orderId, err);
    } catch (markErr) {
      console.error(
        "❌ Error updating outbox failure state for order_id=" + orderId,
        markErr
      );
    }

    throw err; // let BullMQ mark job as failed
  } finally {
    client.release();
  }
}