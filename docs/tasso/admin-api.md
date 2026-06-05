# Admin API Documentation

All routes are under `/api/admin/*`. Every route requires a valid `apex_access_token` cookie with `role = admin` (issued after completing the staff login OTP flow — see `auth-api.md`).

Base prefix: `/api`

---

## Authentication

All admin routes use the `requireRole('admin')` preHandler. Requests without a valid admin access-token cookie receive:

```json
{ "success": false, "message": "Unauthorized" }   // 401
```

Requests with a valid token but a non-admin role receive:

```json
{ "success": false, "message": "Forbidden" }   // 403
```

---

## Common Response Format

Success:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "message": "...", "code": "..." }
```

---

## Provider Shape

All provider endpoints return a `ProviderView` object:

```json
{
  "id": "uuid",
  "email": "provider@example.com",
  "role": "provider",
  "isActive": true,
  "createdAt": "2026-04-08T00:00:00.000Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | internal user ID |
| `email` | string | normalized to lowercase |
| `role` | string | always `"provider"` for created providers |
| `isActive` | boolean | whether the provider can log in |
| `createdAt` | ISO 8601 datetime | account creation timestamp |

---

## 1. POST `/api/admin/providers`

Creates a new provider account. The password is bcrypt-hashed (12 rounds) before storage.

### Request body

```json
{
  "email": "provider@example.com",
  "password": "StrongPass123"
}
```

| Field | Required | Rules |
|---|---|---|
| `email` | yes | valid email; normalized to lowercase on save |
| `password` | yes | min 8 chars |


### Success — `201`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "provider@example.com",
    "role": "provider",
    "isActive": true,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

### Errors

| Status | Code | Cause |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Invalid payload (Zod) |
| `409` | `AUTH_ERROR` | A user with this email already exists |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## 2. GET `/api/admin/providers`

Returns a list of all provider accounts.

No query params.

### Success — `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "provider@example.com",
      "role": "provider",
      "isActive": true,
      "createdAt": "2026-04-08T00:00:00.000Z"
    }
  ]
}
```

Returns an empty array when no providers exist.

---

## 3. PATCH `/api/admin/providers/:userId`

Activates or deactivates a provider account. This is the sole update operation — only `isActive` can be changed through this endpoint.

A deactivated provider (`isActive: false`) will fail login at step 1 of the staff auth flow.

### Path params

| Param | Type | Notes |
|---|---|---|
| `userId` | UUID | required; the provider's internal user ID |

### Request body

```json
{ "isActive": false }
```

| Field | Required | Notes |
|---|---|---|
| `isActive` | yes | boolean; `true` to activate, `false` to deactivate |

### Success — `200`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "provider@example.com",
    "role": "provider",
    "isActive": false,
    "createdAt": "2026-04-08T00:00:00.000Z"
  }
}
```

### Errors

| Status | Code | Cause |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Invalid payload (Zod) or non-UUID `userId` |
| `404` | `NOT_FOUND` | No provider found with this `userId` |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error |
