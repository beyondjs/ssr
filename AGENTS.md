# SSR agent instructions

Canonical instructions for this independent repository and descendants. Read the local README and architecture guide before changing implementation.

- Preserve existing source branches, changes and public module identities. No commit, push, reset, publication or deployment without explicit authorization.
- Use English for first-party documentation and explanatory text; preserve executable identifiers and generated/vendor content.
- Explain SSR responsibilities separately from browser rendering, framework adapters and server hosting. Source inspection is not runtime verification.
- Preserve Beyond module authoring, bare public imports and familiar composed objects. Internal source files are not automatically public modules.
- Keep documentation autonomous and relative links inside this repository. Other components are optional references, not assumed sibling directories.
- Validate links and formatting for documentation; do not run unrelated builds/services or alter executable behavior for a documentation task.
- Follow the [coding standards](docs/coding-standards.md); they are binding for new and modified code. Source files target 300 lines or fewer and must not exceed 400. Model each responsibility as a class that owns `#private` state and exposes simply named members, composed from collaborating objects. Avoid compound names in methods, properties, variables and parameters by giving the responsibility its own object: `client.register()`, not `registerClient()`. Compound names remain allowed in class definitions. Preserve public contracts, and do not rewrite untouched files only to comply.

Documentation follows [the local documentation standards](docs/AGENTS.md).

The coordinated working branch is `feature/next`. Its base preserves the selected TypeScript implementation; do not switch back to historical source branches for ordinary work.
