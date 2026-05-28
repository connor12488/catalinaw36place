BEGIN;

INSERT INTO rental_dashboard.properties (
  property_key,
  name,
  address_line_1,
  city,
  state,
  postal_code
)
VALUES (
  'catalina-west-36-place',
  'Catalina West 36 Place',
  '1171 W 36th Place',
  'Los Angeles',
  'CA',
  '90007'
)
ON CONFLICT (property_key) DO UPDATE SET
  name = EXCLUDED.name,
  address_line_1 = EXCLUDED.address_line_1,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  postal_code = EXCLUDED.postal_code;

WITH property_row AS (
  SELECT id
  FROM rental_dashboard.properties
  WHERE property_key = 'catalina-west-36-place'
)
INSERT INTO rental_dashboard.buildings (
  property_id,
  building_key,
  display_name,
  address_line_1,
  room_count
)
SELECT id, building_key, display_name, address_line_1, 6
FROM property_row
CROSS JOIN (
  VALUES
    ('building-01', 'Building 1', '1171 W 36th Place'),
    ('building-02', 'Building 2', '1171 W 36th Place'),
    ('building-03', 'Building 3', '1171 W 36th Place'),
    ('building-04', 'Building 4', '1171 W 36th Place')
) AS seed(building_key, display_name, address_line_1)
ON CONFLICT (property_id, building_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  address_line_1 = EXCLUDED.address_line_1,
  room_count = EXCLUDED.room_count,
  is_active = true;

WITH building_rows AS (
  SELECT
    b.id AS building_id,
    b.property_id,
    b.building_key,
    b.display_name AS building_name
  FROM rental_dashboard.buildings b
  JOIN rental_dashboard.properties p
    ON p.id = b.property_id
  WHERE p.property_key = 'catalina-west-36-place'
)
INSERT INTO rental_dashboard.rooms (
  property_id,
  building_id,
  room_key,
  display_name,
  room_type,
  monthly_rent,
  max_occupancy
)
SELECT
  property_id,
  building_id,
  concat(building_key, '-', room_number) AS room_key,
  concat(building_name, ' Room ', room_number) AS display_name,
  room_type,
  monthly_rent,
  1 AS max_occupancy
FROM building_rows
CROSS JOIN (
  VALUES
    ('room-01', 'master', 1350.00),
    ('room-02', 'standard', 1150.00),
    ('room-03', 'standard', 1150.00),
    ('room-04', 'standard', 1150.00),
    ('room-05', 'standard', 1150.00),
    ('room-06', 'standard', 1150.00)
) AS seed(room_number, room_type, monthly_rent)
ON CONFLICT (property_id, room_key) DO UPDATE SET
  building_id = EXCLUDED.building_id,
  display_name = EXCLUDED.display_name,
  room_type = EXCLUDED.room_type,
  monthly_rent = EXCLUDED.monthly_rent,
  max_occupancy = EXCLUDED.max_occupancy,
  is_active = true;

WITH property_row AS (
  SELECT id
  FROM rental_dashboard.properties
  WHERE property_key = 'catalina-west-36-place'
)
INSERT INTO rental_dashboard.vacancy_rates (
  property_id,
  snapshot_date,
  total_rooms,
  vacant_rooms,
  occupied_rooms,
  reserved_rooms,
  unavailable_rooms
)
SELECT id, CURRENT_DATE, 24, 24, 0, 0, 0
FROM property_row
ON CONFLICT (property_id, snapshot_date) DO UPDATE SET
  total_rooms = EXCLUDED.total_rooms,
  vacant_rooms = EXCLUDED.vacant_rooms,
  occupied_rooms = EXCLUDED.occupied_rooms,
  reserved_rooms = EXCLUDED.reserved_rooms,
  unavailable_rooms = EXCLUDED.unavailable_rooms;

COMMIT;
