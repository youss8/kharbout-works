# Contributing

Start a feature with an issue describing who would use it, an example of the problem and how a reviewer can tell the implementation works. Use fictional examples and original code, copy and visuals throughout.

Work on one issue per branch. Keep commits focused and use Conventional Commits, such as `docs: explain how to reuse the filter utility`. In the pull request, link the issue, describe the user-visible change and explain how you verified it. Include keyboard and right-to-left checks for interface changes. The maintainer reviews and merges after the checks pass.

Name branches for the change a reviewer will see. Use a short, lowercase name such as `feat/component-vault`, `fix/ticket-deep-links` or `docs/catalogue-layout`. Include an issue number when it helps someone find the discussion. Leave tool names and session IDs out of branch names.

Write commit subjects in the imperative and name the behavior that changed. For example, `fix: keep linked tickets visible when filters change` tells a reviewer what to check. Use the body for a decision or trade-off that the diff alone cannot explain.

For a catalogue entry, document the dependencies, a small usage example, the usual points of customisation and a way to verify the result. Record significant architecture choices in `docs/adr/` when they arise. Explain the problem, options considered and consequences of the choice.

Follow the [entry authoring guide](docs/adding-an-entry.md) when publishing a resource. Open the entry directly, find it from the shared search dialog, download its ZIP and follow the enclosed instructions in a fresh directory. Include the result of the independent reuse check in the pull request.
