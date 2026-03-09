# UI Coding Standards

## Component Library

**All UI must be built exclusively with [shadcn/ui](https://ui.shadcn.com) components.**

- NEVER create custom UI components (buttons, inputs, cards, dialogs, tables, badges, etc.)
- NEVER write raw HTML elements (`<button>`, `<input>`, `<select>`, etc.) where a shadcn component exists
- If a shadcn component does not exist for a use case, install the closest one and compose from it
- Add new shadcn components via the CLI: `npx shadcn@latest add <component-name>`

## Date Formatting

**All dates must be formatted using [date-fns](https://date-fns.org).** Install if not already present: `npm install date-fns`.

Dates must follow this format throughout the UI:

```
1st Sep 2025
2nd Aug 2025
3rd Jun 2025
4th Jan 2026
```

Use the `do MMM yyyy` format token with `date-fns/format`:

```ts
import { format } from 'date-fns';

format(new Date('2025-09-01'), 'do MMM yyyy') // → "1st Sep 2025"
format(new Date('2025-08-02'), 'do MMM yyyy') // → "2nd Aug 2025"
format(new Date('2025-06-03'), 'do MMM yyyy') // → "3rd Jun 2025"
format(new Date('2026-01-04'), 'do MMM yyyy') // → "4th Jan 2026"
```

Never use `Date.toLocaleDateString`, `Intl.DateTimeFormat`, or any other date formatting approach.

## Tailwind CSS

- Use Tailwind utility classes for layout and spacing only (margins, padding, flex, grid, sizing)
- Use the CSS variable design tokens defined in `globals.css` for colours — never hardcode colour values
- Dark mode is supported via the `.dark` class — always use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, etc.) rather than literal colour classes (`bg-white`, `text-gray-500`)
