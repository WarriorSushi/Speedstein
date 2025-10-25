# API Contract: API Key Management

**Base Path**: `/api/keys`
**Authentication**: Supabase JWT (user must be logged in)
**Purpose**: Create, list, and revoke API keys

## Create API Key

### Request
```
POST /api/keys
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "name": "Production"  // Descriptive name for the key
}
```

### Success Response (201 Created)
```json
{
  "success": true,
  "key": {
    "id": "7f3a9b2c-4d1e-4a5b-8c6d-9e2f1a3b4c5d",
    "key": "sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "name": "Production",
    "prefix": "sk_live_",
    "last4": "y5z6",
    "created_at": "2025-10-25T10:30:00.000Z"
  },
  "warning": "Save this key now. You won't be able to see it again!"
}
```

### Error Responses
- **400 Bad Request**: Name is required or invalid
- **401 Unauthorized**: Not logged in or invalid JWT
- **429 Too Many Requests**: Maximum 10 API keys per user

## List API Keys

### Request
```
GET /api/keys
Authorization: Bearer <supabase_jwt>
```

### Success Response (200 OK)
```json
{
  "success": true,
  "keys": [
    {
      "id": "7f3a9b2c-4d1e-4a5b-8c6d-9e2f1a3b4c5d",
      "name": "Production",
      "prefix": "sk_live_",
      "last4": "y5z6",
      "revoked": false,
      "created_at": "2025-10-25T10:30:00.000Z",
      "last_used_at": "2025-10-25T14:22:33.000Z"
    },
    {
      "id": "8e4b0c3d-5e2f-5b6c-9d7e-0f3a2b4c6d7e",
      "name": "Staging",
      "prefix": "sk_test_",
      "last4": "xyz9",
      "revoked": false,
      "created_at": "2025-10-20T08:15:00.000Z",
      "last_used_at": null
    }
  ]
}
```

## Revoke API Key

### Request
```
DELETE /api/keys/:id
Authorization: Bearer <supabase_jwt>
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "API key 'Production' has been revoked"
}
```

### Error Responses
- **404 Not Found**: API key does not exist or belongs to another user
- **409 Conflict**: API key is already revoked

## Implementation Notes

### Key Generation
1. Generate random 32-byte key: `sk_{env}_{randomBytes(32).hex}`
2. Extract prefix (first 8 chars): `sk_live_`
3. Extract last4 (last 4 chars)
4. Hash full key: `SHA256(key)`
5. Store in database: `{ key_hash, prefix, last4, name, user_id }`
6. Return full key to user ONCE (never stored in plaintext)

### Key Prefixes
- `sk_live_`: Production keys
- `sk_test_`: Test/development keys

### Security
- Never store plaintext keys in database
- Display only prefix + last4 in UI
- Hash lookup on authentication: `WHERE key_hash = SHA256(provided_key)`
- Soft delete: Set `revoked = true` instead of hard deleting
