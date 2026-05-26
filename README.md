# Catalina West 36 Place Tenant Q&A Assistant

This project is not responsible for redesigning or rebuilding the rental website. The website can remain static. The scope is to define an approved rental Q&A knowledge base and connect it to a hosted AI agent that tenants or applicants can open from the existing website.

The assistant should answer only from approved property Q&A content. If an answer is missing, uncertain, legal in nature, or requires property manager approval, the assistant should route the user to the contact fallback.

## Scope

In scope:

- Define the rental Q&A list.
- Store approved answers in a simple structured file.
- Host an AI agent endpoint on Render or another agent platform.
- Keep API keys and private configuration outside the static website.
- Provide a simple embed/link target for the existing website.

Out of scope:

- Website redesign.
- Full rental application workflow.
- Rent payment processing.
- Maintenance ticket processing.
- Legal, tax, financial, or fair housing advice.
- Answering from unapproved internet sources.

## Recommended Approach

Use Render to host a small backend agent service, and use OpenAI Responses API or a similar agent runtime to answer questions from the approved Q&A file.

Recommended MVP:

- Existing static website links to the assistant.
- Render Web Service hosts `POST /api/chat`.
- Agent loads `qa/rental-qa.yaml`.
- Agent matches the question to approved Q&A entries.
- Agent returns a concise answer plus a contact fallback when needed.
- Secrets such as AI provider keys are stored in Render environment variables.

Why this approach:

- The static website stays simple.
- The agent can be deployed independently.
- API keys are never exposed in browser code.
- The knowledge base is easy to review before launch.
- The first version does not need vector search or a database.

## Suggested Agent Options

### Option 1: Render + OpenAI Responses API

Best default choice for this project.

- Host a small Node.js/Express or Python/FastAPI service on Render.
- Use the OpenAI Responses API for model responses.
- Keep the rental Q&A file in the repo.
- Add retrieval logic that selects the best Q&A entries before calling the model.
- Return a controlled, grounded answer.

Use this when you want full control over prompts, safety rules, logs, and future integrations.

### Option 2: Managed Chatbot Platform

Examples: Botpress, Voiceflow, Chatbase, Intercom Fin, or similar hosted chatbot tools.

- Faster setup.
- Less code.
- Usually includes an embeddable widget.
- Less control over exact retrieval, privacy behavior, and deployment shape.

Use this when speed matters more than customization.

### Option 3: Workflow Agent Platform

Examples: Dify, Flowise, LangGraph, or similar agent workflow tools.

- Useful if you want visual flow editing or more complex future routing.
- More operational complexity than the MVP needs.

Use this if the assistant will later connect to scheduling, maintenance, CRM, or ticketing systems.

## Q&A Knowledge File

Create the primary content file here:

```text
qa/rental-qa.yaml
```

Use this structure:

```yaml
property:
  id: catalina-west-36-place
  name: "Catalina West 36 Place"
  contactFallback:
    email: "[property manager email]"
    phone: "[property manager phone]"
    message: "Please contact property management for the most accurate current information."

qa:
  - id: rent-monthly
    category: rent
    questions:
      - "What is the monthly rent?"
      - "How much is rent?"
      - "What is the rental price?"
    approvedAnswer: "[Fill in approved monthly rent answer.]"
    escalateWhen:
      - "User asks to negotiate rent."
      - "User asks about future pricing not in the approved answer."
```

Do not deploy the assistant while placeholder answers remain.

## Required Q&A List

Each item below should be filled in by the property owner or property manager before launch.

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
- The user asks for legal advice.
- The user asks to negotiate rent, deposit, or lease terms.
- The user asks about application approval odds.
- The user asks about protected-class or fair-housing-sensitive topics.
- The user asks for current availability and the Q&A file is not guaranteed current.
- The user reports an emergency.
- The user provides sensitive personal information.

Standard escalation answer:

```text
I do not have an approved answer for that in the property Q&A. Please contact property management for the most accurate current information.
```

## Agent Behavior

The agent must:

- Answer from approved Q&A content only.
- Keep answers short and practical.
- Say when information is unavailable.
- Never invent rent, deposits, fees, lease dates, policies, or availability.
- Avoid legal advice.
- Avoid collecting sensitive personal information.
- Include the contact fallback when escalation is recommended.

Suggested system instruction:

```text
You are the Tenant Q&A Assistant for Catalina West 36 Place.
Answer using only the approved Q&A entries provided to you.
If no approved entry answers the question, say you do not have that information and provide the property management contact fallback.
Do not invent rent amounts, deposits, fees, lease terms, dates, policies, or availability.
Do not provide legal, tax, financial, or fair housing advice.
Keep answers concise, friendly, and practical.
```

## Minimal API Contract

The existing website only needs to link to, iframe, or open the hosted assistant URL. The hosted agent service handles the actual Q&A.

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
  "answer": "Approved answer from the Q&A file, or the standard escalation answer.",
  "matchedQuestionId": "pets",
  "escalationRecommended": false
}
```

### Health

`GET /api/health`

Response:

```json
{
  "status": "ok"
}
```

## Suggested Folder Structure

```text
catalinaw36place/
  README.md
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
    tests/
      answerQuestion.test.ts
      guardrails.test.ts
      matchQuestion.test.ts
    package.json
  deploy/
    render.yaml
  .env.example
  package.json
```

Folder responsibilities:

- `qa`: approved rental Q&A content and sample questions.
- `agent`: small hosted API that answers questions from the Q&A file.
- `deploy`: Render deployment configuration.
- `.env.example`: expected environment variable names, without secret values.

## Render Deployment Plan

Use one Render Web Service for the agent API.

Suggested Render service:

- Runtime: Node.js or Python.
- Build command: install dependencies and run tests.
- Start command: start the API server.
- Health check path: `/api/health`.
- Environment variables: set in Render, not committed to git.

Example environment variables:

```bash
AI_PROVIDER=openai
AI_MODEL=replace-with-selected-model
AI_API_KEY=replace-with-server-side-secret
PROPERTY_ID=catalina-west-36-place
ALLOWED_ORIGIN=https://your-rental-website.example
CONTACT_EMAIL=manager@example.com
CONTACT_PHONE=555-555-5555
LOG_LEVEL=info
```

## Implementation Steps

1. Create `qa/rental-qa.yaml` from the Q&A list above.
2. Replace every placeholder with approved property manager language.
3. Build the agent API with `POST /api/chat` and `GET /api/health`.
4. Add exact-match and fuzzy-match logic against the Q&A list.
5. Add guardrails and escalation rules.
6. Connect the agent to the selected AI provider.
7. Deploy the agent service to Render.
8. Add a link or iframe target from the existing static website to the Render agent URL.
9. Test the required Q&A list before launch.

## Testing Checklist

- Every required Q&A item has an approved answer.
- No placeholder text remains in `qa/rental-qa.yaml`.
- Unknown questions return the escalation answer.
- Legal questions return the escalation answer.
- Rent, fees, lease terms, and availability are never invented.
- API keys are not visible in browser code or responses.
- Render environment variables are configured.
- `/api/health` returns `ok`.
- The static website can open the hosted assistant URL.

## References

- [Render Web Services](https://render.com/docs/web-services/)
- [Render Environment Variables and Secrets](https://render.com/docs/configure-environment-variables/)
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI Responses API migration guide](https://platform.openai.com/docs/guides/responses-vs-chat-completions)
