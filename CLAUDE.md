# CLAUDE.md

## Context

Solo operator. Singapore real estate tech — ERA Singapore web platforms, competitive intelligence, agent performance monitoring. Stack: Python, JavaScript, HTML/CSS. Outputs: prototypes, dashboards, documentation, data pipelines.

---

## Workflow

### 1. Plan First
- Enter plan mode for any task with 3+ steps or architectural decisions
- Write the plan before touching code
- If something breaks mid-task, stop and re-plan — don't push through

### 2. Subagent Strategy
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent — keep the main context clean
- Use subagents for: competitive scraping, sitemap analysis, route audits

### 3. Self-Improvement Loop
- After any correction: add the pattern here under **Lessons**
- Write it as a rule, not a note
- Review this file at the start of any session on a recurring project

### 4. Verification Before Done
- Never mark complete without proving it works
- Run it. Check the output. Check the logs.
- Ask: "Would I show this to a stakeholder right now?"

### 5. Autonomous Bug Fixing
- When given a bug: just fix it — no hand-holding needed
- Point at logs, errors, or failing output — then resolve
- Zero context switching required

---

## Core Principles

- **Simplicity First** — Make every change as small as possible. Minimal footprint.
- **No Laziness** — Find root causes. No temporary patches.
- **Minimal Impact** — Changes touch only what's necessary.

---

## Stack Conventions

- Python: use `--break-system-packages` for pip installs
- Outputs go to `/mnt/user-data/outputs/`
- Prototypes: single-file HTML preferred unless stated otherwise
- Docs: Markdown unless Word/PDF explicitly requested

---

## Lessons

> Add entries here after any correction. Format: what went wrong → rule to prevent it.

<!-- Example:
- Assumed sitemap existed without verifying → always check robots.txt and HEAD request first
-->
