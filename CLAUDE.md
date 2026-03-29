# Project Rules

## Code Style

- **No inline types in function signatures.** If a function parameter is an object, define its type as a named type above the function.
- **No inline `useQuery`/`useMutation` in components.** Always extract them into reusable custom hooks (e.g., `useNovels.ts`, `useFavorites.ts`). Components should only call these hooks, never `useQuery`/`useMutation` directly.
- **Define query key constants inside hook files.** Each hook file owns its query keys — do not create a separate centralized query keys file. Export the constants from the hook file so components can import them for invalidation.
- **No abbreviations in variable names.** Always use full words — `response` not `res`, `request` not `req`, `parameters` not `params`, etc.
- **Always use curly braces for `if` statements.** Even single-line bodies must use `{ }` blocks.
- **Always check response status codes.** When calling the API via the Hono client, check `response.ok` and throw an error if the response is not successful. This ensures React Query properly handles errors.
