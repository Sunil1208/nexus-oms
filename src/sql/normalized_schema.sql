------------------------------------------------------------
--  NORMALIZED DATABASE SCHEMA (SOURCE OF TRUTH)
--  Nexus-OMS — Version 1.0
--  Fully normalized 3NF schema for large-scale ecommerce
------------------------------------------------------------

-- Safety
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

------------------------------------------------------------
--  IDENTITY DOMAIN
------------------------------------------------------------

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

------------------------------------------------------------

CREATE TABLE addresses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

------------------------------------------------------------

CREATE TABLE memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,                    -- BASIC, SILVER, GOLD, VIP
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memberships_user ON memberships(user_id);

------------------------------------------------------------
--  CATALOG DOMAIN
------------------------------------------------------------

CREATE TABLE brands (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

------------------------------------------------------------

CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contact_email TEXT
);

------------------------------------------------------------

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  brand_id BIGINT REFERENCES brands(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);

------------------------------------------------------------

CREATE TABLE warehouses (
  id BIGSERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL
);

------------------------------------------------------------

CREATE TABLE inventory_levels (
  id BIGSERIAL PRIMARY KEY,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory_levels(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory_levels(warehouse_id);

------------------------------------------------------------
--  COMMERCE DOMAIN
------------------------------------------------------------

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  warehouse_id BIGINT REFERENCES warehouses(id),
  status TEXT NOT NULL,                           -- PENDING, PAID, SHIPPED, DELIVERED
  total_amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

------------------------------------------------------------

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

------------------------------------------------------------

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL,                          -- CARD, PAYPAL, COD, etc.
  status TEXT NOT NULL,                          -- PENDING, PAID, FAILED
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);

------------------------------------------------------------
--  LOGISTICS DOMAIN
------------------------------------------------------------

CREATE TABLE shipments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  carrier TEXT NOT NULL,
  tracking_number TEXT,
  status TEXT NOT NULL,                           -- CREATED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED
  expected_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);

------------------------------------------------------------

CREATE TABLE tracking_events (
  id BIGSERIAL PRIMARY KEY,
  shipment_id BIGINT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracking_events_shipment ON tracking_events(shipment_id);

------------------------------------------------------------
--  SUPPORT DOMAIN
------------------------------------------------------------

CREATE TABLE support_tickets (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  severity TEXT NOT NULL,                        -- LOW, MEDIUM, HIGH, CRITICAL
  message TEXT,
  status TEXT DEFAULT 'OPEN',                    -- OPEN, CLOSED
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_order ON support_tickets(order_id);

------------------------------------------------------------

CREATE TABLE returns (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  reason TEXT,
  status TEXT NOT NULL,                          -- REQUESTED, APPROVED, REJECTED
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------

CREATE TABLE refunds (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id),
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,                          -- INITIATED, COMPLETED, FAILED
  created_at TIMESTAMPTZ DEFAULT NOW()
);
