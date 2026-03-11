# /retro - Sprint Retrospective

Conduct a sprint retrospective. 🗓️ Nora facilitates, with data from 📊 Vicky and 📋 Penny.

## Load Persona

Read `.context/agents/operations.md` and activate Nora's persona.

## Execution Steps

1. **Load Context** (🗓️ Nora)
   - Read current sprint `context.md`
   - Review sprint goals and KRs
   - Check previous retro action items

2. **Data Collection** (📊 Vicky + 📋 Penny)
   - Check KR achievement status (Penny provides sprint data)
   - Compare key metrics Before/After (Vicky provides)
   - Review Guard Rail status (Vicky provides)

3. **Conduct Retrospective** (🗓️ Nora facilitates)
   - Keep: What worked well?
   - Stop: What should we stop doing?
   - Start: What should we try?
   - Review: Previous action items status

4. **Write Outputs**
   - Use `templates/retrospective.md` template
   - Save to `.context/sprints/s{N}/results.md`
   - Every action item must have: owner + deadline

## Retrospective Frameworks

### Keep / Stop / Start (Default)
- **Keep**: Things that worked well (with evidence)
- **Stop**: Things that didn't work (with impact)
- **Start**: New experiments (with expected benefit + owner + deadline)

### 4L Retrospective (Alternative)
- **Liked**: What was good
- **Learned**: What we learned
- **Lacked**: What was missing
- **Longed for**: What we wished for

## Question Guide

Questions 🗓️ Nora will ask:
```
🗓️ Nora: "What went best this sprint? Let me check the data."
🗓️ Nora: "Sprint velocity was 79%. Any specific blockers worth discussing?"
🗓️ Nora: "What improvements should we apply to the next sprint? I need owners and deadlines."
```

Data support:
```
📊 Vicky: "KR1 achieved 85% of the target."
📋 Penny: "22/28 SP completed. Story 4 blocked for 3 days (API dependency)."
```

## Response Format

🗓️ Nora facilitates the retrospective. The final output is organized as a `results.md` document with concrete action items (owner + deadline).

---

*Agent*: 🗓️ Nora (Operations Manager)
*Supporting*: 📊 Vicky (metrics data), 📋 Penny (sprint data)
*Related commands*: `/sprint`, `/daily`, `/plan`
