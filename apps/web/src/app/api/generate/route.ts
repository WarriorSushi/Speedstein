/**
 * Demo PDF Generation API Route
 *
 * Allows unauthenticated PDF generation for the landing page demo.
 * This is a proxy to the Cloudflare Worker PDF generation service.
 *
 * Constitution Compliance:
 * - Principle VII: Live demo works without authentication
 * - Rate limited to prevent abuse (via Cloudflare Worker)
 *
 * @packageDocumentation
 */

import { NextRequest, NextResponse } from 'next/server'

// Use localhost for development, even if NEXT_PUBLIC_API_URL is set
// Only use production URL if explicitly in production environment
const WORKER_URL = process.env.NODE_ENV === 'production'
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://api.speedstein.com')
  : 'http://127.0.0.1:8787'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { html, options } = body

    // Validate HTML is provided
    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_HTML',
            message: 'HTML content is required',
          },
        },
        { status: 400 }
      )
    }

    // Forward request to Cloudflare Worker
    // Note: For demo, we skip authentication. Worker should rate limit by IP.
    const workerResponse = await fetch(`${WORKER_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Demo requests don't include Authorization header
        'X-Demo-Request': 'true',
      },
      body: JSON.stringify({ html, options }),
    })

    // Check if worker responded successfully
    if (!workerResponse.ok) {
      const errorData = await workerResponse.json().catch(() => ({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'PDF generation failed',
        },
      }))

      return NextResponse.json(errorData, { status: workerResponse.status })
    }

    // Worker returns PDF buffer directly for demo requests
    const contentType = workerResponse.headers.get('Content-Type')

    if (contentType === 'application/pdf') {
      // Binary PDF response - return directly
      const pdfBuffer = await workerResponse.arrayBuffer()

      // Forward performance headers from worker
      const generationTime = workerResponse.headers.get('X-Generation-Time')
      const responseHeaders: Record<string, string> = {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="speedstein-${Date.now()}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }

      if (generationTime) {
        responseHeaders['X-Generation-Time'] = generationTime
      }

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: responseHeaders,
      })
    }

    // Fallback: JSON response (for authenticated requests with R2 URL)
    const responseData = await workerResponse.json()

    // Fetch the PDF from R2 URL
    const pdfResponse = await fetch(responseData.data.url)
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF from storage: ${pdfResponse.status}`)
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="speedstein-${Date.now()}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during PDF generation',
        },
      },
      { status: 500 }
    )
  }
}

// Disable body size limit for PDF generation (handles large HTML)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
