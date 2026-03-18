# Internet of Models

> This is a thought experiment, not production software.

A concept prototype exploring what happens when AI model management needs the same infrastructure patterns that microservices got a decade ago.

[Try the live demo](https://dvelton.github.io/Internet-of-Models/)

## The problem

Most organizations using AI today are running some version of the same setup: a few OpenAI API keys, maybe an Anthropic account, possibly some HuggingFace models, and a growing collection of fine-tuned models for specific tasks. Each has its own API format, auth mechanism, pricing structure, and reliability profile.

The glue between these models is bespoke code. A Python script here, a Lambda function there, some retry logic that one engineer wrote and nobody else understands. There's no central registry of what models are available, no standard way to route between them, no coordinated view of costs or performance, and no obvious place to enforce access control.

This looks a lot like where microservices were before service meshes. Individual services worked fine on their own, but the connections between them were a mess until tools like Istio and Linkerd gave teams a coordination layer.

## The concept

Internet of Models applies the service mesh pattern to AI model management.

A **registry** catalogs every model available to the organization (cloud APIs, local deployments, fine-tuned models) with their schemas, capabilities, costs, and health status. **Pipeline orchestration** lets you compose multi-model workflows where the output of one model feeds into the next, with schema translation between different providers' API formats. **Routing and fallback** handle the case where your primary model is down or rate-limited by automatically switching to a backup, picking models based on latency, cost, or capability requirements. And **observability** tracks what's being called, how often, how fast, and at what cost, across every model and every pipeline.

## The POC

This repo contains a working proof of concept. It's a React app with a model registry for browsing and registering AI models, a visual pipeline builder (drag-and-drop, built on React Flow) for composing multi-model workflows, an analytics dashboard with cost and latency metrics, and a test interface for invoking individual models.

It ships with sample configurations for OpenAI, Anthropic, Google, HuggingFace, and local Ollama models, along with example pipelines for content enhancement and multi-language translation.

## Why this is interesting

**Cost governance.** When model usage is scattered across teams and API keys, nobody has a clear picture of what the organization is spending on AI inference. A centralized registry with cost-per-token tracking and usage analytics changes that.

**Audit and compliance.** In regulated industries, you need to know which model produced which output, when, and with what inputs. Pipeline execution logging gives you that chain of custody.

**Vendor independence.** The pipeline abstraction means a workflow doesn't hard-code a specific provider. Swapping GPT-4 for Claude or a local model means changing the routing, not rewriting the pipeline.

## Open questions

This is a prototype, not production software. The execution engine runs pipeline nodes sequentially instead of resolving the actual dependency graph. There's no CORS proxy for browser-based API calls. The data transformation layer between different providers' schemas is stubbed.

Beyond the engineering, the harder conceptual questions:

- How do you handle streaming responses through a multi-model pipeline?
- What's the right abstraction for schema translation between providers: automatic inference, manual mapping, or something in between?
- How should the routing layer balance cost against quality when selecting models?
- Where does the liability sit when a chained pipeline produces a bad output -- is it the first model, the last one, or the orchestration layer?

## Stack

React 19, TypeScript, Vite, TailwindCSS, shadcn/ui, React Flow, Recharts. Originally built on GitHub Spark; this version uses localStorage for standalone deployment.

## License

MIT
