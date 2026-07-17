# Why

## The claim in one line

**Give your own frontend app high-accuracy, visible and controllable AI operations.**

The user says one sentence to the app ("file a personal leave for tomorrow", "filter expenses by travel"), and the AI completes the corresponding multi-step operation — switching pages, filling forms, clicking, submitting — all of it visible.

## The core insight

The semantics of a modern frontend app already exist; they are just scattered around and never collected:

- **Which pages exist** — written in the route config.
- **Which fields each form has, their types, whether required** — written in `<Form.Item>`, `register`, zod/yup schemas.
- **Which clickable actions exist** — written on `<button>` / `<a>` with their labels.

This information is already the authoritative definition of "what the app can do". The problem is not missing semantics, but that nothing collects them into a capability manifest the AI can read.

So the core action of this framework is: **use static AST analysis at build time to extract a "capability manifest" from the structure already in the code**, instead of asking developers to annotate everything again for the AI.

## How we differ

The one-line distinction from competitors: **others let the AI "look at the screen and guess how to operate any website", we let the AI "read the structure and operate your own app precisely".**

- **vs browser agents (browser-use / Operator / Computer Use)**: they operate any website by visual guessing — general but accuracy-limited; we only serve apps whose source you control, trading a compile-time capability boundary for high accuracy.
- **The key qualifier**: only for apps whose source the developer controls (internal tools, SaaS, admin systems), not automation of arbitrary third-party websites.

## An honest boundary

- Auto-inference accuracy < manual annotation — that's physics. We don't claim "fully automatic and most accurate".
- Embrace MCP, don't reinvent the transport protocol; no pure visual recognition.

> See [RFC 0001](https://github.com/FantasticPerson/ai-native-framework/blob/main/docs/rfcs/0001-ai-native-frontend-framework.md) for the full positioning and differentiation.
