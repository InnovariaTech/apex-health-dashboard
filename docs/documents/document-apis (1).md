# Patient Document APIs — Frontend Reference

> **Audience:** Frontend developers handling patient document upload and management.
> **Base path:** All routes are prefixed with `/api` (e.g. `POST /api/patient/documents`).
> **Auth:** Every endpoint requires a valid session cookie (`apex_access_token`). Missing or invalid token returns `401`.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/patient/documents` | Upload a new document |
| `GET` | `/patient/documents` | List all documents for the current user |
| `GET` | `/patient/documents/:id/download` | Download a document file |
| `DELETE` | `/patient/documents/:id` | Delete a document |

---

## `POST /patient/documents`

Uploads a document file for the authenticated user. Sent as `multipart/form-data` — the file and `category` field must be included together.

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | The document file to upload |
| `category` | `string` | Yes | Document category — must be one of the allowed values below |

**Allowed `category` values:**

| Value | Description |
|-------|-------------|
| `lab_report` | Lab result or blood work |
| `prescription` | Prescription or medication |
| `imaging` | X-ray, MRI, scan, etc. |
| `insurance` | Insurance card or document |
| `other` | Any other document type |

**Example request (JS `FormData`):**
```javascript
const formData = new FormData()
formData.append('file', file)           // File object from input
formData.append('category', 'lab_report')

await fetch('/api/patient/documents', {
  method: 'POST',
  credentials: 'include',
  body: formData,
})
```

**Response status:** `201 Created`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "afc2782d-a184-484c-a25c-b190833ba6c1",
    "originalName": "Blake Johnson Complete Lab Reports.pdf",
    "mimeType": "application/pdf",
    "size": 53187,
    "category": "lab_report",
    "createdAt": "2026-06-01T10:53:57.941Z",
    "updatedAt": "2026-06-01T10:53:57.941Z"
  }
}
```

**Response `data` fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Document ID — use for download and delete |
| `originalName` | `string` | Original filename as uploaded |
| `mimeType` | `string` | MIME type of the file (e.g. `application/pdf`, `image/png`) |
| `size` | `number` | File size in bytes |
| `category` | `string` | Category assigned at upload |
| `createdAt` | `string` (ISO 8601) | Upload timestamp |
| `updatedAt` | `string` (ISO 8601) | Last updated timestamp |

**Error responses:**

| Status | Cause |
|--------|-------|
| `400` | No file in request, invalid category, or file rejected (wrong type / too large) |
| `401` | Not authenticated |

---

## `GET /patient/documents`

Returns all documents uploaded by the authenticated user, ordered by upload date.

**Auth:** Required

**Query params:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "afc2782d-a184-484c-a25c-b190833ba6c1",
      "originalName": "Blake Johnson Complete Lab Reports.pdf",
      "mimeType": "application/pdf",
      "size": 53187,
      "category": "lab_report",
      "createdAt": "2026-06-01T10:53:57.941Z",
      "updatedAt": "2026-06-01T10:53:57.941Z"
    }
  ]
}
```

`data` is an array of document objects with the same shape as the upload response. Returns an empty array `[]` if the user has no documents.

**Error responses:**

| Status | Cause |
|--------|-------|
| `401` | Not authenticated |

---

## `GET /patient/documents/:id/download`

Downloads a document file. The response is the raw file binary — **not** a JSON envelope.

**Auth:** Required

**URL params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Document ID from the upload or list response |

**Response:** Raw file binary with headers:
```
Content-Type: <mimeType of the file>
Content-Disposition: attachment; filename="<originalName>"
```

**Example (trigger browser download):**
```javascript
const response = await fetch(`/api/patient/documents/${id}/download`, {
  credentials: 'include',
})
const blob = await response.blob()
const url = URL.createObjectURL(blob)

const a = document.createElement('a')
a.href = url
a.download = filename
a.click()
URL.revokeObjectURL(url)
```

**Error responses:**

| Status | Cause |
|--------|-------|
| `401` | Not authenticated |
| `403` | Document belongs to a different user |
| `404` | Document ID not found |

---

## `DELETE /patient/documents/:id`

Permanently deletes a document. The file and its database record are both removed.

**Auth:** Required

**URL params:**

| Param | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Document ID to delete |

**Response:**
```json
{
  "success": true
}
```

**Error responses:**

| Status | Cause |
|--------|-------|
| `401` | Not authenticated |
| `403` | Document belongs to a different user |
| `404` | Document ID not found |
