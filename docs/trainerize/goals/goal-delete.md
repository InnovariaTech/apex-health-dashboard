# Delete Goal

**Endpoint:** `DELETE /api/trainerize/me/goals`

Deletes a goal by ID. Requires JSON body (Fastify DELETE with body).

---

## Request body (JSON)

| Field | Type | Required |
|---|---|---|
| `goalId` | `number` | Yes — positive integer |

```json
{
  "goalId": 123
}
```

---

## Success response

**HTTP `200`**

```json
{
  "success": true,
  "data": {
    "code": 0,
    "message": "..."
  }
}
```

---

## TypeScript example

```typescript
const res = await fetch('/api/trainerize/me/goals', {
  method: 'DELETE',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ goalId: 123 }),
})
```

---

## Related

- [List goals](./list-goals.md)
