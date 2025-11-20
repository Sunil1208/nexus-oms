------------------------------------------------------------
--  READ MODEL (CQRS) + OUTBOX TABLE
--  Nexus-OMS — Version 1.0
------------------------------------------------------------

------------------------------------------------------------
--  READ MODEL TABLE (Denormalized for Fast Dashboard)
------------------------------------------------------------

CREATE TABLE read_ops_dashboard (
  order_id BIGINT PRIMARY KEY,

  customer_name TEXT NOT NULL,
  vip_tier TEXT,
  
  order_status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  shipping_status TEXT NOT NULL,

  warehouse_city TEXT,

  is_delayed BOOLEAN NOT NULL DEFAULT FALSE,
  ticket_severity TEXT,

  order_created_at TIMESTAMPTZ NOT NULL
);

-- High-performance index for dashboard filtering
CREATE INDEX idx_read_ops_vip_shipping_delay
ON read_ops_dashboard (
  vip_tier,
  is_delayed,
  shipping_status,
  order_created_at DESC
);

------------------------------------------------------------
--  OUTBOX TABLE (Transactional Events Log)
------------------------------------------------------------

CREATE TABLE sync_events_log (
  event_id BIGSERIAL PRIMARY KEY,

  order_id BIGINT NOT NULL,       -- aggregate root ID

  source_table TEXT NOT NULL,     -- orders, payments, shipments...
  operation TEXT NOT NULL,        -- INSERT, UPDATE, DELETE

  status TEXT NOT NULL DEFAULT 'PENDING',   -- PENDING, COMPLETED, ERROR

  retry_count INT NOT NULL DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core index for event fetcher (worker)
CREATE INDEX idx_outbox_order_pending
ON sync_events_log (order_id, status, created_at);

-- Additional index for troubleshooting / analytics
CREATE INDEX idx_outbox_created_at
ON sync_events_log (created_at);
