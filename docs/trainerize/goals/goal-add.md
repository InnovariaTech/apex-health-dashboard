# Add Goal

**Endpoint:** `POST /api/trainerize/me/goals`

Creates a goal for the linked client. Request body is a **discriminated union** on `type`. Client `userID` injected server-side.

**HTTP `201`** on success.

---

## Request body (JSON)

Common rule: **`type` is required** and determines which other fields apply.

### Text goal — `type: "textGoal"`

```json
{
  "type": "textGoal",
  "text": "Run a 5K"
}
```

| Field | Type | Required |
|---|---|---|
| `type` | `"textGoal"` | Yes |
| `text` | `string` | No |

### Weight goal — `type: "weightGoal"`

```json
{
  "type": "weightGoal",
  "unitWeight": "lbs",
  "weightGoal": 180,
  "weeklyWeightGoal": 1,
  "clientActiveLevel": "moderatelyActive",
  "startDate": "2026-01-01",
  "startWeight": 200,
  "currentWeight": 195
}
```

| Field | Type | Notes |
|---|---|---|
| `clientActiveLevel` | `string` | `sedentary` \| `lightlyActive` \| `moderatelyActive` \| `veryActive` \| `extraActive` |

### Nutrition goal — `type: "nutritionGoal"`

```json
{
  "type": "nutritionGoal",
  "trackingType": "trackWithMFP",
  "caloricGoal": 2000,
  "carbsGrams": 200,
  "carbsPercent": 40,
  "proteinGrams": 150,
  "proteinPercent": 30,
  "fatGrams": 65,
  "fatPercent": 30
}
```

| Field | Type | Notes |
|---|---|---|
| `trackingType` | `string` | `noTracking` \| `trackWithMFP` \| `trackWithFitbit` |

---

## Success response

```json
{
  "success": true,
  "data": {
    "id": 456
  }
}
```

---

## Related

- [Set goal](./goal-set.md) — same body shape as add
- [List goals](./list-goals.md)
