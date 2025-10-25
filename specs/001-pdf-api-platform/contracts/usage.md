# API Contract: Usage Tracking

**Endpoint**: `GET /api/usage`
**Authentication**: Supabase JWT (user must be logged in)
**Purpose**: Retrieve usage statistics and quota information

## Request
```
GET /api/usage?period=30d
Authorization: Bearer <supabase_jwt>
```

### Query Parameters
- `period` (optional): Time period for usage data
  - `7d`: Last 7 days
  - `30d`: Last 30 days (default)
  - `90d`: Last 90 days
  - `all`: All time

## Success Response (200 OK)

```json
{
  "success": true,
  "usage": {
    "quota": {
      "plan": "starter",
      "limit": 5000,
      "used": 2347,
      "remaining": 2653,
      "percentage": 47,
      "resetDate": "2025-11-01T00:00:00.000Z"
    },
    "byApiKey": [
      {
        "id": "7f3a9b2c-4d1e-4a5b-8c6d-9e2f1a3b4c5d",
        "name": "Production",
        "count": 1850,
        "avgGenerationTime": 1423
      },
      {
        "id": "8e4b0c3d-5e2f-5b6c-9d7e-0f3a2b4c6d7e",
        "name": "Staging",
        "count": 497,
        "avgGenerationTime": 1689
      }
    ],
    "history": [
      { "date": "2025-10-01", "count": 145 },
      { "date": "2025-10-02", "count": 203 },
      { "date": "2025-10-03", "count": 178 },
      // ... (one entry per day for requested period)
    ],
    "performance": {
      "avgGenerationTime": 1472,
      "p95GenerationTime": 1987,
      "p99GenerationTime": 2345
    }
  }
}
```

## Response Fields

### quota
- `plan`: Current subscription tier (free, starter, pro, enterprise)
- `limit`: Maximum PDFs allowed per billing period
- `used`: PDFs generated so far this period
- `remaining`: PDFs remaining in quota
- `percentage`: Percentage of quota used (0-100)
- `resetDate`: ISO 8601 timestamp when quota resets

### byApiKey
Array of usage breakdown by API key:
- `id`: API key UUID
- `name`: User-provided key name
- `count`: Number of PDFs generated with this key
- `avgGenerationTime`: Average generation time in milliseconds

### history
Array of daily usage counts:
- `date`: Date in YYYY-MM-DD format
- `count`: Number of PDFs generated that day

### performance
Overall performance metrics:
- `avgGenerationTime`: Average generation time (ms)
- `p95GenerationTime`: 95th percentile generation time (ms)
- `p99GenerationTime`: 99th percentile generation time (ms)

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in to view usage statistics"
  }
}
```

### 400 Bad Request - Invalid Period
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PERIOD",
    "message": "Period must be one of: 7d, 30d, 90d, all"
  }
}
```

## Implementation Notes

### Database Queries

**Get quota information:**
```sql
SELECT
  s.plan_tier,
  uq.plan_quota AS limit,
  uq.current_usage AS used,
  (uq.plan_quota - uq.current_usage) AS remaining,
  (uq.current_usage::FLOAT / uq.plan_quota::FLOAT * 100)::INTEGER AS percentage,
  uq.period_end AS reset_date
FROM usage_quotas uq
JOIN subscriptions s ON uq.user_id = s.user_id
WHERE uq.user_id = $1;
```

**Get usage by API key:**
```sql
SELECT
  ak.id,
  ak.name,
  COUNT(ur.id) AS count,
  AVG(ur.generation_time_ms)::INTEGER AS avg_generation_time
FROM api_keys ak
LEFT JOIN usage_records ur ON ak.id = ur.api_key_id
  AND ur.created_at >= NOW() - INTERVAL '30 days'
WHERE ak.user_id = $1
  AND ak.revoked = FALSE
GROUP BY ak.id, ak.name
ORDER BY count DESC;
```

**Get daily usage history:**
```sql
SELECT
  DATE(ur.created_at) AS date,
  COUNT(*) AS count
FROM usage_records ur
WHERE ur.user_id = $1
  AND ur.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(ur.created_at)
ORDER BY date ASC;
```

**Get performance metrics:**
```sql
SELECT
  AVG(generation_time_ms)::INTEGER AS avg_generation_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY generation_time_ms)::INTEGER AS p95_generation_time,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY generation_time_ms)::INTEGER AS p99_generation_time
FROM usage_records
WHERE user_id = $1
  AND created_at >= NOW() - INTERVAL '30 days';
```

### Caching Strategy
- Cache usage stats in Cloudflare KV with 60-second TTL
- Invalidate cache on new PDF generation
- Reduces database load for dashboard views

### UI Display
- Show quota percentage with progress bar
- Display upgrade CTA when >80% used
- Show "Quota Exceeded" banner when >=100%
- Chart daily usage with Recharts (area chart)
- Table of API keys sorted by usage count
