# Layout Standards - MANDATORY FOR ALL PAGES

**Last Updated:** 2025-10-27
**Status:** ENFORCED - No exceptions

## The Problem We're Preventing

Landing pages with massive empty space on the right because of improper use of Tailwind's `container` class.

## The Root Cause

Tailwind's `container` class WITHOUT proper configuration:
- ❌ Sets max-width to breakpoint widths
- ❌ Does NOT center by default
- ❌ Leaves content floating to the left with empty space on right

## The Correct Pattern (ALWAYS USE THIS)

### Full-Width Sections Pattern

```tsx
// ✅ CORRECT - Full width with centered content
<section className="w-full py-12 md:py-24">
  <div className="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
    {/* Content here */}
  </div>
</section>

// ❌ WRONG - Will cause empty space issues
<section className="container py-12">
  {/* Content here */}
</section>
```

### Header/Footer Pattern

```tsx
// ✅ CORRECT - Full width header with centered content
<header className="w-full border-b">
  <div className="mx-auto flex h-16 max-w-screen-2xl items-center px-4 md:px-6 lg:px-8">
    {/* Nav items */}
  </div>
</header>

// ❌ WRONG - Will not span full width
<header className="container border-b">
  <div className="flex h-16 items-center">
    {/* Nav items */}
  </div>
</header>
```

## Mandatory Classes Breakdown

### Outer Container (Section/Header/Footer)
- `w-full` - ALWAYS use this for full viewport width
- Add background colors here if needed: `bg-muted/30`

### Inner Container (Content Wrapper)
- `mx-auto` - Centers the content horizontally
- `max-w-screen-xl` or `max-w-[64rem]` - Constrains max width
- `px-4 md:px-6 lg:px-8` - Responsive padding for mobile/tablet/desktop

### Why These Specific Classes?

**Outer: `w-full`**
- Ensures section spans entire viewport width
- Allows full-width backgrounds

**Inner: `mx-auto`**
- Centers content within the full-width section
- Creates equal margins on both sides

**Inner: `max-w-*`**
- Prevents content from becoming too wide on large screens
- Standard widths:
  - `max-w-screen-xl` (1280px) - Headers/Footers
  - `max-w-screen-2xl` (1536px) - Wide layouts
  - `max-w-[64rem]` (1024px) - Content sections

**Inner: `px-4 md:px-6 lg:px-8`**
- Responsive padding prevents content from touching edges
- Scales up on larger screens for better aesthetics

## Standard Layout Patterns

### Landing Page Sections

```tsx
export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="mx-auto max-w-[64rem] px-4 md:px-6 lg:px-8">
          <h1>Hero Content</h1>
        </div>
      </section>

      {/* Alternating Background Section */}
      <section className="w-full py-12 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-[64rem] px-4 md:px-6 lg:px-8">
          <h2>Section Content</h2>
        </div>
      </section>

      {/* Full Width Section */}
      <section className="w-full py-12 md:py-24">
        <div className="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cards */}
          </div>
        </div>
      </section>
    </div>
  )
}
```

### Marketing Layout (Header/Footer)

```tsx
export default function MarketingLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center px-4 md:px-6 lg:px-8">
          <nav>...</nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full">{children}</main>

      {/* Footer */}
      <footer className="border-t w-full">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between py-6 px-4 md:px-6 lg:px-8">
          <p>Footer content</p>
        </div>
      </footer>
    </div>
  )
}
```

## Testing Checklist (MANDATORY BEFORE COMMIT)

Before committing ANY page, test at these viewport widths:

```bash
# Mobile
- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 12/13/14)
- [ ] 414px (iPhone Plus)

# Tablet
- [ ] 768px (iPad)
- [ ] 834px (iPad Air)

# Desktop
- [ ] 1024px (Small laptop)
- [ ] 1280px (Standard desktop)
- [ ] 1440px (Large desktop)
- [ ] 1920px (Full HD)
```

### Visual Checks Required

- [ ] No horizontal scrollbar at any width
- [ ] Content centered on wide screens
- [ ] No massive empty space on left or right
- [ ] Proper padding on mobile (not touching edges)
- [ ] Sections use full viewport width
- [ ] Content respects max-width constraints

## When to Use `container` Class

**NEVER use `container` alone!**

Only use if you've configured it properly in `tailwind.config.ts`:

```ts
theme: {
  container: {
    center: true,
    padding: {
      DEFAULT: '1rem',
      sm: '2rem',
      lg: '4rem',
      xl: '5rem',
      '2xl': '6rem',
    },
  },
}
```

Even then, prefer the explicit pattern (`w-full` + `mx-auto` + `max-w-*`) for clarity.

## Common Mistakes to Avoid

### ❌ Mistake 1: Using `container` without configuration
```tsx
<section className="container">
  <h1>Title</h1>
</section>
```
**Problem:** Content won't center, max-width applied incorrectly

### ❌ Mistake 2: Missing `w-full` on sections
```tsx
<section className="py-12">
  <div className="mx-auto max-w-screen-xl">
    <h1>Title</h1>
  </div>
</section>
```
**Problem:** Section might not span full width

### ❌ Mistake 3: Missing padding on inner containers
```tsx
<section className="w-full">
  <div className="mx-auto max-w-screen-xl">
    <h1>Title</h1>
  </div>
</section>
```
**Problem:** Content touches edges on mobile

### ❌ Mistake 4: Using fixed widths
```tsx
<section className="w-[1200px]">
  <h1>Title</h1>
</section>
```
**Problem:** Won't work on smaller screens, creates horizontal scroll

## Tools for Validation

### Browser DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Cmd/Ctrl + Shift + M)
3. Test all viewport widths listed above
4. Check for horizontal scrollbar
5. Verify content centering

### Playwright Test
```ts
test('should not have horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBe(clientWidth)
})
```

## Review Checklist for Code Reviews

When reviewing PRs with new pages:

- [ ] All sections use `w-full`
- [ ] Content containers use `mx-auto max-w-*`
- [ ] Mobile padding present (`px-4` minimum)
- [ ] No bare `container` usage
- [ ] Screenshots show proper centering at 1920px
- [ ] No horizontal scroll at 375px
- [ ] Header/footer span full width

## Emergency Fix Template

If you spot the issue in production:

```tsx
// BEFORE (broken)
<section className="container">
  <Content />
</section>

// AFTER (fixed)
<section className="w-full py-12">
  <div className="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
    <Content />
  </div>
</section>
```

---

**This document is MANDATORY reading for all developers working on frontend pages.**

**Violation of these standards will result in PR rejection.**
