# /metrics - Metrics Review and Update

Review business metrics and update as needed.

## Usage

```bash
/metrics              # Display current metrics summary
/metrics update       # Update all metrics files
/metrics update [domain]   # Update specific domain metrics only
```

ARGUMENTS: $ARGUMENTS

---

## Execution Steps

### 1. Load Metrics Files

Read YAML files in the `.context/metrics/` folder:
- `business.yaml` - Core KPIs, funnel, targets
- `[domain].yaml` - Domain-specific metrics
- `segments.yaml` - Segment-level metrics
- `team.yaml` - Team/owner information

### 2. Branch Based on Arguments

#### Case A: `/metrics` (no arguments)

Display current metrics summary:

```markdown
📈 **Business Metrics Overview** (Updated: 2026-01-26)

## Core KPIs
| Metric | Value | vs Target |
|--------|-------|-----------|
| Paid Users | 81 | 54% (target 150) |
| MRR | ₩5,163,480 | - |
| ARPU | ₩63,747 | - |
| Monthly Churn | 12% | ⚠️ Exceeds 10% target |

## Funnel (2025 Cumulative)
Signup 3,645 → Linked 476 (13%) → Paid 132 (3.6%)

## Domain Metrics
- Core metric achievement rate: --%
- Active users: --

📊 Dashboard: [Deployment URL]
```

#### Case B: `/metrics update`

Full metrics update:

1. **business.yaml**:
   - Query paid users, MRR from MCP `prod-db`
   - Execute date-based aggregation queries

2. **[domain].yaml**:
   - Query domain-related tables from MCP `prod-db`
   - Calculate core metrics

3. **segments.yaml**:
   - Calculate segment-level retention, conversion rates

4. Update `_meta.updated_at` in each file

5. Output summary of changes

#### Case C: `/metrics update [domain]`

Update specific domain metrics only:

1. Update only `[domain].yaml`
2. Display before/after comparison

---

## Metrics File Structure

```
.context/metrics/
├── README.md         # Structure description
├── business.yaml     # MRR, ARPU, funnel, targets
├── [domain].yaml     # Domain-specific metrics
├── segments.yaml     # Segment-level metrics
└── team.yaml         # Team/owner information
```

---

## Data Sources

| Metric | Source | Query Notes |
|--------|--------|------------|
| MRR/ARPU | prod-db | Caution with Settlement table (heavy) |
| Funnel | GA4 MCP | - |
| Domain metrics | prod-db | Snapshot table recommended |
| Segments | prod-db | Index column required |

---

## VitePress Dashboard Integration

After metrics update:
1. `npm run build` (VitePress build)
2. `git push` (Vercel auto-deploy)
3. Dashboard updated

---

## Related Commands

- `/analytics` - Activate 📈 Danny (deep analysis)
- `/validate` - Activate 📊 Vicky (hypothesis validation)

---

*File location*: `.context/metrics/`
*Dashboard*: `/dashboard`
