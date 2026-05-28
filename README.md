# Catalina West 36 Place Tenant Q&A Assistant

This project adds a lightweight Tenant Q&A Assistant for an existing static rental website. It does not redesign the website. The first version uses a simple YAML file as the approved Q&A source, so no PostgreSQL database is required.

## Recommended Setup

Use:

- Render Free Web Service to host the agent API.
- `qa/rental-qa.yaml` as the approved Q&A knowledge base.
- OpenAI Responses API for answer wording.
- A simple link or iframe from the existing website to the Render-hosted assistant.

This keeps Render infrastructure free for the first version. OpenAI API usage is still paid separately, but for short rental Q&A answers the expected usage should usually be small.

## Scope

In scope:

- Define and maintain the rental Q&A list in YAML.
- Host a small Node.js agent API on Render.
- Match tenant questions to approved YAML answers.
- Use OpenAI only to rewrite approved answers into concise tenant-facing responses.
- Escalate to property management when an approved answer is missing.

Out of scope:

- Website redesign.
- PostgreSQL database setup.
- Admin UI for editing Q&A.
- Rent payment processing.
- Maintenance ticket processing.
- Legal, tax, financial, or fair housing advice.
- Answering from unapproved internet sources.

## Runtime Flow

```mermaid
flowchart LR
  tenant[Tenant or Applicant] --> website[Existing Static Website]
  website -->|iframe /assistant| render[Render Web Service]
  render --> api[Node.js Agent API]
  api --> yaml[qa/rental-qa.yaml]
  api --> match[Match Question to Approved Q&A]
  match --> guardrails{Approved Answer?}
  guardrails -->|No| fallback[Contact Property Management]
  guardrails -->|Yes| openai[OpenAI Responses API]
  openai --> response[Concise Tenant Answer]
  fallback --> tenant
  response --> tenant
```

```text
Tenant website
  -> opens or iframes /assistant
  -> POST /api/chat
  -> agent loads qa/rental-qa.yaml
  -> agent matches tenant question to approved Q&A entry
  -> agent calls OpenAI Responses API
  -> agent returns concise answer or escalation fallback
```

If a matched YAML answer still contains placeholder text, the agent intentionally escalates instead of showing the placeholder to tenants.

## Q&A Source

Runtime Q&A lives here:

```text
qa/rental-qa.yaml
```

The YAML structure is:

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

Each item below should have an approved answer in `qa/rental-qa.yaml`.

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

- The answer is missing from `qa/rental-qa.yaml`.
- The approved answer is still placeholder text.
- The user asks for legal advice.
- The user asks to negotiate rent, deposit, or lease terms.
- The user asks about application approval odds.
- The user asks about protected-class or fair-housing-sensitive topics.
- The user asks for current availability and the YAML content is not guaranteed current.
- The user reports an emergency.
- The user provides sensitive personal information.

Standard escalation answer:

```text
I do not have an approved answer for that in the property Q&A. Please contact property management for the most accurate current information.
```

## API Contract

### Assistant Page

`GET /assistant`

Returns the iframe-ready tenant chat page. The static website can embed it with:

```html
<iframe
  src="https://catalinaw36place.onrender.com/assistant"
  title="Tenant Q&A Assistant"
  style="width:100%; max-width:760px; height:460px; border:0;"
></iframe>
```

### Chat

`POST /api/chat`

Request:

```json
{
  "sessionId": "anonymous-session-id",
  "message": "Are pets allowed?"
}
```

Response:

```json
{
  "answer": "Approved answer from qa/rental-qa.yaml, or the standard escalation answer.",
  "matchedQuestionId": "pets",
  "escalationRecommended": false
}
```

### Health

`GET /api/health`

Response:

```json
{
  "status": "ok",
  "qaSource": "yaml"
}
```

## Project Layout

```text
catalinaw36place/
  README.md
  render.yaml
  .env.example
  package.json
  qa/
    rental-qa.yaml
    sample-tenant-questions.json
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
```

Folder responsibilities:

- `qa`: approved rental Q&A content and sample tenant questions.
- `agent`: Render-hosted API that answers questions from YAML.
- `render.yaml`: Render Free Web Service configuration.
- `.env.example`: expected environment variable names, without secret values.

## Local Development

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

## Vercel Postgres Smoke Test

Use this only when testing a Vercel Marketplace Postgres database. The live assistant does not require Postgres.

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

## Render Deployment

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

## Implementation Steps

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

## Testing Checklist

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
