BEGIN;

CREATE SCHEMA IF NOT EXISTS rental_dashboard;

CREATE TABLE IF NOT EXISTS rental_dashboard.properties (
  id BIGSERIAL PRIMARY KEY,
  property_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_dashboard.buildings (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES rental_dashboard.properties(id) ON DELETE CASCADE,
  building_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  address_line_1 TEXT,
  address_line_2 TEXT,
  floor_count INTEGER CHECK (floor_count IS NULL OR floor_count > 0),
  room_count INTEGER NOT NULL DEFAULT 0 CHECK (room_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, building_key)
);

CREATE TABLE IF NOT EXISTS rental_dashboard.rooms (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES rental_dashboard.properties(id) ON DELETE CASCADE,
  building_id BIGINT NOT NULL REFERENCES rental_dashboard.buildings(id) ON DELETE CASCADE,
  room_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  monthly_rent NUMERIC(10, 2),
  max_occupancy INTEGER NOT NULL DEFAULT 1 CHECK (max_occupancy > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, room_key)
);

CREATE TABLE IF NOT EXISTS rental_dashboard.room_occupancy (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES rental_dashboard.rooms(id) ON DELETE CASCADE,
  occupancy_status TEXT NOT NULL CHECK (
    occupancy_status IN ('vacant', 'reserved', 'occupied', 'maintenance', 'unavailable')
  ),
  occupant_count INTEGER NOT NULL DEFAULT 0 CHECK (occupant_count >= 0),
  lease_start_date DATE,
  lease_end_date DATE,
  tenant_name TEXT,
  tenant_email TEXT,
  notes TEXT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE TABLE IF NOT EXISTS rental_dashboard.tenant_inquiries (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES rental_dashboard.properties(id) ON DELETE CASCADE,
  inquiry_source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'tour_scheduled', 'applied', 'leased', 'closed')
  ),
  prospect_name TEXT,
  prospect_email TEXT,
  prospect_phone TEXT,
  desired_move_in_date DATE,
  desired_room_type TEXT,
  question TEXT NOT NULL,
  ai_answer TEXT,
  escalation_recommended BOOLEAN NOT NULL DEFAULT false,
  assigned_to TEXT,
  closed_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_dashboard.maintenance_requests (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES rental_dashboard.properties(id) ON DELETE CASCADE,
  room_id BIGINT REFERENCES rental_dashboard.rooms(id) ON DELETE SET NULL,
  request_number TEXT UNIQUE,
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (
    priority IN ('low', 'normal', 'high', 'urgent', 'emergency')
  ),
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'triaged', 'scheduled', 'in_progress', 'waiting_on_vendor', 'resolved', 'closed', 'cancelled')
  ),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  vendor_name TEXT,
  cost NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rental_dashboard.viewing_schedules (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES rental_dashboard.properties(id) ON DELETE CASCADE,
  inquiry_id BIGINT REFERENCES rental_dashboard.tenant_inquiries(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled', 'rescheduled')
  ),
  prospect_name TEXT,
  prospect_email TEXT,
  prospect_phone TEXT,
  viewing_type TEXT NOT NULL DEFAULT 'in_person' CHECK (
    viewing_type IN ('in_person', 'virtual', 'self_guided')
  ),
  host_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (scheduled_end > scheduled_start)
);

CREATE TABLE IF NOT EXISTS rental_dashboard.monthly_trends (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES rental_dashboard.properties(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  inquiry_count INTEGER NOT NULL DEFAULT 0 CHECK (inquiry_count >= 0),
  viewing_count INTEGER NOT NULL DEFAULT 0 CHECK (viewing_count >= 0),
  application_count INTEGER NOT NULL DEFAULT 0 CHECK (application_count >= 0),
  lease_count INTEGER NOT NULL DEFAULT 0 CHECK (lease_count >= 0),
  maintenance_request_count INTEGER NOT NULL DEFAULT 0 CHECK (maintenance_request_count >= 0),
  emergency_maintenance_count INTEGER NOT NULL DEFAULT 0 CHECK (emergency_maintenance_count >= 0),
  occupied_room_count INTEGER NOT NULL DEFAULT 0 CHECK (occupied_room_count >= 0),
  vacant_room_count INTEGER NOT NULL DEFAULT 0 CHECK (vacant_room_count >= 0),
  average_days_to_lease NUMERIC(8, 2),
  revenue_collected NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, month_start),
  CHECK (month_start = date_trunc('month', month_start)::date)
);

CREATE TABLE IF NOT EXISTS rental_dashboard.vacancy_rates (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES rental_dashboard.properties(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_rooms INTEGER NOT NULL CHECK (total_rooms >= 0),
  vacant_rooms INTEGER NOT NULL CHECK (vacant_rooms >= 0),
  occupied_rooms INTEGER NOT NULL CHECK (occupied_rooms >= 0),
  reserved_rooms INTEGER NOT NULL DEFAULT 0 CHECK (reserved_rooms >= 0),
  unavailable_rooms INTEGER NOT NULL DEFAULT 0 CHECK (unavailable_rooms >= 0),
  vacancy_rate NUMERIC(5, 4) GENERATED ALWAYS AS (
    CASE
      WHEN total_rooms = 0 THEN 0
      ELSE vacant_rooms::numeric / total_rooms::numeric
    END
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, snapshot_date),
  CHECK (vacant_rooms + occupied_rooms + reserved_rooms + unavailable_rooms <= total_rooms)
);

CREATE INDEX IF NOT EXISTS idx_rooms_property_id
  ON rental_dashboard.rooms (property_id);

CREATE INDEX IF NOT EXISTS idx_buildings_property_id
  ON rental_dashboard.buildings (property_id);

CREATE INDEX IF NOT EXISTS idx_rooms_building_id
  ON rental_dashboard.rooms (building_id);

CREATE INDEX IF NOT EXISTS idx_room_occupancy_room_id_effective
  ON rental_dashboard.room_occupancy (room_id, effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_tenant_inquiries_property_status_created
  ON rental_dashboard.tenant_inquiries (property_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_status_priority
  ON rental_dashboard.maintenance_requests (property_id, status, priority);

CREATE INDEX IF NOT EXISTS idx_viewing_schedules_property_start_status
  ON rental_dashboard.viewing_schedules (property_id, scheduled_start, status);

CREATE INDEX IF NOT EXISTS idx_monthly_trends_property_month
  ON rental_dashboard.monthly_trends (property_id, month_start);

CREATE INDEX IF NOT EXISTS idx_vacancy_rates_property_snapshot
  ON rental_dashboard.vacancy_rates (property_id, snapshot_date);

CREATE OR REPLACE FUNCTION rental_dashboard.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS properties_set_updated_at ON rental_dashboard.properties;
CREATE TRIGGER properties_set_updated_at
BEFORE UPDATE ON rental_dashboard.properties
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

DROP TRIGGER IF EXISTS rooms_set_updated_at ON rental_dashboard.rooms;
CREATE TRIGGER rooms_set_updated_at
BEFORE UPDATE ON rental_dashboard.rooms
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

DROP TRIGGER IF EXISTS buildings_set_updated_at ON rental_dashboard.buildings;
CREATE TRIGGER buildings_set_updated_at
BEFORE UPDATE ON rental_dashboard.buildings
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

DROP TRIGGER IF EXISTS room_occupancy_set_updated_at ON rental_dashboard.room_occupancy;
CREATE TRIGGER room_occupancy_set_updated_at
BEFORE UPDATE ON rental_dashboard.room_occupancy
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

DROP TRIGGER IF EXISTS tenant_inquiries_set_updated_at ON rental_dashboard.tenant_inquiries;
CREATE TRIGGER tenant_inquiries_set_updated_at
BEFORE UPDATE ON rental_dashboard.tenant_inquiries
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

DROP TRIGGER IF EXISTS maintenance_requests_set_updated_at ON rental_dashboard.maintenance_requests;
CREATE TRIGGER maintenance_requests_set_updated_at
BEFORE UPDATE ON rental_dashboard.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

DROP TRIGGER IF EXISTS viewing_schedules_set_updated_at ON rental_dashboard.viewing_schedules;
CREATE TRIGGER viewing_schedules_set_updated_at
BEFORE UPDATE ON rental_dashboard.viewing_schedules
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

DROP TRIGGER IF EXISTS monthly_trends_set_updated_at ON rental_dashboard.monthly_trends;
CREATE TRIGGER monthly_trends_set_updated_at
BEFORE UPDATE ON rental_dashboard.monthly_trends
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

DROP TRIGGER IF EXISTS vacancy_rates_set_updated_at ON rental_dashboard.vacancy_rates;
CREATE TRIGGER vacancy_rates_set_updated_at
BEFORE UPDATE ON rental_dashboard.vacancy_rates
FOR EACH ROW
EXECUTE FUNCTION rental_dashboard.set_updated_at();

COMMIT;
