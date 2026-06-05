# Update Goal Progress

**Endpoint:** `PUT /api/trainerize/me/goals/progress`

Updates progress on a goal (typically text goals). Link check only — goal identified by `goalId` in body.

---

## Request body (JSON)

| Field | Type | Required | Description |
|---|---|---|---|
| `goalId` | `number` | Yes | Positive integer |
| `progress` | `number` | No | Progress value (e.g. percentage) |

```json
{
  "goalId": 123,
  "progress": 75
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

## Related

- [Goal detail](./goal-detail.md)
- [List goals](./list-goals.md)
