# Speedstein Documentation Package
## Complete Technical Documentation for Building the Fastest PDF API

**Project:** Speedstein (speedstein.com)  
**Tagline:** "POST HTML → Get Beautiful PDF in <2 Seconds"  
**Version:** 1.0  
**Generated:** October 25, 2025

---

## 📦 Documentation Files

This package contains four comprehensive documents to guide you through building Speedstein from concept to launch:

### 1. **SPEEDSTEIN_TECHNICAL_SPEC.md**
**The Complete Technical Specification**

This document covers:
- ✅ Executive summary and market positioning
- ✅ Complete technical architecture
- ✅ Cap'n Web integration strategy (with actual code examples)
- ✅ Database schema with RLS policies
- ✅ OKLCH color system implementation
- ✅ API endpoint specifications
- ✅ Security considerations
- ✅ Performance targets and benchmarks
- ✅ Deployment architecture
- ✅ Competitive analysis

**Read this first** to understand the overall system architecture and technical decisions.

---

### 2. **SPEEDSTEIN_API_REFERENCE.md**
**Developer-Facing API Documentation**

This document covers:
- ✅ Complete API reference for all endpoints
- ✅ Authentication methods
- ✅ Quick start guide
- ✅ REST API examples
- ✅ WebSocket API examples (Cap'n Web)
- ✅ Error handling and status codes
- ✅ Rate limiting details
- ✅ Webhook configuration
- ✅ Code examples in JavaScript, Python, PHP, Ruby
- ✅ Best practices

**This is what your users will read** once the API is live.

---

### 3. **SPEEDSTEIN_IMPLEMENTATION_PLAN.md**
**Step-by-Step Build Instructions**

This document covers:
- ✅ 50 detailed implementation steps
- ✅ Organized into 10 phases (6-week timeline)
- ✅ Plain English instructions (no code, just what to build)
- ✅ Phase 1: Setup (repository, Supabase, Cap'n Web study)
- ✅ Phase 2: Landing page with live demo
- ✅ Phase 3: Authentication & dashboard
- ✅ Phase 4: Cloudflare Workers + Cap'n Web RPC
- ✅ Phase 5: Auth, rate limiting, usage tracking
- ✅ Phase 6: DodoPayments integration
- ✅ Phase 7: Advanced features (WebSocket, caching)
- ✅ Phase 8: Testing & QA
- ✅ Phase 9: Monitoring & observability
- ✅ Phase 10: Launch preparation

**Use this as your roadmap** - follow each step in order with Claude Code CLI.

---

### 4. **SPEEDSTEIN_TECHSTACK.md**
**Complete Technology Stack Documentation**

This document covers:
- ✅ Architecture diagram
- ✅ Frontend stack (Next.js 15, React, Tailwind, shadcn/ui)
- ✅ Backend stack (Cloudflare Workers, Cap'n Web, Supabase)
- ✅ Infrastructure (Vercel, Cloudflare DNS, R2, KV)
- ✅ Development tools (TypeScript, ESLint, Vitest, Playwright)
- ✅ Third-party services (DodoPayments, Sentry, Analytics)
- ✅ Why each technology was chosen
- ✅ Alternative technologies considered
- ✅ Environment variables
- ✅ Deployment workflow
- ✅ Cost estimates

**Read this** to understand all technologies used and why they were selected.

---

## 🎯 Getting Started

### Step 1: Read the Documentation
1. Start with **SPEEDSTEIN_TECHNICAL_SPEC.md** to understand the architecture
2. Review **SPEEDSTEIN_API_REFERENCE.md** to understand the API you're building
3. Study **SPEEDSTEIN_TECHSTACK.md** to understand all technologies
4. Follow **SPEEDSTEIN_IMPLEMENTATION_PLAN.md** step-by-step to build

### Step 2: Set Up Your Environment
```bash
# Create project directory
mkdir speedstein
cd speedstein

# Clone Cap'n Web to study it
git clone https://github.com/cloudflare/capnweb.git

# Study the examples
cd capnweb
npm install
npm run test  # Run tests to see Cap'n Web in action
cd examples   # Review example implementations
```

### Step 3: Begin Implementation
Follow the implementation plan starting with **Phase 1, Step 1**:

```bash
# Initialize Next.js project
npx create-next-app@latest speedstein-frontend --typescript --tailwind --app

# Initialize Cloudflare Worker
mkdir speedstein-backend
cd speedstein-backend
npm init -y
npm install -D wrangler
npx wrangler init
```

### Step 4: Use Claude Code CLI
For each step in the implementation plan, use Claude Code to generate the actual code:

```bash
claude-code "Implement Step 6: Design System Setup - create Tailwind config with OKLCH color tokens"
```

---

## 🚀 Key Features

### What Makes Speedstein Fast?
1. **Cap'n Web Promise Pipelining:** Chain multiple API calls in one round trip
2. **Browser Session Reuse:** Keep Chrome instances warm, eliminate cold starts
3. **Edge Compute:** Cloudflare Workers run in 300+ cities worldwide
4. **Real Chrome Rendering:** Perfect CSS support, far superior to wkhtmltopdf

### What Makes Speedstein Unique?
1. **Live Demo on Landing Page:** Draggable HTML editor → instant PDF preview
2. **Beautiful Design:** OKLCH color system for perceptually uniform colors
3. **Developer-First API:** Clean, simple REST interface + advanced WebSocket option
4. **Competitive Pricing:** 5K PDFs for $29/month (vs DocRaptor's $49 for 2K)

---

## 📊 Technical Highlights

### Cap'n Web Integration
**Why Cap'n Web is perfect for PDF generation:**

```typescript
// Server: Cloudflare Worker with Cap'n Web RPC
import { RpcTarget, newWorkersRpcResponse } from "capnweb";

class PdfGeneratorApi extends RpcTarget {
  async generatePdf(html: string, options: PdfOptions): Promise<PdfResult> {
    // Use Cloudflare Browser Rendering API
    const page = await env.BROWSER.newPage();
    await page.setContent(html);
    const pdf = await page.pdf(options);
    return { url: uploadToR2(pdf) };
  }
}

export default {
  fetch(request, env) {
    return newWorkersRpcResponse(request, new PdfGeneratorApi(env));
  }
};
```

```typescript
// Client: Promise pipelining (all in ONE round trip!)
import { newHttpBatchRpcSession } from "capnweb";

const api = newHttpBatchRpcSession("https://api.speedstein.com/api/rpc");

// Don't await yet - chain the calls
const userPromise = api.getUser();
const invoice1 = api.generateInvoice(userPromise.id, { month: 1 });
const invoice2 = api.generateInvoice(userPromise.id, { month: 2 });

// Now await everything at once (single network request!)
const [user, pdf1, pdf2] = await Promise.all([userPromise, invoice1, invoice2]);
```

### OKLCH Color System
**Why OKLCH matters for Speedstein:**

```css
/* Perceptually uniform colors for better accessibility */
:root {
  /* Same lightness = same perceived brightness across ALL hues */
  --blue-500: oklch(0.60 0.22 250);
  --green-500: oklch(0.60 0.18 142);
  --red-500: oklch(0.60 0.24 25);
  
  /* Elevation through lightness manipulation */
  --surface-base: oklch(0.98 0 0);
  --surface-raised: oklch(0.99 0 0);  /* +0.01 lightness = subtle elevation */
  --surface-overlay: oklch(1.00 0 0); /* +0.02 lightness = modal */
}

/* Dark mode: just invert lightness, keep chroma and hue */
[data-theme="dark"] {
  --blue-500: oklch(0.70 0.22 250);  /* Increase L for contrast */
}

/* Interactive states using relative color syntax */
.button-primary {
  background: var(--blue-500);
}
.button-primary:hover {
  background: oklch(from var(--blue-500) calc(l + 0.05) c h);
}
```

---

## 🏗️ Architecture Overview

```
USER → Next.js Landing Page (Vercel)
  ↓
  POST /api/generate
  ↓
Cloudflare Workers (Global Edge)
  ├─ Cap'n Web RPC Server
  ├─ API Key Auth (Supabase)
  ├─ Rate Limiting (KV Store)
  └─ Browser Rendering API (Puppeteer)
      ↓
      Generate PDF
      ↓
      Upload to R2 Bucket
      ↓
      Return Public URL
```

---

## 📋 Implementation Checklist

### Phase 1: Setup (Week 1)
- [ ] Repository setup with Next.js 15
- [ ] Clone and study Cap'n Web repository
- [ ] Supabase project setup (database + auth)
- [ ] Local development environment

### Phase 2: Landing Page (Week 1-2)
- [ ] OKLCH color system implementation
- [ ] shadcn/ui component library
- [ ] Hero section with live demo
- [ ] Pricing section
- [ ] SEO optimization

### Phase 3: Authentication (Week 2)
- [ ] Signup/login flows
- [ ] Protected routes
- [ ] Dashboard layout
- [ ] API key management

### Phase 4: Cloudflare Workers (Week 3)
- [ ] Worker setup
- [ ] Cap'n Web RPC implementation
- [ ] REST API wrapper
- [ ] Batch generation

### Phase 5: Auth & Security (Week 3-4)
- [ ] API key middleware
- [ ] Rate limiting
- [ ] Usage tracking
- [ ] Plan quotas

### Phase 6: Payments (Week 4)
- [ ] DodoPayments integration
- [ ] Checkout flow
- [ ] Webhook handler
- [ ] Subscription management

### Phase 7: Advanced Features (Week 5)
- [ ] WebSocket support
- [ ] Promise pipelining
- [ ] PDF caching

### Phase 8: Testing (Week 5-6)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance tests
- [ ] Security audit

### Phase 9: Monitoring (Week 6)
- [ ] Logging
- [ ] Error tracking (Sentry)
- [ ] Metrics dashboard
- [ ] Uptime monitoring

### Phase 10: Launch (Week 6)
- [ ] Documentation polish
- [ ] Beta testing
- [ ] Launch checklist
- [ ] Go live!

---

## 💡 Design System Preview

### Color Palette (OKLCH)
- **Gray Scale:** 11 shades from 50 (lightest) to 950 (darkest)
- **Primary (Blue):** oklch(0.60 0.22 250) with 9 shades
- **Success (Green):** oklch(0.68 0.18 142)
- **Warning (Amber):** oklch(0.75 0.16 75)
- **Error (Red):** oklch(0.60 0.24 25)

### Typography
- **Font Family:** System font stack for best performance
- **Headings:** Bold, tight line-height
- **Body:** Regular, comfortable line-height (1.6)

### Components
- **Buttons:** Primary, secondary, ghost, destructive variants
- **Cards:** Subtle elevation using lightness manipulation
- **Inputs:** Clean, accessible form controls
- **Dark Mode:** Smooth transitions with inverted OKLCH lightness

---

## 🎓 Key Learnings from Documentation

### Cap'n Web Best Practices
1. **Always extend RpcTarget** for server-side classes
2. **Use promise pipelining** for dependent calls
3. **Dispose resources properly** with `using` or `[Symbol.dispose]()`
4. **Implement batching** for multiple PDF generations
5. **Keep WebSocket sessions alive** with heartbeats

### OKLCH Color Best Practices
1. **Use zero chroma for grays** (pure grayscale)
2. **Maintain consistent lightness** for accessibility
3. **Increase lightness for elevation** (surfaces)
4. **Use relative color syntax** for hover/active states
5. **Test in both light and dark modes**

### Cloudflare Workers Best Practices
1. **Cache API keys in KV** to reduce database hits
2. **Use R2 for file storage** (zero egress fees)
3. **Implement rate limiting** to prevent abuse
4. **Keep browser sessions warm** for performance
5. **Set CPU limits** to prevent runaway processes

---

## 📈 Success Metrics

### Technical KPIs
- **P95 Generation Time:** <2 seconds
- **API Uptime:** 99.9%+
- **Error Rate:** <0.1%
- **Cache Hit Rate:** >60%

### Business KPIs
- **MRR:** Target $50K by Month 6
- **API Call Volume:** 1M+ PDFs/month
- **Customer Churn:** <5% monthly
- **Customer Lifetime Value:** >$500

---

## 🔗 Important Links

### Documentation
- **Cap'n Web GitHub:** https://github.com/cloudflare/capnweb
- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **OKLCH Color Picker:** https://oklch.com

### Tools
- **Claude Code CLI:** For generating code from this plan
- **Wrangler:** For deploying Cloudflare Workers
- **Vercel CLI:** For deploying Next.js app

---

## 🤝 Next Steps

1. **Read all four documents carefully**
2. **Study the Cap'n Web repository** (critical!)
3. **Set up your development environment**
4. **Follow the implementation plan step-by-step**
5. **Use Claude Code CLI to generate code**
6. **Test each feature before moving to the next**
7. **Deploy to staging after each phase**
8. **Launch with confidence!**

---

## ❓ FAQ

**Q: Do I need to know Cap'n Web before starting?**  
A: No! Step 2 of the implementation plan specifically includes studying the Cap'n Web repository. Follow that step carefully before implementing the backend.

**Q: Can I use a different payment provider instead of DodoPayments?**  
A: Yes, but the documentation was written specifically for DodoPayments. You'll need to adapt the webhook handling and API calls.

**Q: How long will this take to build?**  
A: Estimated 4-6 weeks for a solo developer, 3-4 weeks with a small team. Timeline assumes full-time work.

**Q: Do I need to implement all features before launching?**  
A: No! You can launch with core features (Phases 1-6) and add advanced features (Phase 7) post-launch.

**Q: What if I get stuck?**  
A: Use Claude Code CLI with specific questions, review the relevant documentation section, or study the Cap'n Web examples.

---

## 📄 License & Usage

This documentation package is provided to help you build Speedstein. Feel free to adapt it for your needs, but please:
- Don't redistribute the documentation as your own
- Credit Cap'n Web and other open-source projects used
- Follow best practices for security and accessibility

---

**Documentation Version:** 1.0  
**Last Updated:** October 25, 2025  
**Author:** Technical Documentation Team  

**Ready to build the fastest PDF API on the market?** Start with SPEEDSTEIN_TECHNICAL_SPEC.md! 🚀
