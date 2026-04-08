# PARKED.md
> Sections from the community CLAUDE.md framework that were dropped for solo use.
> Revisit if team size grows.

---

## Why These Were Dropped

Solo operators don't need alignment overhead, check-in steps, or explanation summaries. These sections add token cost and process friction with no corresponding benefit when you're the only stakeholder.

---

## Task Management (Dropped)

The 6-step task management flow below is designed for team transparency — tracking progress for others to follow.

1. **Plan First** — Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan** — Check in before starting implementation
3. **Track Progress** — Mark items complete as you go
4. **Explain Changes** — High-level summary at each step
5. **Document Results** — Add review section to `tasks/todo.md`
6. **Capture Lessons** — Update `tasks/lessons.md` after corrections

**Why dropped:** Steps 2, 4, and 5 are team-facing. Use a separate project management tool (Notion, Linear, plain text) if you need task tracking. Don't burden Claude's context with it.

---

## Demand Elegance — Balanced (Dropped)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

**Why dropped:** Useful mindset, but too verbose as a standing instruction. Elegance is better enforced through the Verification step ("Would I show this to a stakeholder?") rather than a separate section.

---

## Workflow Orchestration — Subheadings Not Applicable Solo

### Plan Node Default — Verbose Version (Dropped)
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

**Why dropped:** Collapsed into the leaner Plan First section in CLAUDE.md.

---

## Reinstate If Team Grows

If a second person joins:
- Restore Task Management steps 2, 4, 5
- Add a `## Contributors` section to CLAUDE.md
- Move Lessons to a shared `tasks/lessons.md` file updated via PR tagging
- Set a token budget review (target: keep CLAUDE.md under 2.5k tokens)
