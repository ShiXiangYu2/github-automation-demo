# Domain Docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root.

## Layout

```
./
├── CONTEXT.md           # Project domain glossary and context
├── docs/
│   └── adr/              # Architectural Decision Records
│       └── *.md
```

## Consumer rules

- `improve-codebase-architecture`, `diagnose`, `tdd` skills read `CONTEXT.md` to learn project domain language
- ADRs under `docs/adr/` document past architectural decisions
- If adding a new ADR, use the format in `grill-with-docs/ADR-FORMAT.md` (if available)