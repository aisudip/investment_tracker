# Claude-MD Docs Sync Agent Memory

## Project: investment_tracker

### CLAUDE.md location
`C:\Users\sudip\Projects\courses\investment_tracker\CLAUDE.md`

### Docs-First Rule table — confirmed columns
| Task | Read first |

- "Task" column uses phrasing: `Any <domain> work (<examples, comma-separated>)`
- "Read first" column uses backtick-wrapped relative paths: `` `docs/<filename>.md` ``
- No trailing pipes, no extra alignment spaces — plain pipe-separated markdown

### Docs files and their task descriptions (confirmed)
| File | Task description |
|---|---|
| `docs/ui.md` | Any UI work (components, pages, layouts) |
| `docs/data-fetching.md` | Any data fetching work |
| `docs/auth.md` | Any auth work (middleware, sessions, sign-in/up) |
| `docs/data-mutations.md` | Any data mutation work (create, update, delete) |
| `docs/server-components.md` | Any page/layout Server Component work |
| `docs/routing.md` | Any routing work (new pages, route protection, redirects) |

### Naming conventions
- Docs filenames: lowercase kebab-case, domain-based (e.g., `server-components.md`, `data-fetching.md`)
- New rows are appended at the bottom of the table (no strict alphabetical ordering observed)

### Notes
- The table header and separator row must never be modified
- Do not add duplicate entries if a file is already referenced
