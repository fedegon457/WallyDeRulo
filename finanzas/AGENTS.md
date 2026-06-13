# Code Standards — MyWalli

## Stack
- React 19 + Vite + Tailwind CSS 3
- Supabase (auth + database)
- @tabler/icons-react (preferred over lucide-react)

## JavaScript / React
- Functional components only, named exports
- useState / useEffect — no class components
- No TypeScript — plain JSX
- Prefer const, never var

## Styling
- Tailwind utility classes only — no inline styles, no CSS modules
- Mobile-first: test on small viewport
- Never h-screen — use min-h-[100dvh] or avoid fixed heights
- text-base minimum on inputs (iOS zoom prevention)

## Supabase
- Always filter by user_id in queries
- Always filter !transfer_group_id when computing income/expense stats
- Use .select() with explicit columns when possible

## Commits
- Conventional commits: feat / fix / perf / refactor / ci
- No Co-Authored-By lines
