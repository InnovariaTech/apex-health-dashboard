# API Documentation: Categorized Biomarker Summary

This endpoint provides a consolidated, historical view of a patient’s lab results, grouped by biological system. It is specifically designed to power dashboard charts and trend visualizations.

## 1. Endpoint Overview

| Property | Value |
| :--- | :--- |
| **Method** | `GET` |
| **URL** | `/api/patient/biomarkers/summary` |
| **Auth** | Required (via `apex_access_token` cookie) |
| **Content-Type** | `application/json` |

## 2. Request Parameters
Currently, this endpoint does not require any query parameters. It automatically resolves the patient identity from the authenticated session.

## 3. Example Response Structure

```json
{
  "success": true,
  "data": {
    "Blood count (CBC)": [
      {
        "biomarkerName": "Hemoglobin",
        "canonicalName": "hemoglobin",
        "loinc": "718-7",
        "unit": "g/dL",
        "trend": [
          {
            "value": 14.2,
            "date": "2024-01-15T09:00:00.000Z",
            "status": "NORMAL",
            "unit": "g/dL"
          },
          {
            "value": 13.8,
            "date": "2024-04-10T08:30:00.000Z",
            "status": "NORMAL",
            "unit": "g/dL"
          }
        ]
      }
    ],
    "Metabolic": [
      {
        "biomarkerName": "Glucose",
        "canonicalName": "glucose",
        "loinc": "2345-7",
        "unit": "mg/dL",
        "trend": [
          {
            "value": 98,
            "date": "2024-04-10T08:30:00.000Z",
            "status": "HIGH",
            "unit": "mg/dL"
          }
        ]
      }
    ]
  }
}
```

## 4. Response Field Definitions

### `data` Object
The root data object is a **Map (Dictionary)**. 
- **Keys**: These are the `displayCategory` names (e.g., "Thyroid", "Liver Function").
- **Values**: An array of Biomarker objects belonging to that category.

### Biomarker Object
- `biomarkerName`: The display-friendly name from our registry (falls back to raw name from lab).
- `canonicalName`: A unique slug for the biomarker (useful for frontend routing/linking).
- `loinc`: The international standard code for the test. **Use this as the unique key in your loops.**
- `unit`: The most recent unit of measurement for this biomarker.
- `trend`: An array of results for this specific test, **sorted chronologically (oldest to newest)**.

### Trend Entry
- `value`: The numeric or text result.
- `date`: ISO string of when the lab was collected.
- `status`: Health status flag (`NORMAL`, `HIGH`, `LOW`, `CRITICAL`). Use this for color-coding (e.g., red for HIGH/LOW).

---

## 5. The "Why" (Developer Rationale)

We designed the response this way to solve three frontend challenges:

1.  **Zero-Configuration Charting**: The `trend` array is pre-sorted. You can pass the `trend` array directly into a chart library (like Recharts or Chart.js) without needing to perform any client-side sorting or filtering.
2.  **Biological Grouping**: By returning data keyed by `displayCategory`, the UI can automatically generate collapsible sections or tabs for "Kidney Health," "Heart Health," etc., without the frontend needing to know which test belongs where.
3.  **LOINC Consistency**: Lab names vary (e.g., one lab says "HbA1c", another says "Hemoglobin A1c"). The backend uses LOINC codes to merge these into a single trend line, ensuring the user sees a continuous graph even if they changed lab providers.

---

### Integration Tips for Frontend:
- **Empty States**: If a patient has no documents, `data` will be an empty object `{}`.
- **Dynamic Categories**: Do not hardcode the category names. Iterate over the keys of the `data` object to build your UI dynamically.
- **Status Colors**: 
  - `NORMAL` -> Success/Green
  - `HIGH`/`LOW` -> Warning/Orange
  - `CRITICAL` -> Danger/Red
