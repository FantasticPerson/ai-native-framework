# Playground

Type an instruction and watch how the AI orchestrates operations within the **capability-manifest whitelist** — producing an operation plan and highlighting the matched capabilities.

<Playground />

## What it demonstrates

- **Read structure, don't guess the screen**: the capability manifest on the right is extracted from the code structure at build time. The LLM can only orchestrate within this whitelist.
- **Precise orchestration**: one natural-language sentence → a deterministic sequence of `navigate` / `fill` / `click` steps, each corresponding to one capability in the manifest.
- **Whitelist constraint**: modules or operations outside the manifest are rejected by `parsePlan` and never executed.

> This page is a static demo (preset manifest + mock provider, no real LLM). For real integration see [Quick Start](/en/guide/getting-started).
