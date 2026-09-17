# Server-side rendering architecture

## Responsibilities and public modules

SSR executes widget server controllers inside Node and returns render results for a client application. It depends on the application's registered widget/routing model and Beyond module loading. It does not compile controllers, provision backend hosting, publish packages, deliver a complete HTML document, or apply browser HMR.

| Public module | API and source |
| --- | --- |
| `@beyond-js/ssr/server` | [SSRServer](../modules/server/server.ts), constructor `(pkg: string, port: number)` starts HTTP listening |
| `@beyond-js/ssr/listen` | [listen](../modules/listen/listen.ts), `(pkg?: string, port?: number): void`, optional legacy BEE configuration adapter |

The [server manifest](../modules/server/module.json) and [listen manifest](../modules/listen/module.json) declare TS bundles for platform `ssr`. The render functions and WidgetAttributes are internal source helpers, not additional public imports. `modules/_older` has a disabled `module._json` and `.-ts` files using earlier Kernel APIs; it is not an active renderer alternative.

## Widgets as independently rendered islands

Widgets provides an islands-style frontend model: each registered custom element identifies a widget whose public module supplies its controller and rendering behavior. Beyond's modular authoring and independently addressable delivery let an application compose those units without treating internal source files as public modules. SSR supplies server-rendered markup/state for those same units; it is a rendering capability of Widgets, not a competing page architecture.

CSR means the client controller/framework renders the widget in the browser. SSR means a server controller produces initial markup/state which the browser can adopt and, where enabled, hydrate using a compatible client controller. SR means generating reusable static render results ahead of requests; this package has no static-generation job, persistence or route enumeration implementation. Page traversal checks render.ssr only. It does not implement scheduling for render.sr or decide browser CSR execution.

The architecture permits independently delivered interactive units, but does not by itself establish deferred hydration, visibility/idle-triggered loading or automatic JavaScript omission. Those policies belong to Widgets/compiler/adapters and must be specified and verified. SSR-only output and SSR followed by CSR hydration have different client requirements; store hydration and framework DOM hydration are distinct operations.

## Startup and execution prerequisites

`listen` checks global `__bee`; when present it replaces both supplied arguments with `__bee.specs.project.pkg` and `__bee.specs.ports.http`. Without it, the caller supplies package and port. Missing/falsy values log a message and return. The function constructs SSRServer but returns no server handle.

SSRServer sets `globalThis.__app_package = pkg` only if that global is absent, creates an HTTP server and calls listen. In a fork it immediately sends `{type: 'ready'}` through process.send; this happens before the server's listening callback/event confirms successful binding. It stores no accessible server reference, installs no bind-error handler and exposes no awaited ready/stop/destroy contract. Repeated starts and failed binds are not managed.

Application context is inconsistent when starting from the string signature alone: the page renderer reads `__app_package.specifier`, but this constructor initializes that global to a string. A compatible bootstrap must establish the object context or this contract must be repaired. Because the global is assigned only once, separate server instances do not establish isolated application contexts.

The selected loading environment must provide:

- compiled `ssr` variants of SSR, Widgets, Kernel routing/styles and application/controller modules;
- global `bimport`, used for application config and controller loading;
- application widget registration, page routes and layout metadata before rendering;
- an application config module with the intended layout and compatible client SSR endpoint configuration;
- Node HTTP support, Cheerio and any controller framework dependencies.

This package does not initialize those resources itself. Modern BEE Node loader hooks do not by themselves supply bimport, global application state or the legacy `ssr` conditional output. Define and test that integration separately from the existing BEE adapter.

## HTTP endpoints

The [listener](../modules/server/listener.ts) dispatches by pathname using a synthetic URL base. It does not restrict the HTTP method, parse a JSON body, authenticate callers or enforce per-request application identities. Language is truncated to two characters. Query values must be URL-encoded by the caller.

| Path | Parameters | Result |
| --- | --- | --- |
| `/page` | `uri` required; `language` optional | Main layout/page hierarchy plus widget specs and rendered instances, a redirect description, or errors |
| `/widget` | `name`; optional `uri`, `language`, `attrs` and `attrs.<name>` | One controller result: html/css/store/specs/errors/warnings |
| `/store` | `pathname`, optional `language`; attrs is read but unused | Placeholder `{value: ...}` string; it does not fetch a widget store |

For widget attributes use, for example, `/widget?name=example-card&attrs=title&attrs.title=Hello`. `attrs` is a comma-separated set of attribute names; absent values become null at runtime despite string annotations. Optional uri is resolved to a page route before constructing PageURI.

Results are JSON, including HTML as a string. Only a top-level nonempty errors array selects HTTP 500; other results use 200. Unknown endpoints therefore return 500 instead of 404. Redirects are `{redirected: ...}` JSON, not HTTP redirect responses. Nested page-instance errors do not necessarily set the response status to failure.

The response includes wildcard Access-Control-Allow-Origin and application/json. `Content_Length` is misspelled and uses JavaScript string length rather than UTF-8 byte length, so it is not a correct Content-Length contract. There is no cache header, ETag, compression, stream rendering or request timeout policy here.

Two response-completion gaps require repair: an invalid optional `/widget` URI returns `{errors}` from the processing function without writing/ending the response; exceptions before the final serialization block are only logged by the outer catch and similarly may leave the request open. Serialization failures enter finally and end the response but do not guarantee a structured error body/status.

## Widget render flow

[render/widget.ts](../modules/server/render/widget.ts) performs these steps:

1. Find the widget by its registered element name; return an error if absent.
2. Remove the package version from its vspecifier and bimport the resulting public module. Require a named Controller function export. This delegates exact version selection to runtime resolution; it is not a pinned import of the registry entry's version.
3. Construct `new Controller({specs: widget})` using the server-controller convention.
4. Call `controller.createStore?.(language)` and await `store?.fetch()`.
5. Copy provided attributes into [WidgetAttributes](../modules/server/render/attributes.ts), a Map with no-op on/off methods; add optional PageURI to props.
6. Await `controller.render({store, attributes, uri?})`; return html, css, errors, warnings, the store object and widget specs.

Controller import and execution errors become errors arrays. Direct `/widget` rendering does not check render.ssr; `/page` does. Attributes are copied but not reactive, and no controller/store disposal runs after success or failure. Rendering has no cancellation, deadline, concurrency limit or per-request runtime isolation.

`createStore` is a method, not a getter. The Widgets interface marks fetch, hydrate and toJSON optional, but this server calls `store?.fetch()` without optional-chaining the method: an existing store lacking fetch throws. Store data is returned as an object; JSON.stringify later invokes its toJSON if supplied. toJSON serializes state, not HTML. Returned state must be appropriate to expose to the client and JSON-safe; cycles or unsupported values can fail serialization. Hydrate belongs to the client store and is not invoked by this server.

## Page traversal and instance identity

[render/page.ts](../modules/server/render/page.ts) parses Kernel URI, evaluates optional routing.redirect, processes Widgets Route and constructs PageInstance to obtain parent layouts. It loads `<application specifier>/config`, processes the configured main layout, then the page with PageURI, then parent layouts in order.

For each registered widget it records specs, skips HTML rendering unless render.ssr is true, renders the controller, parses returned HTML with Cheerio and searches for every registered widget tag. Child widgets are processed recursively before the parent instance is appended. Returned data contains `main`, `page.element`, optional `page.parents`, and `widgets: {instances, specs}`; specs serializes Map entries. It does not splice the child HTML into the parent's HTML or assemble a full document.

Traversal limitations:

- A selector can match several occurrences of a widget, but attributes are taken from the first match and one recursive call is made per widget name. Repeated instances with different attributes are collapsed.
- No recursion/cycle/depth guard exists. A widget rendering its own tag, or mutually recursive widgets, can keep rendering indefinitely.
- Nested children and layouts receive language but not the page's PageURI. Store creation receives language only, not attributes or uri.
- The specs Map deduplicates names; instances may contain repeated visits through separate roots. There is no stable per-occurrence instance ID.
- Missing widgets return errors from the local process helper, but callers discard that return. A missing main/layout widget can therefore disappear without a top-level error.
- Render errors are recorded per instance; warnings and returned specs from widget rendering are not copied into page-instance output. Consumers must inspect instance errors, not only the top-level response.

These are source constraints on completeness and identity, not a general tree-rendering guarantee.

## Styles, browser adoption and hydration

The browser integration describes responsibilities, not a guaranteed sequential barrier. The companion Widgets source starts SSR/SR and CSR without waiting for server markup before client initialization. Client rendering can populate the holder first, causing later SSR markup adoption to be skipped, and store hydration can run before server data exists. A reliable server-markup/state-to-client-hydration order remains an integration requirement.

SSR returns the controller's HTML/CSS unchanged. It does not gather styles or embed css independently. The Widgets WidgetServerController obtains dependency-style links and a package global.css placeholder. A framework adapter decides how to put those links into markup. For example the React 18 server adapter calls renderToString; its client adapter chooses hydrateRoot when holder content already exists.

In the companion Widgets implementation, application startup consumes an externally created `__ssr_fetch` promise, registers returned specs/instances and supplies layout hierarchy. Individual widgets can instead fetch `/widget` from their package config's ssr.host. The web renderer inserts HTML into the widget holder, resolves `##_!<package>!_##` host placeholders and waits for linked styles. Its renderer does not independently consume the returned css field. Browser execution and framework hydration still require client controllers and compatible data/markup; SSR output alone is not an interactive application.

The selected companion sources have additional compatibility constraints (published versions may differ):

- Widgets `src/modules/render/web/widget/ssr.ts` returns an empty suffix when no attributes are declared, but the nonempty-attributes branch forgets to return its constructed query and interpolates literal undefined. After that missing return is repaired, its `attr.<name>` keys would still disagree with this listener’s `attrs.<name>` keys, and values still need URL encoding.
- Widgets prerendered matching reduces attribute comparisons with OR from true, effectively selecting the first matching element name regardless of attributes.
- WidgetClientController awaits store.hydrate when prerendered data exists, then calls fetch without awaiting it before rendering. Like the server fetch call, its hydrate call assumes the method exists on an existing store despite the optional interface.
- Engine's legacy page bootstrap fetches SSR JSON in the browser rather than embedding a complete rendered document in the initial HTTP response. SEO/first-content or hydration-success claims require separate measured application evidence.
- Global registries and bimport caching are dependency runtime state; this package supplies no revision-aware render cache, invalidation or HMR integration for server controllers.

These companion paths identify external API dependencies; this repository's documentation remains usable without a sibling checkout. Preserve the public Widgets controller/routing contracts while correcting transport and instance identity.

## Configuration, build and verification

[package.json](../package.json) declares version 0.1.3, Kernel `~0.1.9`, Cheerio `^1.0.0-rc.12`, Widgets peer `^1.1`, and Node types. It declares ssr/node source distributions on bundle ports 9114/9115; those are compiler delivery ports, not a chosen SSR request port. Both active module manifests target only ssr, so the presence of a node distribution is not proof these modules are emitted for it.

There is no beyond.json, root entrypoint, npm script, lockfile, test suite, CI or runnable application fixture tracked here. Use the selected compiler's package-discovery configuration and install the actual resolved dependencies in a deliberately configured environment. TypeScript targets ES2017 with ES2020 modules and noImplicitAny. Source globals, marked exports and platform selection require the Beyond compilation contract; direct Node execution of these TS files is not the documented setup. Cheerio's default-import/export compatibility and server/client framework versions must be verified against resolved artifacts.

The old README's widget.type and widget.render configuration examples do not establish the compiler's current authoring schema. The consumer's chosen compiler owns module.json interpretation; Widgets runtime specs use is/name/render. Validate authoring-to-registry translation rather than copying stale examples or treating CSR/SR flags as a complete static-generation implementation in this repository.

Verification for a maintained implementation should cover successful bind/failed bind/shutdown; registered and missing widgets; missing fetch/hydrate methods; encoded attributes/language/URI; invalid routes and guaranteed response termination; redirect handling; nested/repeated/cyclic widgets; JSON serialization errors; style adoption; actual store and framework hydration; simultaneous applications/requests; resolved controller versions; and edits followed by server/client cache invalidation. Static rendering persistence and the placeholder store endpoint need separate requirements and implementation before acceptance claims.
