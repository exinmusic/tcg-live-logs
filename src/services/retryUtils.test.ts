/**
 * Tests for fetchWithRetry utility.
 *
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWithRetry } from './retryUtils'

// Stub global fetch
const mockFetch = vi.fn<typeof globalThis.fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
  // Speed up tests by eliminating real delays
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

function okResponse(body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status: 200 })
}

function serverErrorResponse(status = 500): Response {
  return new Response('Server Error', { status })
}

function clientErrorResponse(status = 400): Response {
  return new Response('Bad Request', { status })
}

// ---------------------------------------------------------------------------
// Success on first attempt
// ---------------------------------------------------------------------------

describe('fetchWithRetry', () => {
  it('returns immediately on a successful response', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ ok: true }))

    const res = await fetchWithRetry('https://api.example.com/logs')

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------------
  // 4xx — no retry
  // -------------------------------------------------------------------------

  it('does not retry 4xx client errors', async () => {
    mockFetch.mockResolvedValueOnce(clientErrorResponse(400))

    const res = await fetchWithRetry('https://api.example.com/logs')

    expect(res.status).toBe(400)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry 401 unauthorized', async () => {
    mockFetch.mockResolvedValueOnce(clientErrorResponse(401))

    const res = await fetchWithRetry('https://api.example.com/logs')

    expect(res.status).toBe(401)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry 403 forbidden', async () => {
    mockFetch.mockResolvedValueOnce(clientErrorResponse(403))

    const res = await fetchWithRetry('https://api.example.com/logs')

    expect(res.status).toBe(403)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry 404 not found', async () => {
    mockFetch.mockResolvedValueOnce(clientErrorResponse(404))

    const res = await fetchWithRetry('https://api.example.com/logs')

    expect(res.status).toBe(404)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------------
  // 5xx — retry with backoff
  // -------------------------------------------------------------------------

  it('retries 500 errors up to 3 times then returns last response', async () => {
    mockFetch
      .mockResolvedValueOnce(serverErrorResponse(500))
      .mockResolvedValueOnce(serverErrorResponse(500))
      .mockResolvedValueOnce(serverErrorResponse(500))
      .mockResolvedValueOnce(serverErrorResponse(500))

    const res = await fetchWithRetry('https://api.example.com/logs', undefined, {
      baseDelayMs: 1,
    })

    expect(res.status).toBe(500)
    // 1 initial + 3 retries = 4 total
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  it('retries 503 errors and succeeds on second attempt', async () => {
    mockFetch
      .mockResolvedValueOnce(serverErrorResponse(503))
      .mockResolvedValueOnce(okResponse({ recovered: true }))

    const res = await fetchWithRetry('https://api.example.com/logs', undefined, {
      baseDelayMs: 1,
    })

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  // -------------------------------------------------------------------------
  // Network errors — retry
  // -------------------------------------------------------------------------

  it('retries network errors (TypeError) and succeeds', async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(okResponse({ recovered: true }))

    const res = await fetchWithRetry('https://api.example.com/logs', undefined, {
      baseDelayMs: 1,
    })

    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting retries on network errors', async () => {
    const networkError = new TypeError('Failed to fetch')
    mockFetch
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)

    await expect(
      fetchWithRetry('https://api.example.com/logs', undefined, { baseDelayMs: 1 }),
    ).rejects.toThrow(TypeError)

    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  it('does not retry non-TypeError exceptions', async () => {
    mockFetch.mockRejectedValueOnce(new Error('AbortError'))

    await expect(
      fetchWithRetry('https://api.example.com/logs', undefined, { baseDelayMs: 1 }),
    ).rejects.toThrow('AbortError')

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------------
  // onRetry callback
  // -------------------------------------------------------------------------

  it('calls onRetry callback for each retry attempt on 5xx', async () => {
    const onRetry = vi.fn()
    mockFetch
      .mockResolvedValueOnce(serverErrorResponse(500))
      .mockResolvedValueOnce(serverErrorResponse(500))
      .mockResolvedValueOnce(okResponse())

    await fetchWithRetry('https://api.example.com/logs', undefined, {
      baseDelayMs: 1,
      onRetry,
    })

    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(onRetry.mock.calls[0][0]).toBe(1) // first retry attempt
    expect(onRetry.mock.calls[1][0]).toBe(2) // second retry attempt
  })

  it('calls onRetry callback for network error retries', async () => {
    const onRetry = vi.fn()
    mockFetch
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(okResponse())

    await fetchWithRetry('https://api.example.com/logs', undefined, {
      baseDelayMs: 1,
      onRetry,
    })

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry.mock.calls[0][0]).toBe(1)
  })

  // -------------------------------------------------------------------------
  // Custom maxRetries
  // -------------------------------------------------------------------------

  it('respects custom maxRetries option', async () => {
    mockFetch
      .mockResolvedValueOnce(serverErrorResponse(500))
      .mockResolvedValueOnce(serverErrorResponse(500))

    const res = await fetchWithRetry('https://api.example.com/logs', undefined, {
      maxRetries: 1,
      baseDelayMs: 1,
    })

    expect(res.status).toBe(500)
    // 1 initial + 1 retry = 2 total
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('passes through request init options', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())

    await fetchWithRetry('https://api.example.com/logs', {
      method: 'POST',
      headers: { Authorization: 'Bearer token123' },
      body: JSON.stringify({ content: 'test' }),
    })

    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/logs', {
      method: 'POST',
      headers: { Authorization: 'Bearer token123' },
      body: JSON.stringify({ content: 'test' }),
    })
  })
})
