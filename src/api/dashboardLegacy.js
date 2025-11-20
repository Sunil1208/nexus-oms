import { query } from "../lib/db.js";

/**
 * GET /api/dashboard/legacy
 * This API uses the normalized schema with heavy joins.
 * It is intentionally slow when data grows large.
 */
export async function dashboardLegacyHandler(req, res) {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const sql = `
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
      JOIN users u ON u.id = o.user_id
      LEFT JOIN memberships m
        ON m.user_id = u.id
        AND (m.valid_until IS NULL OR m.valid_until >= NOW())

      LEFT JOIN LATERAL (
        SELECT status
        FROM payments p
        WHERE p.order_id = o.id
        ORDER BY p.created_at DESC
        LIMIT 1
      ) pmt ON TRUE

      LEFT JOIN LATERAL (
        SELECT status, expected_delivery
        FROM shipments s
        WHERE s.order_id = o.id
        ORDER BY s.created_at DESC
        LIMIT 1
      ) shp ON TRUE

      LEFT JOIN warehouses w ON w.id = o.warehouse_id

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

      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await query(sql, [limit, offset]);

    return res.json({
      ok: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error("/api/dashboard/legacy error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
