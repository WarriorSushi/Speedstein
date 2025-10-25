# Speedstein Technology Stack
## Complete Technical Infrastructure Guide

**Last Updated:** October 25, 2025  
**Version:** 1.0

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Frontend Stack](#frontend-stack)
3. [Backend Stack](#backend-stack)
4. [Infrastructure & DevOps](#infrastructure--devops)
5. [Development Tools](#development-tools)
6. [Third-Party Services](#third-party-services)
7. [Why These Technologies](#why-these-technologies)

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │   Landing Page   │  │   Dashboard    │  │  Live PDF Demo  │ │
│  │   (Next.js 15)   │  │  (React + UI)  │  │ (Monaco Editor) │ │
│  └────────┬─────────┘  └────────┬───────┘  └────────┬────────┘ │
└───────────┼──────────────────────┼───────────────────┼──────────┘
            │                      │                   │
            │ HTTPS                │ Auth + API        │ REST/WS
            ▼                      ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js 15 App (ISR/SSR/SSG)                │  │
│  │  • Server Components    • Image Optimization             │  │
│  │  • API Routes          • Middleware                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              │ API Calls
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE GLOBAL NETWORK                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  CLOUDFLARE WORKERS                       │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │          Cap'n Web RPC Server                      │  │  │
│  │  │  • PdfGeneratorApi (RpcTarget)                     │  │  │
│  │  │  • HTTP Batch + WebSocket Support                  │  │  │
│  │  │  • Promise Pipelining                              │  │  │
│  │  │  • Session Management                              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │          Middleware Pipeline                       │  │  │
│  │  │  • API Key Authentication                          │  │  │
│  │  │  • Rate Limiting (KV Store)                        │  │  │
│  │  │  • Usage Tracking                                  │  │  │
│  │  │  • CORS Handling                                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  KV Store    │  │   R2 Bucket  │  │  Browser Rendering   │ │
│  │  (Cache +    │  │  (PDF Files) │  │  API (Puppeteer)     │ │
│  │   Rate Limit)│  │              │  │                      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└──────────┬──────────────────────────────────────────────────────┘
           │
           │ Database Queries
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                         │  │
│  │  • users, api_keys, subscriptions, usage_records        │  │
│  │  • Row Level Security (RLS) Policies                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Supabase Auth                               │  │
│  │  • JWT-based authentication                             │  │
│  │  • Email/Password, Social OAuth                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Supabase Realtime                           │  │
│  │  • Live usage updates in dashboard                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │
           │ Webhook Events
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DODO PAYMENTS                              │
│  • Subscription billing                                         │
│  • Payment processing                                           │
│  • Webhook notifications                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Stack

### Core Framework
**Next.js 15.0+**
- **Why:** Best-in-class React framework with App Router, Server Components, and edge runtime support
- **Features Used:**
  - App Router for file-based routing
  - Server Components for reduced client-side JavaScript
  - API Routes for backend logic
  - Middleware for authentication
  - Image Optimization (`next/image`)
  - Font Optimization (`next/font`)
  - Incremental Static Regeneration (ISR)
- **Installation:** `npx create-next-app@latest speedstein --typescript --tailwind --app`

### UI Framework
**React 18+**
- **Why:** Industry-standard UI library with excellent ecosystem
- **Features Used:**
  - Hooks (useState, useEffect, useCallback, useMemo)
  - Context API for global state
  - Suspense for loading states
  - Error Boundaries
- **Installation:** Included with Next.js

### UI Component Library
**shadcn/ui**
- **Why:** Unstyled, accessible components built on Radix UI primitives
- **Components Used:**
  - Button, Card, Dialog, Dropdown Menu
  - Input, Label, Textarea, Select
  - Toast, Alert, Badge, Avatar
  - Tabs, Accordion, Collapsible
  - Table, Pagination
- **Installation:** `npx shadcn-ui@latest init`
- **Add Components:** `npx shadcn-ui@latest add button card input`

### Styling
**Tailwind CSS 3.4+**
- **Why:** Utility-first CSS framework with excellent DX and performance
- **Custom Configuration:**
  - OKLCH color system (custom color definitions)
  - Extended spacing scale
  - Custom animation utilities
  - Dark mode support (`class` strategy)
- **Plugins Used:**
  - `@tailwindcss/typography` for prose content
  - `@tailwindcss/forms` for better form styling
- **Installation:** Included with Next.js setup

**OKLCH Color System**
- **Why:** Perceptually uniform colors for consistent accessibility and design
- **Implementation:**
  ```javascript
  // tailwind.config.js
  module.exports = {
    theme: {
      extend: {
        colors: {
          gray: {
            50: 'oklch(0.98 0 0)',
            100: 'oklch(0.95 0 0)',
            // ... rest of scale
          },
          primary: {
            500: 'oklch(0.60 0.22 250)',
            // ... rest of scale
          }
        }
      }
    }
  };
  ```

### Code Editor (Live Demo)
**Monaco Editor** or **CodeMirror 6**
- **Why:** Full-featured code editor with syntax highlighting
- **Features:**
  - HTML/CSS/JavaScript syntax highlighting
  - Auto-completion
  - Error detection
  - Theming (light/dark)
- **Installation:** `npm install @monaco-editor/react` or `npm install @codemirror/state @codemirror/view`

### State Management
**Zustand** or **React Context API**
- **Why:** Lightweight state management for global state (theme, user session)
- **Use Cases:**
  - Theme toggle (light/dark mode)
  - User authentication state
  - API key management
  - Dashboard data caching
- **Installation:** `npm install zustand` (if using Zustand)

### Theme Management
**next-themes**
- **Why:** Effortless dark mode for Next.js with no flash
- **Features:**
  - System preference detection
  - Persistent theme selection
  - No flash on page load
- **Installation:** `npm install next-themes`

### Form Handling
**React Hook Form**
- **Why:** Performant form library with excellent validation support
- **Features:**
  - Minimal re-renders
  - Built-in validation
  - TypeScript support
- **Installation:** `npm install react-hook-form`

**Zod**
- **Why:** TypeScript-first schema validation
- **Use Cases:**
  - API request validation
  - Form validation
  - Environment variable validation
- **Installation:** `npm install zod`

---

## Backend Stack

### API Runtime
**Cloudflare Workers**
- **Why:** Edge compute with global distribution, 0ms cold starts, and excellent performance
- **Features:**
  - Runs on V8 isolates (faster than containers)
  - Global deployment (300+ cities)
  - Built-in KV storage
  - R2 object storage
  - Browser Rendering API
  - DDoS protection
- **Deployment:** `npx wrangler deploy`

### RPC Framework
**Cap'n Web (capnweb)**
- **Why:** JavaScript-native RPC with promise pipelining and bidirectional communication
- **Features Used:**
  - RpcTarget for server-side API
  - RpcStub for client-side proxy
  - RpcPromise for pipelining
  - HTTP Batch mode
  - WebSocket mode
  - Session management
  - Resource disposal
- **Installation:** `npm install capnweb`
- **Documentation:** https://github.com/cloudflare/capnweb

### PDF Generation Engine
**Cloudflare Browser Rendering API (Puppeteer)**
- **Why:** Real Chrome rendering for perfect CSS support
- **Features:**
  - Latest Chrome version
  - Full CSS support (Flexbox, Grid, Custom Properties)
  - JavaScript execution
  - PDF generation with options
  - Screenshot capabilities
- **API Docs:** https://developers.cloudflare.com/browser-rendering/

### Database
**Supabase (PostgreSQL)**
- **Why:** Open-source Firebase alternative with full PostgreSQL power
- **Features Used:**
  - PostgreSQL 15
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Connection pooling (PgBouncer)
  - Automated backups
- **Tables:**
  - `users` - User accounts
  - `api_keys` - API authentication
  - `subscriptions` - Billing plans
  - `usage_records` - PDF generation tracking
  - `pdf_cache` - Optional caching
- **Installation:** `npm install @supabase/supabase-js`

### Authentication
**Supabase Auth**
- **Why:** Built-in auth with JWT tokens and social providers
- **Providers:**
  - Email/Password
  - Magic Link
  - Google OAuth (optional)
  - GitHub OAuth (optional)
- **Features:**
  - JWT-based sessions
  - Automatic token refresh
  - Email verification
  - Password reset
- **Installation:** Included with `@supabase/supabase-js`

### Storage
**Cloudflare R2**
- **Why:** S3-compatible object storage with zero egress fees
- **Use Cases:**
  - Generated PDF storage
  - Custom font files
  - Static assets
- **Features:**
  - Automatic CDN distribution
  - Lifecycle policies
  - Public/private buckets
- **Setup:** Configure in `wrangler.toml`

**Cloudflare KV**
- **Why:** Low-latency key-value store for edge data
- **Use Cases:**
  - API key caching
  - Rate limit counters
  - Session data
- **Features:**
  - Global replication
  - TTL support
  - Atomic operations
- **Setup:** Configure in `wrangler.toml`

---

## Infrastructure & DevOps

### Hosting & CDN
**Vercel**
- **Why:** Best hosting for Next.js with edge functions and zero config
- **Features:**
  - Automatic deployments from Git
  - Preview deployments for PRs
  - Edge Network (global CDN)
  - Analytics and Web Vitals
  - Built-in SSL
- **Deployment:** Connect GitHub repo to Vercel

**Cloudflare DNS**
- **Why:** Fast DNS with integrated DDoS protection
- **Setup:**
  - speedstein.com → Vercel
  - api.speedstein.com → Cloudflare Workers
  - status.speedstein.com → Statuspage.io

### Version Control
**Git + GitHub**
- **Why:** Industry standard for version control and collaboration
- **Branching Strategy:**
  - `main` - Production code
  - `staging` - Pre-production testing
  - `feature/*` - New features
- **CI/CD:** GitHub Actions for automated testing and deployment

### Package Management
**npm** or **pnpm**
- **Why:** Standard package manager for Node.js projects
- **Configuration:**
  - `package.json` for dependencies
  - `package-lock.json` for deterministic installs
- **Recommendation:** Use `pnpm` for faster installs and reduced disk usage

### Build Tools
**Wrangler** (Cloudflare CLI)
- **Why:** Official CLI for Cloudflare Workers
- **Commands:**
  - `wrangler dev` - Local development
  - `wrangler deploy` - Deploy to Cloudflare
  - `wrangler tail` - Stream logs
- **Installation:** `npm install -g wrangler`

**Vercel CLI**
- **Why:** Deploy and manage Vercel projects from command line
- **Commands:**
  - `vercel dev` - Local development
  - `vercel` - Deploy to preview
  - `vercel --prod` - Deploy to production
- **Installation:** `npm install -g vercel`

---

## Development Tools

### TypeScript
**TypeScript 5.3+**
- **Why:** Type safety prevents bugs and improves DX
- **Configuration:**
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "target": "ES2022",
      "module": "ESNext",
      "jsx": "preserve",
      "moduleResolution": "bundler"
    }
  }
  ```
- **Installation:** `npm install -D typescript @types/node @types/react`

### Linting & Formatting
**ESLint**
- **Why:** Catch errors and enforce code style
- **Configuration:** Next.js includes ESLint config
- **Custom Rules:**
  - `no-console` warning (except console.error)
  - `@typescript-eslint/no-explicit-any` error
- **Installation:** Included with Next.js

**Prettier**
- **Why:** Automatic code formatting for consistency
- **Configuration:**
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5"
  }
  ```
- **Installation:** `npm install -D prettier`

### Testing
**Vitest**
- **Why:** Fast unit testing with Vite-powered speed
- **Use Cases:**
  - API route testing
  - Utility function testing
  - Component testing (with React Testing Library)
- **Installation:** `npm install -D vitest @vitejs/plugin-react`

**Playwright**
- **Why:** Reliable end-to-end testing
- **Use Cases:**
  - Full user flows (signup, login, generate PDF)
  - Cross-browser testing
  - Visual regression testing
- **Installation:** `npm install -D @playwright/test`

### API Testing
**Postman** or **Insomnia**
- **Why:** Interactive API testing and documentation
- **Use Cases:**
  - Test API endpoints during development
  - Generate code snippets for docs
  - Share collections with team

**cURL**
- **Why:** Command-line HTTP client for quick testing
- **Use Cases:**
  - Test API endpoints from terminal
  - Debug webhook deliveries

---

## Third-Party Services

### Payment Processing
**DodoPayments**
- **Why:** Simple subscription billing (requested by user)
- **Features:**
  - Subscription management
  - Usage-based billing
  - Webhook events
  - Invoice generation
- **Integration:** REST API + Webhooks
- **Documentation:** https://dodopayments.com/docs

### Error Tracking
**Sentry**
- **Why:** Industry-leading error monitoring
- **Features:**
  - Real-time error alerts
  - Stack traces with source maps
  - User context tracking
  - Performance monitoring
- **Installation:** `npm install @sentry/nextjs @sentry/node`
- **Setup:** `npx @sentry/wizard -i nextjs`

### Analytics
**Vercel Analytics**
- **Why:** Built-in analytics with zero config
- **Features:**
  - Real User Monitoring (RUM)
  - Web Vitals tracking
  - Page view tracking
- **Installation:** `npm install @vercel/analytics`

**Google Analytics 4**
- **Why:** Comprehensive analytics and conversion tracking
- **Features:**
  - User behavior tracking
  - Conversion funnels
  - Custom events
- **Installation:** `npm install react-ga4`

### Uptime Monitoring
**UptimeRobot** or **Pingdom**
- **Why:** Ensure 99.9% uptime
- **Features:**
  - Endpoint monitoring every 60 seconds
  - Alert notifications (email, Slack)
  - Status page integration

**Statuspage.io**
- **Why:** Public status page for transparency
- **Features:**
  - Incident management
  - Scheduled maintenance announcements
  - Subscriber notifications
- **URL:** status.speedstein.com

### Email Service
**Supabase Email** or **Resend**
- **Why:** Transactional email delivery
- **Use Cases:**
  - Welcome emails
  - Password reset
  - Subscription notifications
  - Usage alerts
- **Installation:** `npm install resend` (if using Resend)

---

## Why These Technologies

### Cap'n Web for RPC
**Chosen because:**
- **Promise Pipelining:** Multiple dependent API calls in one round trip → 5x faster
- **Session Reuse:** Keep browser instances warm → eliminate cold starts
- **Bidirectional RPC:** Server can notify clients without polling
- **Zero Boilerplate:** No schema files, just TypeScript interfaces
- **Cloudflare Integration:** Works seamlessly with Workers

**Alternatives considered:**
- gRPC: Requires protobuf schemas, no browser support
- tRPC: Great for TypeScript full-stack apps, but no promise pipelining
- REST: No pipelining, more latency

### Next.js 15 for Frontend
**Chosen because:**
- **App Router:** Better DX and performance than Pages Router
- **Server Components:** Reduced JavaScript bundle sizes
- **Image Optimization:** Automatic WebP/AVIF conversion and lazy loading
- **Edge Runtime:** Deploy API routes to edge for low latency
- **Vercel Integration:** Zero-config deployment

**Alternatives considered:**
- Remix: Great framework, but less mature ecosystem
- Astro: Better for content-heavy sites, not SaaS apps
- Vite + React: More manual setup required

### Cloudflare Workers for Backend
**Chosen because:**
- **Global Distribution:** 300+ edge locations worldwide
- **0ms Cold Starts:** V8 isolates start instantly
- **Cost-Effective:** Free tier includes 100K requests/day
- **Integrated Services:** KV, R2, Browser Rendering all in one platform
- **DDoS Protection:** Built-in, no extra cost

**Alternatives considered:**
- AWS Lambda: Cold starts, more expensive, complex setup
- Vercel Serverless Functions: Good, but limited to Vercel platform
- Railway/Fly.io: Great for containers, but not edge compute

### OKLCH Color System
**Chosen because:**
- **Perceptual Uniformity:** Equal lightness values look equally bright across all hues
- **Accessibility:** Easier to maintain consistent contrast ratios
- **Dark Mode:** Seamless color transformations by adjusting lightness
- **Wide Gamut:** Display P3 support for modern devices
- **Future-Proof:** CSS Color Module Level 4 standard

**Alternatives considered:**
- HSL: Not perceptually uniform, causes accessibility issues
- RGB/Hex: Not human-readable, hard to maintain
- LCH: Good, but OKLCH has improved hue stability

### Supabase for Database
**Chosen because:**
- **PostgreSQL:** Full SQL power, not limited like Firebase
- **Row Level Security:** Built-in security at database level
- **Real-time:** WebSocket subscriptions for live updates
- **Auth Included:** No need for separate auth service
- **Open Source:** Can self-host if needed

**Alternatives considered:**
- Firebase: Great for prototypes, but limited query capabilities
- PlanetScale: MySQL-based, not as feature-rich as PostgreSQL
- Neon: Good, but less mature than Supabase

### DodoPayments for Billing
**Chosen because:**
- **User Request:** Specified by you in requirements
- **Simple Integration:** Easy API, good documentation
- **Subscription Support:** Built for recurring billing

**Alternatives considered:**
- Stripe: More features, but more complex setup
- Paddle: Good for SaaS, but higher fees
- LemonSqueezy: Great DX, but newer/less proven

---

## Environment Variables

### Production Environment
```bash
# Next.js (Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=https://api.speedstein.com
DODO_PAYMENTS_API_KEY=dp_live_...
DODO_PAYMENTS_WEBHOOK_SECRET=whsec_...
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Cloudflare Workers
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DODO_PAYMENTS_API_KEY=dp_live_...
```

---

## Deployment Workflow

### Local Development
```bash
# Frontend (Next.js)
npm run dev         # Start dev server on localhost:3000

# Backend (Cloudflare Workers)
wrangler dev        # Start local worker on localhost:8787
```

### Staging Deployment
```bash
# Frontend
vercel              # Deploy to preview URL

# Backend
wrangler deploy --env staging
```

### Production Deployment
```bash
# Frontend (automatic via Vercel)
git push origin main

# Backend
wrangler deploy --env production
```

---

## Resource Requirements

### Development Machine
- **CPU:** 4+ cores recommended
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 50GB free space
- **OS:** macOS, Linux, or Windows with WSL2

### Production Costs (Estimated Monthly)
| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Cloudflare Workers | Paid | $5 |
| Supabase | Pro | $25 |
| Cloudflare R2 | Pay-as-you-go | $5-50 |
| DodoPayments | Transaction fees | 2.9% + $0.30 |
| Sentry | Developer | $26 |
| **Total** | | **$81-126/mo** |

### Scaling Costs
- **1M API requests:** ~$50-100/month
- **10TB PDF storage:** ~$150/month
- **100K active users:** ~$200-300/month

---

## Dependencies Overview

### Frontend (`package.json`)
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "next-themes": "^0.3.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8",
    "@monaco-editor/react": "^4.6.0",
    "capnweb": "^0.1.0",
    "@vercel/analytics": "^1.3.1",
    "react-ga4": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.57.0",
    "prettier": "^3.3.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.46.0"
  }
}
```

### Backend (`package.json` for Worker)
```json
{
  "dependencies": {
    "capnweb": "^0.1.0",
    "@supabase/supabase-js": "^2.45.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240925.0",
    "wrangler": "^3.78.0",
    "typescript": "^5.3.0"
  }
}
```

---

## Learning Resources

### Official Documentation
- **Next.js:** https://nextjs.org/docs
- **Cap'n Web:** https://github.com/cloudflare/capnweb
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com

### OKLCH Resources
- **Color Picker:** https://oklch.com
- **Evil Martians Guide:** https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- **Smashing Magazine:** https://www.smashingmagazine.com/2023/08/oklch-color-spaces-gamuts-css/

### Tutorials & Courses
- **Next.js Crash Course:** https://www.youtube.com/watch?v=gSSsZReIFRk (Traversy Media)
- **Cloudflare Workers Tutorial:** https://developers.cloudflare.com/workers/tutorials/
- **Supabase Full Course:** https://www.youtube.com/watch?v=7uKQBl9uZ00 (Fireship)

---

**Document Version:** 1.0  
**Last Updated:** October 25, 2025  
**Author:** Technical Architecture Team
