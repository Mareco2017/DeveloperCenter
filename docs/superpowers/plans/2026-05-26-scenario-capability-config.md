# Scenario Capability Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scenario-level capability configuration under product scenario management, constrained to capabilities already associated with the product.

**Architecture:** Reuse the existing `scenario_capability` table and API surface. Strengthen backend invariants in `scenario.service.ts` and `product.service.ts`, then expose a checkbox-based configuration dialog from `ScenarioManage.vue`.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Express, TypeORM, SQLite behavior tests.

---

### Task 1: 后端行为约束

**Files:**
- Modify: `server/tests/product.scenario.behavior.ts`
- Modify: `server/src/services/scenario.service.ts`
- Modify: `server/src/services/product.service.ts`

- [ ] **Step 1: Write the failing test**

Add behavior checks that a scene can only add product-bound capabilities and product unbind is rejected when scene usage exists.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx ts-node tests/product.scenario.behavior.ts`

Expected: FAIL because current services allow a scenario to add an unbound capability and product unbind ignores scene usage.

- [ ] **Step 3: Write minimal implementation**

In `scenario.service.ts`, check the scene's product capability binding before creating `ScenarioCapability`. In `product.service.ts`, check scene usage before removing a product capability.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx ts-node tests/product.scenario.behavior.ts`

Expected: PASS.

### Task 2: 前端能力配置入口

**Files:**
- Modify: `src/views/product/ScenarioManage.vue`
- Modify: `src/api/scenario.ts`

- [ ] **Step 1: Wire state and loading**

Add dialog state for candidate product capabilities, current scenario capabilities, selected capability IDs, and loading flags.

- [ ] **Step 2: Add the card action and dialog**

Add a `能力配置` action button to each scenario card and a checkbox dialog that lists product-bound capabilities.

- [ ] **Step 3: Implement differential save**

Load product capabilities and scenario capabilities on open. On save, add newly checked capabilities and remove unchecked existing scene capability records.

- [ ] **Step 4: Build verification**

Run: `npm run build`

Expected: PASS, allowing the existing Vite chunk-size warning if it appears.

### Task 3: 文档与回归验证

**Files:**
- Modify: `docs/数据库设计.md`
- Modify: `docs/产品设计方案.md`
- Modify: `docs/概要设计方案.md`

- [ ] **Step 1: Update API and model docs**

Clarify that scenario capability configuration is selected from product-associated capabilities and product unbind is blocked while scene usage exists.

- [ ] **Step 2: Run backend and frontend verification**

Run:

```bash
cd server && npx ts-node tests/product.scenario.behavior.ts
cd server && npm run build
npm run build
```

Expected: all commands PASS.
