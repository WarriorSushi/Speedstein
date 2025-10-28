# Implementation Notes - Constitution Compliance

## Phase 1 Setup (T001-T010) - Completed

### Completed Tasks

#### T001: Database Migrations ✅
Created 3 migration files:
- `supabase/migrations/20251027000002_add_subscriptions.sql` - Subscription table with RLS
- `supabase/migrations/20251027000003_add_payment_events.sql` - Payment events audit log
- `supabase/migrations/20251027000004_extend_users.sql` - User table extensions

**Status**: Files created, awaiting manual application via `supabase db push` or `supabase db reset`

#### T002: shadcn/ui Installation ✅
- Already initialized (components.json exists)
- Installed core components: button, card, input, label, dialog, dropdown-menu, separator, badge, avatar, switch
- Components location: `apps/web/src/components/ui/`

#### T003: OKLCH Design Tokens ✅
Enhanced `apps/web/src/app/globals.css` with:
- Complete gray scale (50-950) using OKLCH with perceptually uniform lightness steps
- Dark mode with inverted lightness values
- Success and warning semantic colors
- Updated `tailwind.config.ts` to reference all OKLCH custom properties

**Constitution Compliance**: ✅ Principle III - All colors use OKLCH exclusively

#### T004: DodoPayments SDK ⚠️
**BLOCKED - Package does not exist yet**

DodoPayments is specified in the constitution as the mandatory payment provider (Principle IV), but:
1. No npm package exists at `@dodo-payments/sdk` or similar
2. No official SDK found in npm registry

**Resolution Options**:
1. **Wait for SDK release**: If DodoPayments is a real service launching soon
2. **Use REST API directly**: Implement HTTP client using fetch/axios with proper webhook verification
3. **Substitute with Stripe temporarily**: Use Stripe SDK for MVP, plan migration to DodoPayments when available

**Recommendation**: Proceed with REST API implementation (Option 2) using the patterns documented in `research.md`:
- HMAC-SHA256 webhook signature verification
- Subscription lifecycle events: `subscription.created`, `payment.succeeded`, `payment.failed`, `subscription.cancelled`
- Idempotency via `event_id` storage

**Action Required**: User/stakeholder decision on approach

#### T005: Monaco Editor ✅
Installed packages:
- `@monaco-editor/react` - React wrapper for Monaco Editor
- `monaco-editor` - Core Monaco Editor library

**Usage**:
- Dynamic import for code splitting (reduces initial bundle)
- Client-side only rendering (`'use client'` directive)
- ~3MB bundle size (acceptable for landing page demo)

#### T006: next-themes ✅
Installed `next-themes` for dark mode support

**Features**:
- System preference detection
- localStorage persistence
- SSR hydration without FOUC
- Integrates with OKLCH color system via `.dark` class

#### T007: Sentry SDKs ✅
Installed error tracking:
- `@sentry/nextjs` (dev dependency) - Frontend error tracking
- `@sentry/core` - Cloudflare Workers error tracking

**Note**: Used `@sentry/core` instead of `@sentry/cloudflare-workers` (package doesn't exist)

**Next Steps**: Configure Sentry DSN in environment variables and initialize in application code

#### T008-T009: Playwright ✅
Installed testing framework:
- `@playwright/test` - E2E testing framework
- `@axe-core/playwright` - Accessibility testing
- Chromium browser downloaded (~240MB)

**Configuration**: `playwright.config.ts` already exists with comprehensive setup:
- Multiple browser projects (Chromium, Firefox, WebKit, Mobile)
- Automatic dev server startup
- Video/screenshot on failure
- GitHub Actions reporter for CI

#### T010: axe-core ✅
Installed `@axe-core/playwright` for automated accessibility testing

**Usage**: WCAG AAA compliance validation (7:1 contrast for normal text, 4.5:1 for large text)

---

## Summary

**Completed**: 9/10 tasks (90%)
**Blocked**: 1 task (T004 - DodoPayments SDK)

**Constitution Compliance Status**:
- ✅ Principle III (Design System): OKLCH implemented
- ✅ Principle III (shadcn/ui): Components installed
- ⚠️ Principle IV (DodoPayments): SDK unavailable, needs resolution
- ✅ Principle VIII (Testing): Playwright + axe-core configured

**Ready for Phase 2**: Yes (with DodoPayments decision made)

---

## Next Phase Preview

**Phase 2: Foundational Components (T011-T020)**
These 10 tasks establish shared infrastructure that BLOCKS all user stories:

1. **T011**: Create shared TypeScript types for subscriptions
2. **T012**: Create payment event types
3. **T013**: Implement Supabase client helpers (browser + server)
4. **T014**: Create DodoPayments webhook signature verification utility
5. **T015**: Implement R2 upload integration into main PDF generation flow
6. **T016**: Create error handling utilities (ApiError extensions)
7. **T017**: Set up Sentry initialization (Next.js + Workers)
8. **T018**: Create OKLCH color utility functions
9. **T019**: Implement form validation schemas (Zod)
10. **T020**: Create test fixtures and database seeding utilities

**Estimated Duration**: 2-3 days
**Blockers**: None (DodoPayments webhook verification can use placeholder implementation)
