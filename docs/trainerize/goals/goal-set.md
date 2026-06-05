# Update Goal

**Endpoint:** `PUT /api/trainerize/me/goals`

Updates a goal. Body uses the **same discriminated union** as [goal-add](./goal-add.md) (`type` + type-specific fields). Client `userID` injected server-side.

**Note:** Trainerize `goal/set` docs may not require goal `id` in the wire body — our API follows the add shape. Verify update semantics against live Trainerize before relying on partial updates.

---

## Request body (JSON)

Same schemas as POST — examples:

```json
{
  "type": "textGoal",
  "text": "Run a 10K"
}
```

```json
{
  "type": "weightGoal",
  "unitWeight": "lbs",
  "currentWeight": 190
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

Exact `data` fields are Trainerize wire passthrough.

---

## Related

- [Add goal](./goal-add.md)
- [Goal progress](./goal-progress.md)
