# Biomarker Education — Frontend Integration Guide

> **Audience:** Frontend developers building the Biomarkers page and biomarker detail drawer.
> **Base path:** `/api` prefix (e.g. `GET {{baseUrl}}/api/patient/biomarkers/education`).
> **Auth:** Session cookie on every request (`credentials: 'include'`). Missing/invalid session → `401`.
> **Envelope:** `{ success: true, message: null, data: ... }` on success; `{ success: false, message: "..." }` on error.

Education content is **not** embedded in the biomarker summary response. Load it **lazily** when the user opens a biomarker drawer to keep the summary endpoint fast.

---

## Related endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/patient/biomarkers/summary` | Category-grouped biomarker series (names, LOINC, trend, reference range) |
| `GET` | `/api/patient/biomarkers/education` | Education snippet for **one** biomarker (this doc) |

---

## Recommended UI flow

```text
1. Page load     → GET /patient/biomarkers/summary
2. User taps row → GET /patient/biomarkers/education?loinc={series.loinc}
3. Cache by loinc in session/memory to avoid repeat calls on re-open
```

Prefer **`loinc`** from the summary series when present. Fall back to **`canonicalName`** only when `loinc` is empty.

```ts
const lookupParam = series.loinc
  ? { loinc: series.loinc }
  : series.canonicalName
    ? { canonicalName: series.canonicalName }
    : null

if (!lookupParam) {
  // No registry link — hide education section
}
```

---

## `GET /patient/biomarkers/education`

Returns patient-facing copy: what the biomarker measures and lifestyle factors that may move it.

### Query parameters

Provide **exactly one** identifier.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `loinc` | `string` | One of `loinc` / `canonicalName` | LOINC code from summary (`CategorizedBiomarker.loinc`). **Preferred.** |
| `canonicalName` | `string` | One of `loinc` / `canonicalName` | Registry slug (e.g. `cholesterol_in_hdl_hdlc_serpl_mcnc`). Fallback when LOINC is missing. |
| `includeUnreviewed` | `boolean` | No | **Staging/dev only.** Ignored in production unless server has `BIOMARKER_EDUCATION_INCLUDE_UNREVIEWED=true`. |

### Example request

```
GET {{baseUrl}}/api/patient/biomarkers/education?loinc=2085-9
```

### Success response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "canonicalName": "cholesterol_in_hdl_hdlc_serpl_mcnc",
    "displayName": "HDL-C",
    "loinc": "2085-9",
    "measurementSummary": "HDL cholesterol is often called \"good\" cholesterol. This test measures the amount of HDL in your blood.",
    "modifiableFactors": [
      { "label": "Regular aerobic exercise", "direction": "increase" },
      { "label": "Smoking", "direction": "decrease" },
      { "label": "Trans fats in diet", "direction": "decrease" }
    ],
    "reviewed": false,
    "source": "ai"
  }
}
```

### Response fields (`BiomarkerEducationView`)

| Field | Type | Description |
|-------|------|-------------|
| `canonicalName` | `string` | Stable registry key |
| `displayName` | `string \| null` | Human-readable name from registry |
| `loinc` | `string \| null` | LOINC code when linked in registry |
| `measurementSummary` | `string \| null` | Plain-language “What this measures” copy |
| `modifiableFactors` | `ModifiableFactor[] \| null` | Lifestyle factors; may be empty array |
| `reviewed` | `boolean` | `true` when content passed QA (`reviewed_at` set in DB) |
| `source` | `"ai" \| "manual" \| "import" \| string` | Provenance |

```ts
interface ModifiableFactor {
  label: string
  direction: "increase" | "decrease"
}
```

**`direction` semantics (for UI arrows/icons):**

- `"increase"` — this factor tends to **raise** the biomarker value
- `"decrease"` — this factor tends to **lower** the biomarker value

Example: for LDL, “Regular exercise” should be `"decrease"`. Content is AI-generated; treat copy as informational, not clinical advice.

---

## Error responses

| Status | When | Example body |
|--------|------|----------------|
| `400` | Missing both params, or both provided, or invalid query | `{ "success": false, "message": "Invalid request", "issues": [...] }` (Zod) or validation message |
| `401` | Not authenticated | `{ "success": false, message: "Unauthorized" }` |
| `404` | Unknown LOINC, no education row, or unreviewed content in production | `{ "success": false, "message": "Biomarker education not found: 2085-9" }` |

**FE handling:**

- **`404`** → Hide “What this measures” / “What moves it” sections (or show a neutral “Education not available”).
- **`400`** → Should not happen if you pass one identifier from summary data; log in dev.

---

## Staging vs production

| Environment | Server config | Behavior |
|-------------|---------------|----------|
| **Production** | `BIOMARKER_EDUCATION_INCLUDE_UNREVIEWED` unset / `false` | Only **reviewed** rows returned; unreviewed → `404` |
| **Staging / local** | `BIOMARKER_EDUCATION_INCLUDE_UNREVIEWED=true` | Draft AI content returned with `reviewed: false` |

Optional UI: show a small “Draft content” badge when `reviewed === false` (staging only).

---

## Caching suggestions

Education is reference content (not patient-specific). Safe to cache per session:

```ts
const educationCache = new Map<string, BiomarkerEducationView>()

async function loadEducation(loinc: string): Promise<BiomarkerEducationView | null> {
  const cached = educationCache.get(loinc)
  if (cached) return cached

  const res = await fetch(`/api/patient/biomarkers/education?loinc=${encodeURIComponent(loinc)}`, {
    credentials: 'include',
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Education fetch failed: ${res.status}`)

  const body = await res.json()
  educationCache.set(loinc, body.data)
  return body.data
}
```

Do **not** cache `404` indefinitely if you expect content to be reviewed and published later (short TTL or no cache on 404).

---

## Summary series shape (for lookup keys)

From `GET /patient/biomarkers/summary`:

```ts
interface CategorizedBiomarker {
  biomarkerName: string
  canonicalName: string
  loinc: string
  unit: string | null
  latestReferenceRange: string | null
  trend: BiomarkerTrendEntry[]
}

// data is Record<categoryName, CategorizedBiomarker[]>
type CategorizedBiomarkerSummary = Record<string, CategorizedBiomarker[]>
```

Education is **not** included on `CategorizedBiomarker`. Always fetch separately on drawer open.

---

## Audit (backend note)

Successful reads emit `patient.biomarker_education_read` with `{ loinc, canonicalName, reviewed }` only — no summary text in audit payload.

---

## Example: drawer integration

```tsx
function BiomarkerDrawer({ series }: { series: CategorizedBiomarker }) {
  const [education, setEducation] = useState<BiomarkerEducationView | null | undefined>(undefined)

  useEffect(() => {
    if (!series.loinc && !series.canonicalName) {
      setEducation(null)
      return
    }
    const qs = series.loinc
      ? `loinc=${encodeURIComponent(series.loinc)}`
      : `canonicalName=${encodeURIComponent(series.canonicalName)}`

    fetch(`/api/patient/biomarkers/education?${qs}`, { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 404) return null
        if (!res.ok) throw new Error(String(res.status))
        const json = await res.json()
        return json.data as BiomarkerEducationView
      })
      .then(setEducation)
      .catch(() => setEducation(null))
  }, [series.loinc, series.canonicalName])

  return (
    <Drawer>
      <h2>{series.biomarkerName}</h2>
      {/* trend chart from summary */}
      {education === undefined && <Skeleton />}
      {education?.measurementSummary && (
        <section>
          <h3>What this measures</h3>
          <p>{education.measurementSummary}</p>
        </section>
      )}
      {education?.modifiableFactors && education.modifiableFactors.length > 0 && (
        <section>
          <h3>Factors that may affect this marker</h3>
          <ul>
            {education.modifiableFactors.map((f) => (
              <li key={f.label}>
                {f.direction === 'increase' ? '↑' : '↓'} {f.label}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Drawer>
  )
}
```
