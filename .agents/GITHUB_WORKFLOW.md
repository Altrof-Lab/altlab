# GitHub & Development Workflow (`altlab`)

## Issue & PR Prefix

All GitHub Issues and Pull Requests **must** be prefixed with `[AL]` to identify them as belonging to the AltLab monorepo.

- **Issue title format:** `[AL] [scope]: Brief summary in English`
  - Example: `[AL] [core]: Add Drizzle schema and migrations for profile metrics`
  - Example: `[AL] [dashboard]: Implement real-time WebSocket connection to SpyHub`
  - Example: `[AL] [shared]: Define stealth report response contracts`
- **PR title format:** `[AL] type: Brief summary in English`
  - Example: `[AL] feat: add high-density monitoring data table`
  - Example: `[AL] fix: resolve dark mode theme flicker on page refresh`

## Branching

- `main` — stable, production-ready.
- `dev` — active development.
- Feature branches: `feature/[issue-number]-[description]` (e.g. `feature/14-profile-stream`).
- Bug-fix branches: `fix/[issue-number]-[description]` (e.g. `fix/18-theme-toggle-hydration`).

## Commit Messages

Use conventional commits (English):
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code refactoring
- `docs:` documentation changes
- `chore:` maintenance tasks
- `test:` adding or updating tests

## Automatic Assignee Requirement

All created issues and Pull Requests **must be assigned to `altrof`**:
```bash
gh issue create --title "[AL] [scope]: Summary" --body "..." --assignee altrof
```

## GitHub Project Integration: Altrof Dev Dashboard

All GitHub Issues and Pull Requests **must** be attached to the organization project board:
- **Project:** [Altrof Dev Dashboard](https://github.com/orgs/Altrof-Lab/projects/2) (`project: 2`, owner: `Altrof-Lab`)
- When creating an Issue or Pull Request, immediately add it to the project:
  ```bash
  gh project item-add 2 --owner Altrof-Lab --url <issue_or_pr_url>
  ```
- Keep the `Status` field updated (`Backlog`, `Ready`, `In progress`, `In review`, `Done`).

## Notion Wiki Releases Integration

For every completed PR or release:
1. Navigate to or create a page in Notion under **`AltLab / AltLab / Releases`**.
2. Page title format: `#{pr-number}: [AL] type: description`.
3. Include links to the GitHub Issue and Pull Request.
4. Provide a comprehensive summary, component details, and verification results in **Russian** so that team members can browse and read release notes as an internal Wiki.
