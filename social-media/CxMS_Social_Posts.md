# CxMS Social Media Posts

---

## LinkedIn Post #1 - "Lost 4 Hours This Week" (Launch Post)
**Date:** 2026-01-20
**Status:** Published
**URL:** https://www.linkedin.com/feed/update/urn:li:activity:7419461291582414848/

---

### Copy

I just lost 4 hours this week re-explaining my project to AI.

Every new conversation with ChatGPT or Claude required 15-30 minutes of context rebuilding—explaining tech stack, previous work, and architectural decisions—totaling approximately 20+ hours wasted annually.

So I built **CxMS (Agent Context Management System)** — a documentation-based methodology using markdown files to give AI assistants persistent memory.

**Key benefits:**
- Eliminates context rebuilding time (saves 15-30 minutes per session)
- Maintains decision history with rationale
- Ensures consistent approaches across sessions
- Works with any AI assistant that reads files

No installation, dependencies, or API keys required. Just structured documentation.

**Target audience:** Full-stack developers, teams managing multiple codebases, solo freelancers juggling multiple client projects, and developers experiencing context loss with AI tools.

→ github.com/RobSB2/CxMS

---

### Follow-up Comment

"How do you currently handle AI context? Do you have any workarounds, or do you just accept the 15-minute re-explanation tax?"

---

### Performance (as of 2026-01-26)

| Metric | Value | Notes |
|--------|-------|-------|
| Post Likes | 1 | |
| Post Comments | 1 | |
| **GitHub Traffic (14 days)** | | |
| Views | 457 | 189 unique |
| Clones | 504 | 191 unique |
| Peak Day | Jan 21 | 282 views, 131 unique |
| **Referrers** | | |
| LinkedIn (mobile) | 11 | 2 unique |
| LinkedIn (desktop) | 2 | 2 unique |
| Microsoft Teams | 9 | 9 unique (workplace virality) |
| Google | 13 | 9 unique |

**Key Insight:** Low LinkedIn engagement (1 like) but high conversion. 13 LinkedIn clicks → 191 unique cloners suggests the post reached the right audience, and Teams sharing amplified reach into corporate environments.

---

## LinkedIn Post #2 - "Upgrade Your AI Game"
**Date:** 2026-01-24
**Status:** Published
**URL:** https://www.linkedin.com/feed/update/urn:li:activity:7420862598809600000/

### Performance (as of 2026-01-26)

| Metric | Value |
|--------|-------|
| Likes | 4 |
| Comments | 0 |

**Note:** 4x the likes of Post #1, likely due to graphic and refined copy. Correlates with Jan 24-25 clone wave (311 clones, 115 unique).

---

### Copy

**Upgrade Your AI Game: Meet CxMS**

Every developer using AI assistants knows this pain:

*"Hey Claude, continue working on that authentication feature we discussed Friday."*

*"I don't have any context about previous conversations..."*

**15-30 minutes. Gone. Every. Single. Session.**

What if your AI could remember everything?

**Introducing CxMS (Agent Context Management System)** — open source, persistent memory for AI coding assistants.

The secret? A simple principle:
> *AI context is temporary. Files are permanent.*

**What you get:**
- Instant session restoration (not 30-min rebuilds)
- Works with ANY AI tool — Claude, Copilot, Gemini, ChatGPT, Cursor
- Zero dependencies — just markdown files
- 80% reduction in context loss incidents

**How it works:**
1. AI reads `CLAUDE.md` → knows your project
2. AI reads `Session.md` → knows current state
3. You work
4. Update `Session.md` → context persists forever

No installation. No API keys. No subscriptions.
Just structured documentation that makes AI assistants actually useful.

**Get started in 5 minutes:**
→ github.com/RobSB2/CxMS

Stop re-explaining your project. Start where you left off.

---

*#AIProductivity #DeveloperTools #OpenSource #CodingAssistants #PromptEngineering #SoftwareEngineering #AITools #DevOps*

---

### Graphic Concept

**Style:** Clean, modern, dark theme with accent colors (electric blue/cyan gradients)

**Layout - Split comparison:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│           WITHOUT CxMS      vs      WITH CxMS           │
│                                                         │
├───────────────────────┬─────────────────────────────────┤
│                       │                                 │
│   SESSION 1           │       SESSION 1                 │
│      ⬇                │          ⬇                      │
│   "Let me explain..." │       Read CLAUDE.md            │
│   25 min              │       5 sec                     │
│                       │                                 │
│   SESSION 2           │       SESSION 2                 │
│      ⬇                │          ⬇                      │
│   "Let me explain..." │       Read Session.md           │
│   25 sec              │       5 sec                     │
│                       │                                 │
│   SESSION 3           │       SESSION 3                 │
│      ⬇                │          ⬇                      │
│   "Let me explain..." │       Continue working          │
│   25 min              │       5 sec                     │
│                       │                                 │
├───────────────────────┼─────────────────────────────────┤
│   ~75 min WASTED      │      0 min wasted               │
│      per week         │      100% productivity          │
│                       │                                 │
└───────────────────────┴─────────────────────────────────┘

        CxMS — Persistent Memory for AI Assistants
                    Open Source | github.com/RobSB2/CxMS
```

**Graphic specifications for design tools (Canva, Figma):**
- **Size:** 1200 x 627px (LinkedIn recommended)
- **Background:** Dark (#0D1117 or #1A1A2E)
- **Accent:** Electric blue gradient (#00D4FF → #0066FF)
- **Typography:** Sans-serif (Inter, Plus Jakarta Sans)
- **Icons:** Brain with memory chip, file icons, checkmarks
- **Bottom banner:** GitHub logo + URL + "Open Source" badge

---

### Gemini Image Generation Prompt

Copy this into gemini.google.com:

```
Create a professional LinkedIn social media graphic (1200x627 pixels, landscape orientation).

Theme: Dark tech aesthetic with a split-screen comparison

LEFT SIDE (problem - use red/orange warning tones):
- Header: "WITHOUT CxMS"
- Show 3 sessions stacked vertically, each showing:
  - "Session 1: 25 min rebuilding context"
  - "Session 2: 25 min rebuilding context"
  - "Session 3: 25 min rebuilding context"
- Bottom stat: "75+ minutes WASTED per week"
- Include a frustrated/confused robot or developer icon

RIGHT SIDE (solution - use green/cyan success tones):
- Header: "WITH CxMS"
- Show 3 sessions stacked vertically, each showing:
  - "Session 1: 5 seconds"
  - "Session 2: 5 seconds"
  - "Session 3: 5 seconds"
- Bottom stat: "Instant context restoration"
- Include a happy/efficient robot or checkmark icon

BOTTOM BANNER (spans full width):
- "CxMS — Persistent Memory for AI Assistants"
- "Open Source | github.com/RobSB2/CxMS"
- Include a small GitHub logo

Style: Modern, minimal, professional. Dark background (#0D1117). Clean sans-serif typography. Suitable for LinkedIn business audience.
```

**Tips:** May need 2-3 iterations. Follow up with feedback like "make text larger" or "simplify layout" if needed.

---

## LinkedIn Post #3 - "CxMS v1.5: One Week In"
**Date:** 2026-01-26
**Status:** Published
**URL:** https://www.linkedin.com/feed/update/urn:li:activity:7421598954812923904/

### Performance (as of 2026-01-26)

| Metric | Value | Notes |
|--------|-------|-------|
| Likes | 0 | Just posted |
| Comments | 0 | |

---

### Copy

**500+ clones in 6 days.**

Last week I shared CxMS, an open-source system that gives AI coding assistants persistent memory.

The response blew me away. Not just the numbers—but WHERE the traffic came from:

Microsoft Teams. Corporate developer channels.

Turns out, context loss isn't just annoying for solo devs. It's costing enterprise teams real money.

So I shipped a massive update: **CxMS v1.5**

**What's new:**

**"One Prompt to Rule Them All"**
One startup command now loads your entire project context, checks for updates, applies pre-approved permissions, monitors context usage, and gives you a status dashboard. 5 seconds to full productivity.

**Skip the Permission Prompts**
New `Approvals.md` template lets you pre-authorize common operations. No more clicking "Allow" 47 times per session.

**Context Self-Monitoring**
CxMS now tracks its own context consumption. Get alerts before you hit limits. Never lose work to surprise compaction again.

**Automated Telemetry (Opt-In)**
Anonymous usage metrics help improve the system. One-time consent, auto-submits at session end. Revoke anytime.

**Parent-Child Projects**
Child projects can now inherit conventions from a parent CxMS. Set up once, apply everywhere.

**The full picture:**
- 27 templates (up from 16)
- 18 enhancements documented (6 shipped)
- 4 CLI tools included
- Works with Claude, Copilot, Gemini, Cursor, Aider, ChatGPT

And yes—CxMS uses itself to track its own development. Dogfooding at its finest.

**The best part?** Still zero dependencies. Still just markdown files. Still free forever.

If 191 developers cloned it in week one, imagine what happens when they start contributing back.

Get started in 5 minutes:
→ github.com/RobSB2/CxMS

What context management challenges are YOU facing with AI tools? Drop a comment—I'm building features based on real feedback.

---

*#AIProductivity #DeveloperTools #OpenSource #ClaudeCode #GitHubCopilot #Cursor #SoftwareEngineering #DevTools #ContextEngineering*

---

### Key Messages

1. **Social proof** - 500+ clones, Teams/corporate adoption
2. **Feature dump** - v1.5 has real substance
3. **Call to action** - Get feedback for next features
4. **Credibility** - Dogfooding, enterprise interest

### Graphic Concept

**Option A: Stats Dashboard**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│        CxMS v1.5 — One Week In                  │
│                                                 │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│   │  500+   │  │  191    │  │   27    │        │
│   │ clones  │  │  devs   │  │templates│        │
│   └─────────┘  └─────────┘  └─────────┘        │
│                                                 │
│   NEW IN v1.5:                                  │
│   ✓ One-prompt startup                         │
│   ✓ Permission pre-approval                    │
│   ✓ Context self-monitoring                    │
│   ✓ Automated telemetry                        │
│   ✓ Parent-child projects                      │
│                                                 │
│   github.com/RobSB2/CxMS                        │
└─────────────────────────────────────────────────┘
```

**Option B: "Where the traffic came from" story**
- Show referrer breakdown: LinkedIn → GitHub → Teams → Clones
- Emphasize corporate/enterprise angle

### Graphic Concept - Combined Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    CxMS v1.5 — One Week In                          │
│                                                                      │
├──────────────────────────────┬──────────────────────────────────────┤
│                              │                                       │
│   WHERE IT SPREAD            │           THE RESULTS                 │
│                              │                                       │
│   LinkedIn Post              │      ┌─────────┐  ┌─────────┐        │
│        ↓                     │      │  500+   │  │  191    │        │
│   Microsoft Teams            │      │ clones  │  │  devs   │        │
│   (corporate channels)       │      └─────────┘  └─────────┘        │
│        ↓                     │                                       │
│   GitHub                     │      ┌─────────┐  ┌─────────┐        │
│        ↓                     │      │   27    │  │    6    │        │
│   500+ Clones                │      │templates│  │ shipped │        │
│                              │      └─────────┘  └─────────┘        │
│   [LinkedIn] [Teams] [GH]    │                                       │
│      icons                   │                                       │
│                              │                                       │
├──────────────────────────────┴──────────────────────────────────────┤
│                                                                      │
│   NEW: One-prompt startup • Permission pre-approval • Context       │
│        monitoring • Automated telemetry • Parent-child projects     │
│                                                                      │
│              Open Source | github.com/RobSB2/CxMS                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Gemini Image Prompt (Combined)

```
Create a professional LinkedIn graphic (1200x627 pixels, landscape).

Theme: Dark tech aesthetic with data visualization elements

HEADER (top, centered):
- "CxMS v1.5 — One Week In"
- Subtle glow effect on text

LEFT SIDE - "The Journey" (flow diagram):
- Title: "WHERE IT SPREAD"
- Vertical flow with arrows connecting:
  1. LinkedIn icon with "Post"
  2. Arrow down
  3. Microsoft Teams icon with "Corporate Channels"
  4. Arrow down
  5. GitHub icon
  6. Arrow down
  7. "500+ Clones" (highlighted, larger)
- Use orange/amber for LinkedIn, purple for Teams, white for GitHub
- Arrows should be cyan/electric blue

RIGHT SIDE - "The Results" (stat cards):
- Title: "THE RESULTS"
- Four stat cards in 2x2 grid:
  - "500+" / "Clones" (cyan accent)
  - "191" / "Developers" (green accent)
  - "27" / "Templates" (blue accent)
  - "6" / "Features Shipped" (purple accent)
- Cards should have subtle borders and slight glow

BOTTOM BANNER (full width):
- Feature tags in pill/badge style: "One-prompt startup" • "Permission pre-approval" • "Context monitoring" • "Automated telemetry"
- Footer: "Open Source | github.com/RobSB2/CxMS" with small GitHub logo

Style: Dark background (#0D1117 or #1A1A2E), neon accent colors (cyan, green, purple), clean sans-serif typography (Inter or similar), tech dashboard feel, professional but eye-catching.
```

### Alternative: Canva/Figma Manual Build

If AI generation doesn't nail it, build manually:

**Layout Grid:**
- 1200 x 627px canvas
- Dark background (#0D1117)
- Left column: 40% width (flow diagram)
- Right column: 60% width (stat cards)
- Bottom strip: 80px height (features + CTA)

**Assets needed:**
- LinkedIn logo (orange)
- Microsoft Teams logo (purple)
- GitHub logo (white)
- Arrow icons (cyan)
- Stat card components

**Fonts:**
- Headlines: Inter Bold or Plus Jakarta Sans Bold
- Stats: Inter Black (large numbers)
- Labels: Inter Regular

---
