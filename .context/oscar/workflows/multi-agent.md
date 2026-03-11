# Multi-Agent Coordination (Oscar Module)

> Referenced from orchestrator.md core when delegation/parallel execution is needed

---

## Sequential Deployment

```
"Danny should look at the data first, then Simon can formulate hypotheses based on the results."

Danny analysis complete → Oscar passes results → Simon formulates hypothesis
```

## Parallel Deployment (Parallel Task tool calls)

Oscar **invokes multiple Task tools simultaneously in a single response** for actual parallel execution.

### Implementation Method

```markdown
1. Analyze request → Determine need for parallel execution
2. Create Tasks per agent (parallel calls in the same message):

   Task #1 (Danny):
   - subagent_type: "general-purpose"
   - prompt: "You are 📈 Danny (Analyst).
     [Refer to .context/agents/analyst.md persona]
     {specific analysis request}
     Be careful with heavy tables when running DB queries."

   Task #2 (Rita):
   - subagent_type: "general-purpose"
   - prompt: "You are 🎤 Rita (Researcher).
     [Refer to .context/agents/researcher.md persona]
     {specific research request}"

3. Collect results and synthesize
```

### Parallel Execution Triggers

| Keyword/Situation | Parallel Targets | Reason |
|-------------------|-----------------|--------|
| `churn`, `attrition`, `why leaving` | Danny + Rita | Quantitative + Qualitative simultaneously |
| `full analysis`, `comprehensive` | Danny + Rita + Vicky | Multi-angle analysis |
| `quick assessment`, `ASAP` | All relevant agents | Speed priority |
| `brainstorm`, `ideas` | All 5 agents | Parallelized party mode |

### Parallel vs Sequential Decision Criteria

| Situation | Execution Mode | Reason |
|-----------|---------------|--------|
| 2+ independent analyses | **Parallel** | Time savings |
| Previous results needed for next task | **Sequential** | Dependencies |
| Multiple heavy table DB accesses | **Sequential** | Load distribution |
| Fast response needed (ASAP) | **Parallel** | Speed priority |
| Deep analysis needed (deep dive) | **Sequential** | Quality priority |

### Result Synthesis Format

```markdown
🎩 Oscar: Parallel analysis complete. Synthesizing results.

## 📈 Danny Analysis Results
- {key metrics}
- {patterns/insights}

## 🎤 Rita Analysis Results
- {key VOC}
- {customer psychology}

## 🎩 Oscar Synthesis
- **Common findings**: {cross-insights}
- **Next steps**: {follow-up agent suggestions}
```

### Precautions

1. **Concurrent DB access**: Be careful with simultaneous heavy table queries, specify LIMIT/WHERE in each Task
2. **MCP rate limit**: Fall back to sequential when accessing the same MCP server concurrently
3. **Context consistency**: Pass identical baseline information to each Task, specify reference timestamp when synthesizing results
