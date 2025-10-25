# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Performance Requirements (Principle I)
- [ ] Feature design supports P95 latency <2s for PDF generation
- [ ] Browser session reuse strategy documented (no cold starts)
- [ ] Chrome instance warming approach defined
- [ ] Promise pipelining identified for batch operations
- [ ] No blocking operations in critical path

### Security & Authentication (Principle II)
- [ ] API keys will be SHA-256 hashed before storage
- [ ] No plaintext secrets in code or configuration
- [ ] RLS policies defined for all Supabase tables
- [ ] Rate limiting strategy documented for endpoints
- [ ] CORS configuration specified
- [ ] Environment variables identified for all secrets

### Design System Standards (Principle III)
- [ ] All colors use OKLCH color space (no RGB/HSL/hex)
- [ ] WCAG AAA contrast compliance verified (7:1 normal, 4.5:1 large)
- [ ] Elevation system uses OKLCH lightness manipulation
- [ ] Only shadcn/ui components used (no other UI libraries)

### Technology Stack (Principle IV)
- [ ] Frontend uses Next.js 15 with App Router
- [ ] Backend uses Cloudflare Workers
- [ ] RPC uses Cap'n Web for PDF generation
- [ ] Database uses Supabase with RLS
- [ ] Payments use DodoPayments
- [ ] Styling uses Tailwind CSS with OKLCH tokens

### Code Quality (Principle V)
- [ ] TypeScript strict mode enabled
- [ ] Error handling strategy documented
- [ ] No console.log in production code paths
- [ ] Zod schemas defined for API validation
- [ ] Browser instance disposal strategy documented

### Cap'n Web Best Practices (Principle VI)
- [ ] Server classes extend RpcTarget
- [ ] Promise pipelining strategy documented
- [ ] Resource disposal using 'using' keyword or Symbol.dispose()
- [ ] WebSocket heartbeat mechanism planned
- [ ] No event loop blocking operations

### User Experience (Principle VII)
- [ ] Landing page load time target <2s (LCP)
- [ ] Live demo works without authentication
- [ ] Dark mode support included
- [ ] Mobile-responsive design (breakpoints: 640/768/1024/1280px)
- [ ] Lighthouse score target 95+ documented

### Testing & Quality (Principle VIII)
- [ ] Unit tests planned for business logic
- [ ] Integration tests planned for API endpoints
- [ ] E2E tests planned for user flows
- [ ] 80%+ code coverage target for services/models
- [ ] Link validation strategy documented

### Documentation (Principle IX)
- [ ] API endpoints will be documented in SPEEDSTEIN_API_REFERENCE.md
- [ ] Code examples planned for JS, Python, PHP, Ruby
- [ ] README updates identified
- [ ] Complex logic will have inline comments
- [ ] Public functions will have JSDoc/TSDoc

### Deployment & Operations (Principle X)
- [ ] Zero-downtime deployment strategy documented
- [ ] Sentry error tracking configured
- [ ] 99.9% uptime monitoring planned
- [ ] Structured logging for critical operations
- [ ] Environment variables for configuration

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
