import { beforeAll, vi } from 'vitest'

// Mock Cloudflare Workers globals that don't exist in Node.js
beforeAll(() => {
  // Mock crypto.subtle.digestSync (Cloudflare Workers only)
  // In real Cloudflare Workers, this is available. In Node.js tests, we need to mock it.
  if (!global.crypto.subtle) {
    global.crypto = {
      ...global.crypto,
      subtle: {
        ...global.crypto.subtle,
        // @ts-expect-error - Mock for testing
        digestSync: vi.fn((algorithm: string, data: BufferSource) => {
          // Use Node.js crypto for actual hashing in tests
          const nodeCrypto = require('crypto')
          const hash = nodeCrypto.createHash('sha256')
          hash.update(Buffer.from(data as ArrayBuffer))
          return hash.digest()
        }),
      },
    } as any
  }

  // Mock other Cloudflare-specific APIs as needed
  // e.g., KV, R2, Durable Objects, etc.
})
