# Goal Detail

**Endpoint:** `GET /api/trainerize/me/goals/detail`

Returns a single goal by ID. Link check only — no `userId` injection on this Partner call.

---

## Query parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `goalId` | `integer` | Yes | Goal ID (positive, coerced from query string) |
| `unitWeight` | `string` | No | Weight unit |
| `achieved` | `boolean` | No | Query as `true` or `false` string |

```
GET /api/trainerize/me/goals/detail?goalId=123
```

---

## Success response

**HTTP `200`**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "type": "textGoal",
    "achieved": false,
    "text": "Run a 5K"
  }
}
```

Shape matches a single item from [list-goals](./list-goals.md) — fields depend on `type`.

---

## Related

- [Update goal](./goal-set.md)
- [Update progress](./goal-progress.md)
- [Delete goal](./goal-delete.md)
