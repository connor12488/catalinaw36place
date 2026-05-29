# Catalina West 36 Place Tenant Q&A Assistant

This project adds a lightweight Tenant Q&A Assistant for an existing static rental website. It does not redesign the website.

This branch is refactored for Vercel:

- Vercel hosts the Next.js app in `apps/vercel-dashboard`.
- Neon Postgres stores approved tenant Q&A in `qa_entries`.
- Vercel AI Gateway can choose the best approved Q&A ID when local matching is weak, then rewrites only approved answers into tenant-facing responses.
- Squarespace embeds the assistant with `/embed/assistant.js`.

The older Render + YAML implementation remains in the repo as a working reference and seed source.

## Recommended Setup

Use:

- Vercel to host the Next.js dashboard and assistant API.
- Neon Postgres from Vercel Marketplace for approved Q&A storage.
- Vercel AI Gateway for answer wording.
- A Squarespace code block or code injection that loads `/embed/assistant.js`.

This avoids redeploying whenever Q&A changes. Use `/dashboard` to add, edit, disable, or delete approved answers.

You can switch Q&A sources with one environment variable:

| Value | Runtime Source | Dashboard |
| --- | --- | --- |
| `QA_SOURCE=db` | Active rows in `qa_entries` | Editable CRUD dashboard |
| `QA_SOURCE=yaml` | `qa/rental-qa.yaml` | Read-only YAML dashboard |

Use `db` for the Vercel production path. Use `yaml` only when you want a simple fallback that behaves like the original Render version.

## Scope

In scope:

- Define and maintain the rental Q&A list in Postgres.
- Host a Next.js dashboard and assistant API on Vercel.
- Match tenant questions to active approved database answers.
- Use Vercel AI Gateway for guarded Q&A intent matching and approved-answer rewriting.
- Escalate to property management when an approved answer is missing.
- Import the existing Render YAML Q&A into Postgres during migration.

Out of scope:

- Website redesign.
- Rent payment processing.
- Maintenance ticket processing.
- Legal, tax, financial, or fair housing advice.
- Answering from unapproved internet sources.

The older Render path can still run from the existing files, but it is no longer the primary deployment target for this branch.

## Vercel Runtime Flow

```mermaid
flowchart LR
  admin[Property Admin] --> login[/login/]
  login --> dashboard[/dashboard CRUD Editor/]
  dashboard --> db[(Neon Postgres qa_entries)]
  tenant[Tenant on Squarespace] --> embed[tenant-qa-assistant div]
  embed --> js[/embed/assistant.js/]
  js --> chat[POST /api/chat]
  chat --> db
  chat --> match[Local Match Approved Q&A]
  match --> weak{Low Confidence?}
  weak -->|Yes| aiMatch[AI Chooses Approved Q&A ID]
  weak -->|No| approved{Approved Answer?}
  aiMatch --> approved
  approved -->|No| fallback[Contact Property Management]
  approved -->|Yes| gateway[Vercel AI Gateway]
  gateway --> response[Concise Tenant Answer]
  fallback --> tenant
  response --> tenant
```

```text
Tenant website
  -> loads /embed/assistant.js
  -> POST /api/chat
  -> Vercel app reads active qa_entries rows
  -> app locally matches tenant question to approved Q&A entry
  -> if local match is weak, AI Gateway chooses one approved Q&A ID
  -> app calls Vercel AI Gateway to rewrite the approved answer
  -> app returns concise answer or escalation fallback
```

If a matched database answer still contains placeholder text, the app intentionally escalates instead of showing the placeholder to tenants.

AI is never allowed to invent property facts. It can only select from approved Q&A IDs and rewrite the approved answer.

## Q&A Source

Runtime Q&A lives in Neon Postgres:

```text
qa_entries
```

The existing YAML file is now used as seed/import input:

```text
qa/rental-qa.yaml
```

YAML structure:

```yaml
property:
  id: catalina-west-36-place
  name: "Catalina West 36 Place"
  contactFallback:
    email: "[property manager email]"
    phone: "[property manager phone]"
    message: "Please contact property management for the most accurate current information."

qa:
  - id: pets
    category: pets
    questions:
      - "Are pets allowed?"
      - "What is the pet policy?"
    approvedAnswer: "[Fill in pet policy, fees, and restrictions.]"
    escalateWhen:
      - "User asks for legal interpretation or an exception."
```

Do not launch publicly until every placeholder answer has been replaced with approved property-manager language.

## Required Q&A List

Each item below should have an approved answer in `qa_entries`. The initial rows can be imported from `qa/rental-qa.yaml`.

| ID | Category | Tenant Questions | Approved Answer |
| --- | --- | --- | --- |
| `rent-monthly` | Rent | What is the monthly rent? How much is rent? | `[Fill in approved rent amount and any timing notes.]` |
| `rent-due-date` | Rent | When is rent due? Is there a grace period? | `[Fill in rent due date and approved grace-period language.]` |
| `deposit` | Fees | What is the security deposit? Is it refundable? | `[Fill in approved deposit details.]` |
| `application-fee` | Fees | Is there an application fee? | `[Fill in approved application fee details.]` |
| `move-in-costs` | Fees | How much is due before move-in? | `[Fill in first month, deposit, and other move-in cost details.]` |
| `lease-length` | Lease | How long is the lease? Month-to-month or annual? | `[Fill in approved lease length.]` |
| `availability` | Availability | Is the unit available? When can I move in? | `[Fill in current availability process. Escalate if availability changes often.]` |
| `showings` | Availability | Can I schedule a tour? How do showings work? | `[Fill in showing instructions or contact fallback.]` |
| `application-process` | Leasing | How do I apply? What documents are required? | `[Fill in approved application process.]` |
| `screening` | Leasing | What are the rental requirements? Do you check credit? | `[Fill in approved screening summary. Avoid discriminatory language.]` |
| `utilities-included` | Utilities | Which utilities are included? | `[Fill in included utilities.]` |
| `utilities-tenant-paid` | Utilities | Which utilities does the tenant pay? | `[Fill in tenant-paid utilities.]` |
| `internet` | Utilities | Is internet included? What providers are available? | `[Fill in approved internet details.]` |
| `parking` | Parking | Is parking available? Is it assigned? | `[Fill in parking policy.]` |
| `guest-parking` | Parking | Is guest parking available? | `[Fill in guest parking policy.]` |
| `pets` | Pets | Are pets allowed? Is there a pet deposit or pet rent? | `[Fill in pet policy, fees, and restrictions.]` |
| `service-animals` | Pets | What about service animals or assistance animals? | `[Escalate to property management; avoid legal advice.]` |
| `smoking` | Rules | Is smoking allowed? | `[Fill in smoking policy.]` |
| `quiet-hours` | Rules | Are there quiet hours? | `[Fill in quiet-hours policy.]` |
| `guests` | Rules | Can guests stay overnight? | `[Fill in guest policy.]` |
| `subletting` | Rules | Can I sublet or Airbnb the unit? | `[Fill in subletting/short-term rental policy.]` |
| `laundry` | Amenities | Is laundry available? | `[Fill in laundry details.]` |
| `appliances` | Amenities | What appliances are included? | `[Fill in appliance list.]` |
| `heating-cooling` | Amenities | Is there heat or air conditioning? | `[Fill in heating/cooling details.]` |
| `storage` | Amenities | Is storage available? | `[Fill in storage details.]` |
| `outdoor-space` | Amenities | Is there a patio, balcony, yard, or shared outdoor space? | `[Fill in outdoor space details.]` |
| `accessibility` | Property | Are there stairs? Is the unit accessible? | `[Fill in factual accessibility details. Avoid making compliance claims unless approved.]` |
| `trash-recycling` | Rules | Where do trash and recycling go? | `[Fill in trash/recycling instructions.]` |
| `mail-packages` | Property | How are mail and packages handled? | `[Fill in mail/package details.]` |
| `maintenance` | Maintenance | How do I report maintenance? | `[Fill in maintenance request process.]` |
| `emergency-maintenance` | Maintenance | What counts as an emergency? Who do I call? | `[Fill in emergency maintenance instructions if approved.]` |
| `lockouts` | Maintenance | What if I am locked out? | `[Fill in lockout policy/contact.]` |
| `move-in` | Move-In | What is the move-in process? | `[Fill in move-in steps, keys, inspection, utilities setup.]` |
| `move-out` | Move-Out | What is the move-out process? | `[Fill in move-out notice, cleaning, keys, inspection.]` |
| `renters-insurance` | Lease | Is renters insurance required? | `[Fill in insurance requirement.]` |
| `contact` | Contact | Who do I contact with questions? | `[Fill in property manager contact details.]` |

## Escalation Rules

The assistant should route the user to property management when:

- The answer is missing from `qa_entries`.
- The approved answer is still placeholder text.
- The user asks for legal advice.
- The user asks to negotiate rent, deposit, or lease terms.
- The user asks about application approval odds.
- The user asks about protected-class or fair-housing-sensitive topics.
- The user asks for current availability and the approved database answer is not guaranteed current.
- The user reports an emergency.
- The user provides sensitive personal information.

Standard escalation answer:

```text
I do not have an approved answer for that in the property Q&A. Please contact property management for the most accurate current information.
```

## API Contract

### Assistant Page

`GET /assistant`

Returns a preview page for the Vercel tenant assistant. The production Squarespace page should usually embed the script instead:

```html
<div id="tenant-qa-assistant"></div>
<script src="https://YOUR-VERCEL-APP.vercel.app/embed/assistant.js" defer></script>
```

### Chat

`POST /api/chat`

Request:

```json
{
  "message": "Are pets allowed?"
}
```

Response:

```json
{
  "answer": "Approved answer from qa_entries, or the standard escalation answer.",
  "matchedQuestionId": "pets",
  "matchMethod": "ai",
  "escalationRecommended": false
}
```

### Health

`GET /api/health`

Response:

```json
{
  "status": "ok",
  "runtime": "vercel",
  "qaSource": "db",
  "qaCount": 36
}
```

## Project Layout

```text
catalinaw36place/
  README.md
  render.yaml
  .env.example
  .env.local.example
  package.json
  apps/
    vercel-dashboard/
      app/
        api/
          admin/
          chat/
        dashboard/
        embed/
        login/
      db/
        001_qa_entries.sql
      lib/
      scripts/
  qa/
    rental-qa.yaml
    sample-tenant-questions.json
  db/
    dashboard/
      001_dashboard_schema.sql
      002_seed_example.sql
  agent/
    src/
      server.ts
      config.ts
      answerQuestion.ts
      loadQa.ts
      matchQuestion.ts
      guardrails.ts
      systemPrompt.ts
      types.ts
    tests/
      answerQuestion.test.ts
      guardrails.test.ts
      matchQuestion.test.ts
    package.json
  scripts/
    apply_sql.py
    create_simple_table.py
    db_url.py
```

Folder responsibilities:

- `qa`: approved rental Q&A content and sample tenant questions.
- `agent`: Render-hosted API that answers questions from YAML.
- `apps/vercel-dashboard`: Vercel-hosted Next.js dashboard, database-backed chat API, and Squarespace embed script.
- `apps/vercel-dashboard/db`: future Q&A table migration for Neon Postgres.
- `db/dashboard`: optional dashboard analytics schema for buildings, rooms, occupancy, inquiries, maintenance, viewing schedules, trends, and vacancy rates.
- `scripts`: local Postgres helper scripts.
- `render.yaml`: Render Free Web Service configuration.
- `.env.example`: expected environment variable names, without secret values.

## Legacy Render Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

Local API URLs:

- `GET http://localhost:10000/assistant`
- `GET http://localhost:10000/api/health`
- `POST http://localhost:10000/api/chat`

Example local chat request:

```bash
curl -X POST http://localhost:10000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Are pets allowed?"}'
```

## Vercel Tenant Q&A Dashboard

Use this option to run the database-backed assistant on Vercel. The Vercel app is separate from the Render agent and lives here:

```text
apps/vercel-dashboard
```

Runtime flow:

```mermaid
flowchart LR
  admin[Property Admin] --> login[/login/]
  login --> dashboard[/dashboard CRUD Editor/]
  dashboard --> db[(Neon Postgres qa_entries)]
  tenant[Tenant on Squarespace] --> embed[tenant-qa-assistant div]
  embed --> js[/embed/assistant.js/]
  js --> chat[POST /api/chat]
  chat --> db
  chat --> match[Local Match Approved Q&A]
  match --> weak{Low Confidence?}
  weak -->|Yes| aiMatch[AI Chooses Approved Q&A ID]
  weak -->|No| approved{Approved Answer?}
  aiMatch --> approved
  approved -->|No| contact[Contact Property Management]
  approved -->|Yes| gateway[Vercel AI Gateway]
  gateway --> answer[Tenant Answer]
  contact --> tenant
  answer --> tenant
```

### Vercel Project Setup

Create a Vercel project from this Git repo and set:

```text
Root Directory: apps/vercel-dashboard
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
```

Add Neon Postgres from the Vercel Marketplace. Vercel may inject `DATABASE_URL`, `POSTGRES_URL`, or both into the project environment. The app accepts `DATABASE_URL`, `POSTGRES_URL`, or `POSTGRES_URL_NON_POOLING`.

Required Vercel environment variables:

```bash
QA_SOURCE=db
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
# Or use POSTGRES_URL if that is the variable Vercel gave you.
# POSTGRES_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
AI_GATEWAY_API_KEY=replace-with-vercel-ai-gateway-key
AI_MODEL=openai/gpt-5-mini
ADMIN_PASSWORD_HASH=replace-with-generated-hash
SESSION_SECRET=replace-with-long-random-secret
ALLOWED_ORIGIN=https://www.catalinaw36place.com
```

Generate the admin password hash:

```bash
cd apps/vercel-dashboard
npm install
npm run hash-password -- "replace-with-your-admin-password"
```

Copy the printed value into `ADMIN_PASSWORD_HASH`.

The existing `qa/rental-qa.yaml` remains the seed source for `scripts/import_yaml_qa.py`.

If you set `QA_SOURCE=yaml`, `npm run build` copies the root YAML file into the Vercel app bundle at `apps/vercel-dashboard/qa/rental-qa.yaml`, and `QA_FILE_PATH=qa/rental-qa.yaml` tells the app where to read it.

Optional fallback contact values:

```bash
PROPERTY_CONTACT_EMAIL=Catalina.w36thPlace@gmail.com
PROPERTY_CONTACT_PHONE=(213)-222-8057
```

For short local testing only, `ALLOWED_ORIGIN=*` allows any browser origin.

### Vercel Database Schema

The Vercel dashboard stores approved Q&A in:

```sql
qa_entries (
  id,
  source_key,
  question,
  answer,
  tags,
  active,
  sort_order,
  created_at,
  updated_at
)
```

SQL file:

```text
apps/vercel-dashboard/db/001_qa_entries.sql
```

After adding Neon Postgres from Vercel Marketplace, apply the schema from the repo root:

```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/apply_sql.py apps/vercel-dashboard/db/001_qa_entries.sql
```

Create/populate `qa_entries` from `qa/rental-qa.yaml` in one command:

```bash
python3 scripts/populate_qa_entries.py --dry-run
python3 scripts/populate_qa_entries.py
```

Or use npm:

```bash
npm run db:qa:populate:dry-run
npm run db:qa:populate
```

By default, the import keeps existing database edits and only inserts missing rows by `source_key`. To refresh database rows from the YAML file again:

```bash
npm run db:qa:populate:overwrite
```

Or apply the schema with `psql` from the app folder:

```bash
cd apps/vercel-dashboard
psql "$DATABASE_URL" -f db/001_qa_entries.sql
```

### Vercel Local Development

Create a local env file:

```bash
cp apps/vercel-dashboard/.env.local.example apps/vercel-dashboard/.env.local
```

Run the app:

```bash
npm install --prefix apps/vercel-dashboard
npm run dev:vercel
```

Local URLs:

- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/assistant`
- `GET http://localhost:3000/api/health`
- `POST http://localhost:3000/api/chat`
- `GET http://localhost:3000/embed/assistant.js`

The chat API reads active rows from `qa_entries`. If `AI_GATEWAY_API_KEY` is missing locally, it returns the approved database answer without AI rewriting.

### Render To Vercel Migration

1. Keep the current Render service running while Vercel is tested.
2. Deploy the Vercel project with root directory `apps/vercel-dashboard`.
3. Add Neon Postgres and required Vercel environment variables.
4. Apply `apps/vercel-dashboard/db/001_qa_entries.sql`.
5. Run `python3 scripts/import_yaml_qa.py` to copy `qa/rental-qa.yaml` into `qa_entries`.
6. Log in to `/dashboard` and update any placeholder answers.
7. Test `/api/health`, `/assistant`, and `POST /api/chat`.
8. Replace the old Render iframe on Squarespace with the Vercel embed script.
9. Retire the Render service after the Vercel embed is working in production.

### Squarespace Embed

Add this code block or code injection to the Squarespace page:

```html
<div id="tenant-qa-assistant"></div>
<script src="https://YOUR-VERCEL-APP.vercel.app/embed/assistant.js" defer></script>
```

Replace `YOUR-VERCEL-APP` with the deployed Vercel app hostname.

### Vercel API Contract

Public chat:

```http
POST /api/chat
```

Request:

```json
{
  "message": "What is the rent?"
}
```

Response:

```json
{
  "answer": "Approved answer from the database, optionally rewritten by AI Gateway.",
  "matchedQuestionId": "rent-monthly",
  "matchMethod": "ai",
  "escalationRecommended": false
}
```

Admin-only APIs:

- `GET /api/admin/qa`
- `POST /api/admin/qa`
- `GET /api/admin/qa/:id`
- `PUT /api/admin/qa/:id`
- `PATCH /api/admin/qa/:id`
- `DELETE /api/admin/qa/:id`

Example create request after logging in:

```bash
curl -X POST https://YOUR-VERCEL-APP.vercel.app/api/admin/qa \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "question": "Is laundry available?",
    "answer": "Each unit comes with a washer and dryer.",
    "tags": ["laundry", "washer", "dryer"],
    "active": true,
    "sortOrder": 10
  }'
```

### Vercel Test Plan

- Invalid `/login` password is rejected.
- Valid `/login` password sets a secure session cookie and opens `/dashboard`.
- `/dashboard` can create, edit, delete, sort, and toggle active Q&A entries.
- Unauthenticated users cannot access admin APIs.
- `/api/health` returns `qaSource: db`.
- `POST /api/chat` answers known tenant questions from active database rows.
- Weak local matches can return `"matchMethod": "ai"` when AI Gateway selects the approved Q&A ID.
- Unknown questions return the property management fallback contact.
- Placeholder answers, legal questions, emergency messages, and sensitive personal data are escalated.
- `/embed/assistant.js` loads on desktop and mobile Squarespace pages.
- CORS allows `https://www.catalinaw36place.com` and rejects other browser origins.

## Vercel Postgres Smoke Test

Use this only when testing a Vercel Marketplace Postgres database connection. The Render YAML assistant does not require Postgres.

Create `.env.local` from Vercel:

```bash
vercel env pull .env.local
```

Or copy the example and paste values from the Vercel project settings:

```bash
cp .env.local.example .env.local
```

Required `.env.local` value:

```bash
POSTGRES_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

The script also accepts either of these names if your Vercel storage integration provides them instead:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Optional:

```bash
SAMPLE_TABLE_NAME=tenant_qa_smoke_test
```

Install the Python dependency and create the smoke-test table:

```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/create_simple_table.py
```

The script creates a table with this shape:

```sql
CREATE TABLE IF NOT EXISTS tenant_qa_smoke_test (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Dashboard Database Schema

The dashboard schema supports room occupancy, tenant inquiries, maintenance requests, monthly trends, viewing schedules, and vacancy rates.

SQL files:

```text
db/dashboard/001_dashboard_schema.sql
db/dashboard/002_seed_example.sql
```

Apply the schema using `.env.local`:

```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/apply_sql.py db/dashboard/001_dashboard_schema.sql
```

Optional seed data:

```bash
python3 scripts/apply_sql.py db/dashboard/002_seed_example.sql
```

## Local Iframe Test Site

The `sample-site` folder contains a small static page based on the Catalina Place home page with the assistant embedded as an iframe.

### Install Docker

Check whether Docker is available:

```bash
docker --version
docker ps
```

If Docker is not installed, install Docker Desktop:

- macOS: install Docker Desktop from `https://www.docker.com/products/docker-desktop/`
- Windows: install Docker Desktop from `https://www.docker.com/products/docker-desktop/`
- Linux: install Docker Engine from `https://docs.docker.com/engine/install/`

After installing Docker Desktop, start the Docker app and wait until it says Docker is running. Then rerun:

```bash
docker ps
```

If `docker ps` prints running containers or an empty table, Docker is ready.

### Run The Sample Site

Build and run the sample site:

```bash
docker build -t catalina-assistant-sample ./sample-site
docker run --rm -p 8080:80 catalina-assistant-sample
```

Open:

```text
http://localhost:8080
```

By default, it embeds:

```text
https://catalinaw36place.onrender.com/assistant
```

To test against a local agent container running on `localhost:10000`, open:

```text
http://localhost:8080/?assistant=http://localhost:10000/assistant
```

If port `8080` is already in use, run the sample site on another local port:

```bash
docker run --rm -p 8081:80 catalina-assistant-sample
```

Then open:

```text
http://localhost:8081
```

## Legacy Render Deployment

Use one Render Free Web Service for the agent API.

Render service settings:

- Runtime: Node.js.
- Plan: Free.
- Build command: `npm install && npm run build && npm test`
- Start command: `npm start`
- Health check path: `/api/health`

Environment variables:

```bash
AI_PROVIDER=openai
AI_MODEL=gpt-5.4-mini
AI_API_KEY=replace-with-server-side-secret
PROPERTY_ID=catalina-west-36-place
QA_FILE_PATH=qa/rental-qa.yaml
ALLOWED_ORIGIN=https://your-rental-website.example
CONTACT_EMAIL=replace-with-property-manager-email
CONTACT_PHONE=replace-with-property-manager-phone
LOG_LEVEL=info
```

Only `AI_API_KEY` is required for OpenAI calls. The contact variables are optional overrides for the YAML fallback contact details.

## Legacy Render Implementation Steps

```mermaid
flowchart TD
  edit[Edit qa/rental-qa.yaml] --> commit[Commit Q&A Changes]
  commit --> push[Push to GitHub]
  push --> deploy[Render Redeploys Service]
  deploy --> live[Updated Q&A Available in API]
  live --> test[Test /api/chat]
```

1. Fill in approved answers in `qa/rental-qa.yaml`.
2. Commit and push changes to GitHub.
3. Create or sync the Render service from `render.yaml`.
4. Set `AI_API_KEY`, `ALLOWED_ORIGIN`, and optional contact overrides in Render.
5. Confirm `GET /api/health` returns `qaSource: yaml`.
6. Test sample questions against `POST /api/chat`.
7. Test the iframe page at `GET /assistant`.
8. Add the Render assistant URL to the existing static website.

## Legacy Render Testing Checklist

- Every required Q&A item has an approved answer.
- No placeholder text remains in `qa/rental-qa.yaml`.
- Unknown questions return the escalation answer.
- Legal questions return the escalation answer.
- Rent, fees, lease terms, and availability are never invented.
- API keys are not visible in browser code or responses.
- Render environment variables are configured.
- `/assistant` loads the chat page.
- `/api/health` returns `ok` and `qaSource: yaml`.
- The static website can open the hosted assistant URL.

## References

- [Render Web Services](https://render.com/docs/web-services/)
- [Render Environment Variables and Secrets](https://render.com/docs/configure-environment-variables/)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI Responses API migration guide](https://platform.openai.com/docs/guides/responses-vs-chat-completions)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Vercel AI Gateway Models and Providers](https://vercel.com/docs/ai-gateway/models-and-providers)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
