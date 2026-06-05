# List Goals

**Endpoint:** `GET /api/trainerize/me/goals/list`

Paginated list of the linked client's goals. Client `userID` injected server-side.

---

## Query parameters

All optional.

| Param | Type | Description |
|---|---|---|
| `unitWeight` | `string` | Weight unit filter (e.g. `lbs`, `lb`) |
| `achieved` | `boolean` | Query as `true` or `false` string |
| `start` | `integer` | Pagination offset (≥ 0) |
| `count` | `integer` | Page size (positive) |

```
GET /api/trainerize/me/goals/list?start=0&count=10&achieved=false
```

---

## Success response

**HTTP `200`**

```json
{
  "success": true,
  "data": {
    "total": 2,
    "goals": [
      {
        "id": 1,
        "type": "textGoal",
        "achieved": false,
        "text": "Run a 5K"
      },
      {
        "id": 2,
        "type": "weightGoal",
        "achieved": false,
        "unitWeight": "lbs",
        "weightGoal": 180,
        "weeklyWeightGoal": 1,
        "clientActiveLevel": "moderatelyActive",
        "startDate": "2026-01-01",
        "startWeight": 200,
        "currentWeight": 195
      }
    ]
  }
}
```

Response fields vary by `type`: `textGoal`, `weightGoal`, `nutritionGoal`. See [goal-add.md](./goal-add.md) for field sets per type.

| Field | Type | Description |
|---|---|---|
| `total` | `number` | Total goals matching query |
| `goals` | `array` | Goal list items |
| `goals[].id` | `number` | Goal ID — use as `goalId` in other routes |
| `goals[].type` | `string` | `textGoal` \| `weightGoal` \| `nutritionGoal` |
| `goals[].achieved` | `boolean` | Whether goal is achieved |

---

## Related

- [Goal detail](./goal-detail.md)
- [Add goal](./goal-add.md)
