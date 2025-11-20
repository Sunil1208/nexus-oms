import { query } from "../lib/db.js";

/**
 * GET /api/dashboard/fast
 * Highly Optimized CQRS read API
 */
export async function dashboardFastHandler(req, res) {
    try {
        const {
        vip_tier,
        shipping_status,
        is_delayed,
        from,
        to,
        limit = 100,
        offest = 0,
    } = req.query;

    const conditions = [];
    const params = [];
    
    // Dynanmic filters (optional)
    if (vip_tier) {
        params.push(vip_tier);
        conditions.push(`vip_tier = $${params.length}`);
    }

    if (shipping_status) {
        params.push(shipping_status);
        conditions.push(`shipping_status = $${params.length}`);
    }

    if (is_delayed !== undefined) {
        params.push(is_delayed === "true");
        conditions.push(`is_delayed = $${params.length}`);
    }

    if (from) {
        params.push(from);
        conditions.push(`order_created_at >= $${params.length}`);   
    }

    if (to) {
        params.push(to);
        conditions.push(`order_created_at <= $${params.length}`);   
    }

    const whereCaluse = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    params.push(limit);
    params.push(offest);

    const sql = `
        SELECT *
        FROM read_ops_dashboard
        ${whereCaluse}
        ORDER BY order_created_at DESC
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
    `;

    const result = await query(sql, params);

    return res.json({
        ok: true,
        count: result.rows.length,
        orders: result.rows
    });

    } catch (error) {
       console.error("/api/dashboard/fast error:", error);
         return res.status(500).json({ ok: false, error: error.message }); 
    }
}