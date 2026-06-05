# Upload Progress Photo

**Endpoint:** `POST /api/trainerize/me/photos`

Uploads a progress photo via **multipart/form-data**. This is the only Trainerize route in our API that uses multipart (not JSON).

---

## Auth

Required — `apex_access_token` cookie. Linked Trainerize account required.

---

## Request body (multipart)

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | Image file (max 10 MB, one file per request) |
| `date` | string | Yes | Photo date (non-empty) |
| `pose` | string | Yes | `back` \| `front` \| `side` |

Do **not** send JSON. Do **not** send `userId` — injected server-side.

---

## Success response

**HTTP `201`**

```json
{
  "success": true,
  "data": {
    "ids": [12345]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `ids` | `number[]` | New photo ID(s) from Trainerize |

---

## Errors

| HTTP | Cause |
|---|---|
| `400` | No file uploaded, invalid `date`/`pose`, or multipart parse error |
| `401` | Not authenticated |
| `404` | Not linked to Trainerize |

---

## TypeScript example (FormData)

```typescript
const form = new FormData()
form.append('file', fileInput.files[0])
form.append('date', '2026-06-01')
form.append('pose', 'front')

const res = await fetch('/api/trainerize/me/photos', {
  method: 'POST',
  credentials: 'include',
  body: form,
})
const json = await res.json()
```

---

## Related

- [List photos](./list-photos.md)
