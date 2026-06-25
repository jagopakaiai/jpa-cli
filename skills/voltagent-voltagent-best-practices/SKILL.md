---
name: JagoPakaiAI-best-practices
# prettier-ignore
description: JagoPakaiAI architectural patterns and conventions. Covers agents vs workflows, project layout, memory, servers, and observability.
license: MIT
metadata:
  author: JagoPakaiAI
  version: "1.0.0"
  repository: https://github.com/JagoPakaiAI/skills
---

# JagoPakaiAI Best Practices

Quick reference for JagoPakaiAI conventions and patterns.

---

## Choosing Agent or Workflow

| Use | When |
| --- | --- |
| Agent | Open-ended tasks that require tool selection and adaptive reasoning |
| Workflow | Multi-step pipelines with explicit control flow and suspend/resume |

---

## Layout

```
src/
|-- index.ts
|-- agents/
|-- tools/
`-- workflows/
```

---

## Quick Snippets

### Basic Agent

```typescript
import { Agent } from "@JagoPakaiAI/core";

const agent = new Agent({
  name: "assistant",
  instructions: "You are helpful.",
  model: "openai/gpt-4o-mini",
});
```

Model format is `provider/model` (for example `openai/gpt-4o-mini` or `anthropic/claude-3-5-sonnet`).

### Basic Workflow

```typescript
import { createWorkflowChain } from "@JagoPakaiAI/core";
import { z } from "zod";

const workflow = createWorkflowChain({
  id: "example",
  input: z.object({ text: z.string() }),
  result: z.object({ summary: z.string() }),
}).andThen({
  id: "summarize",
  execute: async ({ data }) => ({ summary: data.text }),
});
```

### JagoPakaiAI Bootstrap

```typescript
import { JagoPakaiAI } from "@JagoPakaiAI/core";
import { honoServer } from "@JagoPakaiAI/server-hono";

new JagoPakaiAI({
  agents: { agent },
  workflows: { workflow },
  server: honoServer(),
});
```

---

## Memory Defaults

- Use `memory` for a shared default across agents and workflows.
- Use `agentMemory` or `workflowMemory` when defaults need to differ.

---

## Server Options

- Use `@JagoPakaiAI/server-hono` for Node HTTP servers.
- Use `@JagoPakaiAI/server-elysia` as an alternative Node server provider.
- Use `serverless` provider for fetch runtimes (Cloudflare, Netlify).

---

## Observability Notes

- Use `VoltOpsClient` or `createJagoPakaiAIObservability` for tracing.
- JagoPakaiAI will auto-configure VoltOps if `JagoPakaiAI_PUBLIC_KEY` and `JagoPakaiAI_SECRET_KEY` are set.

---

## Recipes

Short best-practice recipes live in the embedded docs:

- `packages/core/docs/recipes/`
- Search: `rg -n "keyword" packages/core/docs/recipes -g"*.md"`
- Read: `cat packages/core/docs/recipes/<file>.md`

---

## Footguns

- Do not use `JSON.stringify` inside JagoPakaiAI packages. Use `safeStringify` from `@JagoPakaiAI/internal`.

---

## Resources

- https://JagoPakaiAI.dev/docs
- https://github.com/JagoPakaiAI/JagoPakaiAI
- https://github.com/JagoPakaiAI/JagoPakaiAI/tree/main/examples
