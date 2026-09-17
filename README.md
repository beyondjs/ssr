# BeyondJS SSR

`@beyond-js/ssr` runs a Node HTTP service that returns server-rendered widget/page **JSON**: HTML fragments, optional CSS, serialized store data and widget metadata. The browser Widgets runtime consumes those results; this package does not itself serve a complete application HTML document or implement browser hydration.

Widgets supplies an islands-style frontend architecture using modular authoring and delivery. SSR renders those widget units on the server; CSR and framework hydration remain client responsibilities, and static-render persistence is not implemented here.

The public Beyond modules are `@beyond-js/ssr/server` (`SSRServer`) and `@beyond-js/ssr/listen` (`listen`). Both manifests target the `ssr` platform. Source is authored in Beyond and requires compiled modules, routing/widget registration, application configuration and the expected runtime import helper.

Read [architecture, endpoints and integration](docs/architecture.md) before starting the service. The guide explains rendering flow, store responsibilities, client compatibility, setup prerequisites and known failure/lifecycle limitations. `/page` and `/widget` contain rendering implementations; `/store` is a placeholder. Server readiness and shutdown are incomplete.

[package.json](package.json) declares Kernel, Cheerio and Widgets compatibility ranges and source distributions. There is no root start/build/test script, test suite or standalone Node entrypoint in this checkout. Installing the package alone does not configure SSR for an application.
