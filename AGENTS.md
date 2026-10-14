<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Flow interface conventions

- Use Tailwind CSS for interface work. Avoid new handwritten CSS; existing styles are in the components layer for gradual replacement.
- Keep the root layout at `max-w-440 mx-auto`. Internal content fills the available width. Use `Container` for shared horizontal padding.
- Use React Hook Form with Zod for every application-owned form, including custom date/time/select controls. Show field errors and preserve entered values. Keep server authorization and business validation.
- Format Brazilian phone numbers, currency and dates as the user types. Do not mask free text.
- Use the shared Radix `ScrollArea` in sidebars, separate routes rather than tabs, and Nuqs for URL state.
- Use low-contrast background icons or section numbers where appropriate; decorative elements must be `aria-hidden` and must not reduce readability.
