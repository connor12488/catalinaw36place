# Dashboard Schema

These SQL scripts create dashboard tables for rental operations reporting.

## Tables

- `rental_dashboard.room_occupancy`: current and historical room occupancy states.
- `rental_dashboard.tenant_inquiries`: prospect questions, lead status, AI escalation data, and follow-up state.
- `rental_dashboard.maintenance_requests`: tenant maintenance requests, priority, status, scheduling, vendor, and cost tracking.
- `rental_dashboard.viewing_schedules`: in-person, virtual, or self-guided tour appointments.
- `rental_dashboard.monthly_trends`: monthly summary metrics for inquiries, viewings, leases, maintenance, occupancy, and revenue.
- `rental_dashboard.vacancy_rates`: daily vacancy snapshots with generated vacancy-rate calculation.

Supporting tables:

- `rental_dashboard.properties`
- `rental_dashboard.buildings`
- `rental_dashboard.rooms`

The sample seed creates one property with 4 buildings and 6 rooms per building, for 24 total rooms.

## Apply Locally Or Against Supabase/Vercel

Set one connection string in `.env.local`:

```bash
POSTGRES_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Install Python dependencies:

```bash
python3 -m pip install -r scripts/requirements.txt
```

Apply the schema:

```bash
python3 scripts/apply_sql.py db/dashboard/001_dashboard_schema.sql
```

Optional sample seed:

```bash
python3 scripts/apply_sql.py db/dashboard/002_seed_example.sql
```
