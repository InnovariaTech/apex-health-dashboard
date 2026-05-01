# Patient Health Summary API Documentation

The Patient Health Summary feature provides a longitudinal, AI-generated analysis of a patient's lab results. It includes a narrative summary, trend detection, and a calculated Health Score (0-100).

## Overview

- **Base URL:** `/api/patient`
- **Authentication:** Required (JWT Cookie: `apex_access_token` or Authorization Header).
- **Core Technology:** MCPServer (Document Sync), Anthropic/Claude (Summarization), Prisma (Persistence).

---

## Endpoints

### 1. Generate Overall Summary
Triggers a new AI analysis of all normalized lab results for the authenticated user. This process includes a JIT (Just-In-Time) synchronization with CareValidate to ensure all documents are normalized before summarization.

- **URL:** `/summary`
- **Method:** `POST`
- **Response:** `200 OK`
- **Data Structure:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "patientId": "carevalidate-id",
      "summaryText": "Markdown narrative...",
      "healthScore": 85,
      "metadata": {
        "scoreExplanation": "Explanation of the score...",
        "model": "claude-sonnet-4-5",
        "usage": { "input_tokens": 1200, "output_tokens": 450 }
      },
      "createdAt": "ISO-Timestamp"
    }
  }
  ```

### 2. Get Latest Summary
Retrieves the most recently generated health summary from the database.

- **URL:** `/summary`
- **Method:** `GET`
- **Response:** `200 OK`
- **Notes:** Returns `data: null` if no summary has been generated yet.

### 3. List Summaries (Paginated)
Retrieves a historical list of all generated summaries.

- **URL:** `/summaries`
- **Method:** `GET`
- **Query Parameters:**
  - `take`: (Integer) Number of items to return (Default: 10).
  - `skip`: (Integer) Number of items to skip (Default: 0).
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "items": [ ...PatientSummary[] ],
      "total": 25
    }
  }
  ```

---

## The Health Score Logic

The Health Score is a value from **0 to 100** that represents the patient's overall health status based on their lab markers.

| Score Range | Status | Interpretation |
| :--- | :--- | :--- |
| **90 - 100** | Optimal | All primary markers are within reference ranges. |
| **70 - 89** | Good | Some markers are slightly high/low but primary indicators (A1c, Lipids) are stable. |
| **50 - 69** | Attention | Multiple markers are out of range or significant trends are moving in the wrong direction. |
| **Below 50** | Critical | One or more markers have a CRITICAL status. |

### Scoring Criteria
- **Reference Ranges:** Direct deductions for values outside the normal range.
- **Status Weighting:** `CRITICAL` findings result in larger deductions than `HIGH` or `LOW` findings.
- **Marker Importance:** Primary metabolic markers (e.g., HbA1c, LDL Cholesterol, fasting glucose) have higher impact on the score than minor markers.
- **Longitudinal Trends:** Bonus points are awarded if a marker is moving from an abnormal state back toward a normal state.

---

## Narrative Citations

The AI is instructed to include **narrative citations** in the Markdown summary. 
- **Format:** "According to your report from [Date]..." or "Compared to your previous results in [Date]..."
- **Goal:** Transparency. Patients should know exactly which report an insight is coming from without needing a separate link.

---

## Example Usage (CURL)

### Generate New Summary
```bash
curl -X POST http://localhost:5000/api/patient/summary \
     -H "Cookie: apex_access_token=YOUR_TOKEN"
```

### Get History (First 5)
```bash
curl -X GET "http://localhost:5000/api/patient/summaries?take=5&skip=0" \
     -H "Cookie: apex_access_token=YOUR_TOKEN"
```
