# Testing

This repository has no tests: no test files, fixtures, runner, command or runnable application. No validation exercises the `@beyond-js/ssr` service. The command line's `web` acceptance in the `cli` repository (an optional external reference) renders widgets on a Node host with their server controllers and hydrates them in a browser, but it does so without this package, so it establishes nothing about `SSRServer`, `listen` or the HTTP endpoints. [Configuration, build and verification](architecture.md#configuration-build-and-verification) lists the cases a maintained implementation must cover.

## Levels and commands

| Level | Location | Command | What it establishes |
| --- | --- | --- | --- |
| Contract/unit, integration and acceptance | None in this repository | None | Nothing |
| Required verification cases | [Configuration, build and verification](architecture.md#configuration-build-and-verification) | None: they are requirements for a maintained implementation | Nothing until they are executed |

## Exceptions and limits

- The service needs compiled modules, routing and widget registration, application configuration and a runtime import helper that this repository does not supply; there is no `beyond.json` here.
- Static rendering persistence and the placeholder store endpoint have no requirements yet, so nothing can accept them.
- Whoever adds tests here follows the section below and names the compiler, loader and consumers a run exercises.

## Test organization and source fixtures

These rules are shared by every Beyond repository.

- Contract/unit and integration tests live in `test/` or `tests/`; complete journeys against an installed, composed or exported product live in `acceptance/`, with a README of their own. Harness infrastructure (servers, registries, process lifecycle, copying and substitution) lives in a `support/` directory of the consuming area.
- Applications, packages, modules, documents and assets a test exercises are checked-in files with their real extensions and directory structure under the consuming area's `fixtures/`. Each fixture group has a README naming its purpose, entry modules, the tests that use it, their command, the expected behavior and any intentionally invalid part. A reader inspects the example without running or decoding a generator.
- A harness copies the fixtures it runs or edits to a unique temporary directory, substitutes only explicit values such as versions, ports or origins, and never writes the checked-in files, even when a run fails. Credentials, machine paths and build output are never fixture source.
- Small input values, expected values, protocol payloads and short edits stay inline. Source is generated only when generation is the behavior under test (size or memory stress, combinations, deliberately malformed input); the guide states why, the parameters that reproduce it and how to inspect what was generated.
- Fixtures stay out of the repository's production compilation, discovery and packaging.
- Migrating a test preserves its scenario identities, its positive, negative and recovery cases and its real execution path; an existing failure stays reported as a failure.
