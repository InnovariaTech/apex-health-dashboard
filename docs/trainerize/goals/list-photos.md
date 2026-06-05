# List Progress Photos

**Endpoint:** `GET /api/trainerize/me/photos`

Returns progress photos for the linked client within a date range. Client `userID` is injected server-side.

---

## Auth

Required — `apex_access_token` cookie, `credentials: 'include'`. Linked Trainerize account required.

---

## Query parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `startDate` | `string` | Yes | Range start (non-empty) |
| `endDate` | `string` | Yes | Range end (non-empty) |

```
GET /api/trainerize/me/photos?startDate=2026-01-01&endDate=2026-06-30
```

---

## Success response

**HTTP `200`**

```json
{
  "success": true,
  "data": {
    "total": 3,
    "photos": [
      { "id": 101, "date": "2026-03-15", "pose": "front" },
      { "id": 102, "date": "2026-04-01", "pose": "side" }
    ]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `total` | `number` | Total matching photos (when returned) |
| `photos` | `array` | Photo entries |
| `photos[].id` | `number` | Photo ID |
| `photos[].date` | `string` | Photo date |
| `photos[].pose` | `string` | `back` \| `front` \| `side` |

---

## TypeScript example

```typescript
const params = new URLSearchParams({ startDate: '2026-01-01', endDate: '2026-06-30' })
const res = await fetch(`/api/trainerize/me/photos?${params}`, { credentials: 'include' })
const json = await res.json()
const photos = json.data?.photos ?? []
```

---

## Related

- [Upload photo](./upload-photo.md)
