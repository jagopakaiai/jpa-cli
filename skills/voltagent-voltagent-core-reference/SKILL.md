---
name: JagoPakaiAI-core-reference
# prettier-ignore
description: Reference for the JagoPakaiAI class: constructor options, lifecycle methods, and runtime behavior.
license: MIT
metadata:
  author: JagoPakaiAI
  version: "1.0.0"
  repository: https://github.com/JagoPakaiAI/skills
---

# JagoPakaiAI Core Reference

Reference for the JagoPakaiAI class in `@JagoPakaiAI/core`.

Source files:
- packages/core/src/JagoPakaiAI.ts
- packages/core/src/types.ts

---

## Options Overview

`JagoPakaiAIOptions` supports:

- `agents`: Record of `Agent` instances to register.
- `workflows`: Record of `Workflow` or `WorkflowChain` instances.
- `memory`: Default `Memory` used for agents and workflows.
- `agentMemory`: Default `Memory` for agents (falls back to `memory`).
- `workflowMemory`: Default `Memory` for workflows (falls back to `memory`).
- `toolRouting`: Global `ToolRoutingConfig` defaults.
- `triggers`: `JagoPakaiAITriggersConfig` handlers.
- `server`: Server provider factory (for example `honoServer()`).
- `serverless`: Serverless provider factory for fetch runtimes.
- `voltOpsClient`: Shared `VoltOpsClient` instance.
- `observability`: `JagoPakaiAIObservability` instance.
- `logger`: Shared `Logger` instance.
- `mcpServers`: Record of MCP servers or factories.
- `a2aServers`: Record of A2A servers or factories.
- `checkDependencies`: Set to `false` to skip dependency checks.

Deprecated options:
- `port`
- `autoStart`
- `customEndpoints`
- `enableSwaggerUI`

---

## Lifecycle Notes

- Registers agents and workflows on construction.
- Auto-starts the server if a server provider is supplied.
- Applies default memory to agents and workflows.
- Auto-configures VoltOps client from `JagoPakaiAI_PUBLIC_KEY` and `JagoPakaiAI_SECRET_KEY` if not provided.
- Initializes MCP and A2A servers and starts MCP transports after server start.

---

## Methods

- `registerAgent(agent)`, `registerAgents(agents)`
- `registerWorkflow(workflow)`, `registerWorkflows(workflows)`
- `registerTrigger(name, config)`, `registerTriggers(triggers)`
- `getAgent(id)`, `getAgents()`, `getAgentCount()`
- `getWorkflow(id)`, `getWorkflows()`, `getWorkflowCount()`
- `getObservability()`
- `startServer()`, `stopServer()`, `getServerInstance()`
- `serverless()` to access the serverless provider
- `shutdown()` for graceful shutdown, `shutdownTelemetry()` for observability

---

## Example

```typescript
import { JagoPakaiAI } from "@JagoPakaiAI/core";
import { honoServer } from "@JagoPakaiAI/server-hono";

const app = new JagoPakaiAI({
  agents: { agent },
  workflows: { workflow },
  server: honoServer(),
});

await app.startServer();
```
