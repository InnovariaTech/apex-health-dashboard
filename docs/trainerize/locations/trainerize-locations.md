# Trainerize Locations API — Frontend Guide

Base URL prefix: `/api`

All endpoints require an authenticated session (access cookie issued at login). Send requests with credentials included (`credentials: 'include'` in `fetch`).

---

## List studio locations

Returns active Trainerize studio locations for the organization. Use `locations[].id` as `locationId` when booking appointments.

### Request

```
GET /api/trainerize/me/locations
```

**Headers**

| Header | Required | Notes |
|--------|----------|-------|
| Cookie | Yes | Session access token (set automatically after login) |

**Query parameters**

None.

**Request body**

None (GET request).

### Success response — `200 OK`

```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": 42,
        "name": "Downtown Studio",
        "type": "physical",
        "address1": "123 Main St",
        "address2": "Suite 200",
        "city": "Austin",
        "state": "TX",
        "country": "US",
        "zipCode": "78701",
        "phoneNumber": "+15125550100",
        "lat": 30.2672,
        "lng": -97.7431,
        "isActive": true,
        "hours": [
          {
            "weekDay": "monday",
            "isClose": false,
            "openAt": 600,
            "closeAt": 1080
          },
          {
            "weekDay": "sunday",
            "isClose": true,
            "openAt": 0,
            "closeAt": 0
          }
        ]
      },
      {
        "id": 43,
        "name": "Virtual Coaching",
        "type": "online",
        "isActive": true,
        "hours": []
      }
    ]
  }
}
```

### Response fields — `data`

| Field | Type | Description |
|-------|------|-------------|
| `locations` | `Location[]` | Active locations only (`isActive === false` entries are filtered out server-side) |

### Response fields — `Location`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | **Use this as `locationId` for appointment booking** |
| `name` | `string` | Display name |
| `type` | `"physical"` \| `"online"` \| `string` | Location type |
| `address1` | `string` | Street address line 1 |
| `address2` | `string` | Street address line 2 |
| `city` | `string` | City |
| `state` | `string` | State / province |
| `country` | `string` | Country |
| `zipCode` | `string` | Postal code |
| `phoneNumber` | `string` | Contact phone |
| `lat` | `number` | Latitude |
| `lng` | `number` | Longitude |
| `isActive` | `boolean` | Always `true` in this response (inactive locations excluded) |
| `hours` | `LocationHours[]` | Weekly opening hours |

### Response fields — `LocationHours`

| Field | Type | Description |
|-------|------|-------------|
| `weekDay` | `string` | One of: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday` |
| `isClose` | `boolean` | `true` if closed that day |
| `openAt` | `number` | Open time as minutes from midnight (e.g. `600` = 10:00) |
| `closeAt` | `number` | Close time as minutes from midnight (e.g. `1080` = 18:00) |

### Error responses

**401 Unauthorized** — not logged in

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**404 Not Found** — user has no Trainerize account link

```json
{
  "success": false,
  "message": "Trainerize link not found for <userId>"
}
```

**400 Bad Request** — org Trainerize group not configured

```json
{
  "success": false,
  "message": "Trainerize org group is not configured"
}
```

**502 Bad Gateway** — upstream Trainerize API failure

```json
{
  "success": false,
  "message": "<error detail>",
  "code": "<optional code>",
  "provider": "trainerize",
  "providerStatus": "<optional HTTP status from Trainerize>"
}
```

### Empty result

If the studio has no active locations, the response is still `200`:

```json
{
  "success": true,
  "data": {
    "locations": []
  }
}
```

---

## Appointment booking flow (uses `locationId`)

Recommended sequence for self-booking:

```
1. GET  /api/trainerize/me/locations
2. GET  /api/trainerize/me/appointment-types
3. GET  /api/trainerize/me/appointments/timeslots?locationId=...&appointmentTypeId=...&startTime=...&endTime=...
4. POST /api/trainerize/me/appointments/self-book
```

### Step 3 — Available timeslots

```
GET /api/trainerize/me/appointments/timeslots
```

**Query parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `locationId` | `number` | Yes | From `locations[].id` |
| `appointmentTypeId` | `number` | Yes | From appointment types list |
| `startTime` | `string` | Yes | ISO datetime or Trainerize-accepted time string |
| `endTime` | `string` | Yes | ISO datetime or Trainerize-accepted time string |

**Request body:** None.

**Success response — `200 OK`**

```json
{
  "success": true,
  "data": {
    "dailyTimeslots": {
      "2026-06-10": {
        "availableCount": 3,
        "timeslots": [
          {
            "timeslot": "2026-06-10T14:00:00Z",
            "availabilityStatus": "available"
          }
        ]
      }
    }
  }
}
```

### Step 4 — Self-book appointment

```
POST /api/trainerize/me/appointments/self-book
```

**Request body**

```json
{
  "locationId": 42,
  "appointmentTypeId": 7,
  "appointmentTime": "2026-06-10T14:00:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `locationId` | `number` | Yes | From `locations[].id` |
| `appointmentTypeId` | `number` | Yes | Selected appointment type |
| `appointmentTime` | `string` | Yes | Slot from timeslots response |

**Success response — `200 OK`**

```json
{
  "success": true,
  "data": {
    "code": 0,
    "message": "OK"
  }
}
```

---

## Example — fetch locations (TypeScript)

```typescript
type LocationHours = {
  weekDay?: string
  isClose?: boolean
  openAt?: number
  closeAt?: number
}

type Location = {
  id?: number
  name?: string
  type?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  phoneNumber?: string
  lat?: number
  lng?: number
  isActive?: boolean
  hours?: LocationHours[]
}

type LocationsResponse = {
  success: true
  data: {
    locations: Location[]
  }
}

async function fetchLocations(): Promise<Location[]> {
  const res = await fetch('/api/trainerize/me/locations', {
    credentials: 'include',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Request failed (${res.status})`)
  }

  const json = (await res.json()) as LocationsResponse
  return json.data.locations
}
```

---

## Prerequisites

Before calling this endpoint, the patient must:

1. Be logged in to the patient portal.
2. Have a linked Trainerize account (via login auto-link, `POST /api/trainerize/me/add-user`, or `POST /api/trainerize/me/attach`).

The studio `groupID` sent to Trainerize is resolved server-side in this order:

1. `org_external_token.metadata.groupId`
2. `auth_external_token.metadata.groupId` (for the logged-in user)
3. `TRAINERIZE_GROUP_ID` environment variable

If not linked, use `GET /api/trainerize/me/link` to check linkage status first.
