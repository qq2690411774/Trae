# alfred_ Application Challenge
## Design + Prototype alfred_'s Execution Decision Layer
At alfred_, we are building an AI assistant that lives in your text messages. Users ask alfred_ to manage email, calendar, reminders, and scheduling, and increasingly, alfred_ acts on their behalf.

One of the hardest product problems is deciding when alfred_ should act silently, when it should confirm, when it should ask a clarifying question, and when it should refuse. As the product becomes more powerful, this decision layer becomes core to the user experience.

---

## Your Task (Timebox: <= 6 hours)
We do not want you to overbuild. Focus on judgment, clarity, scope, and execution.

### 1. Design the Execution Decision Layer
Given a proposed action plus context, your system should decide one of the following:
- Execute silently
- Execute and tell the user after
- Confirm before executing
- Ask a clarifying question
- Refuse / escalate

**Important framing**: this is a contextual conversation decision problem, not a one shot prompt classification task. Your system should consider conversation history and user state, not just the latest message in isolation.

Use this boundary so decisions are comparable:
- Ask a clarifying question when intent, entity, or key parameters are unresolved.
- Confirm before executing when intent is resolved but risk is above your silent execution threshold.
- Refuse / escalate when policy disallows the action, or risk or uncertainty remains too high after clarification.

---

### 2. Build a Simple Prototype
Create a minimal working prototype that lets us:
- submit an action plus some context
- see the final decision plus a concise rationale
- view a handful of preloaded example scenarios
- look under the hood on any decision

We want to see the full pipeline, not just the verdict. Please expose:
- the inputs
- any signals or rules you computed in code
- the exact prompt sent to the model
- the raw model output
- the final parsed decision

A simple UI is completely fine. We care much more about the quality of the thinking than visual polish.

---

### 3. Handle Failure Cases
Document and demonstrate what your system does for at least:
- LLM timeout
- malformed model output
- missing critical context

Make at least one of these failure paths visible in the UI.
Default safe behavior should avoid irreversible execution when uncertain.

---

### 4. Include Scenario Coverage
Please include at least 6 preloaded scenarios:
- 2 clear / easy cases
- 2 ambiguous cases requiring judgment
- 2 adversarial or risky cases

**Illustrative example**:
- Action: send email reply to external partner
- Latest user message: "Yep, send it"
- Conversation history: user earlier asked alfred_ to draft a reply to Acme proposing a 20% discount; alfred_ drafted the email and asked for confirmation; user then said, "Actually hold off until legal reviews pricing language"; a few minutes later user said, "Yep, send it."

A strong system should not treat the latest message in isolation.

---

### 5. Deploy It
Please deploy the prototype and send back:
- a live URL
- a GitHub repo link

---

### 6. Write a Short README
In your repo README, please include a short writeup covering:
- what signals your system uses, and why
- how you split responsibility between the LLM and regular code
- what the model decides versus what you compute deterministically
- your prompt design in brief
- expected failure modes
- how you would evolve this system as alfred_ gains riskier tools
- what you would build next if you owned this for the next 6 months

---

## What We’re Looking For
- Product judgment
- Strong scoping instincts
- Clear system design
- Good taste around trust and UX
- Comfort operating under ambiguity
- Clean, working code
- Clear communication of tradeoffs

---

## A Note on Scope
Parts of this challenge are intentionally underspecified. We want to see how you make design decisions, where you simplify, and what you prioritize.

Use AI tools freely. Make judgment calls. Be honest about what you chose not to build.

---

## Final Step
Please send your completed submission by 4/19 at 11:59 PM EST.

Reply to this email thread with:
- the deployed link
- the GitHub repo
- your writeup, if included in the README that is completely fine

If we do not hear back by then, we will assume you have decided not to continue in the process.

If anything about the prompt is unclear, feel free to email us.

Thanks again - we are excited to see what you build.

The alfred_ team

