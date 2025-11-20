------------------------------------------------------------
-- CHANGE DATA CAPTURE (CDC) TRIGGER SYSTEM
-- Nexus-OMS — Version 1.0
-- Every DML event is recorded in sync_events_log using order_id
------------------------------------------------------------

------------------------------------------------------------
-- GENERIC TRIGGER FUNCTION
------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_event()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id BIGINT;
BEGIN
  ------------------------------------------------------------
  -- Determine order_id from the table
  ------------------------------------------------------------
  
  IF (TG_TABLE_NAME = 'orders') THEN
    v_order_id := NEW.id;

  ELSIF (TG_TABLE_NAME = 'order_items') THEN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

  ELSIF (TG_TABLE_NAME = 'payments') THEN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

  ELSIF (TG_TABLE_NAME = 'shipments') THEN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

  ELSIF (TG_TABLE_NAME = 'support_tickets') THEN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

  ELSE
    RAISE WARNING 'No trigger logic defined for table %', TG_TABLE_NAME;
    RETURN NULL;
  END IF;

  ------------------------------------------------------------
  -- Insert event into Outbox table
  ------------------------------------------------------------
  INSERT INTO sync_events_log (
    order_id,
    source_table,
    operation
  )
  VALUES (
    v_order_id,
    TG_TABLE_NAME,
    TG_OP
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- ATTACH TRIGGERS TO TABLES
------------------------------------------------------------

-- Orders
CREATE TRIGGER trg_orders_cdc
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION record_event();

-- Order Items
CREATE TRIGGER trg_order_items_cdc
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION record_event();

-- Payments
CREATE TRIGGER trg_payments_cdc
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION record_event();

-- Shipments
CREATE TRIGGER trg_shipments_cdc
AFTER INSERT OR UPDATE OR DELETE ON shipments
FOR EACH ROW EXECUTE FUNCTION record_event();

-- Support Tickets
CREATE TRIGGER trg_support_tickets_cdc
AFTER INSERT OR UPDATE OR DELETE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION record_event();
