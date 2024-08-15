# Welcome to @beyond-js/ssr

BeyondJS implements Server-Side Rendering (SSR) via an HTTP server with three endpoints: widget and page. It allows the
implementation of SSR solutions in web projects by generating the HTML of a component or widget on the server side
before sending it to the client. This enables quick loading of the component's data structure without the need for
additional packages, dependencies, or client-side frameworks to load it.

## Key Features

`Server-Side Rendering (SSR)`: Pre-render content on the server to deliver a fully rendered page to the client,
improving initial load times and SEO.

`Client-Side Rendering (CSR)`: Render content entirely on the client-side, ideal for dynamic and interactive
applications.

`Static Rendering (SR)`: Pre-render specific routes as static content, balancing between SSR and CSR for optimized
performance.

## Installation

Install `@beyond-js/ssr` it as a dependency in your project:

```code
npm install @beyond-js/ssr
```

## Usage

To enable SSR in a module or widget, add an ssr property in the bundle configuration (widget) of the module's
module.json file. This property must be a boolean indicating whether server-side rendering is active.

Additionally, define a createStore property in the view's Controller, which is a getter returning an object of type
IWidgetStore. This object must contain three main methods:

`toJSON`: Returns the data that the widget will consume from the server, serializing the HTML response so it can be sent
to the client and displayed on the screen.

`hydrate`: Hydrates or updates the HTML on the client, ensuring the state rendered on the server matches the client
state. This process synchronizes the client state with the server state.

`fetch`: Used in both SSR and CSR strategies, responsible for processing the Store data and making it available. This
method executes on both the client and server, depending on the strategy used.

### Example Configuration

Here’s an example of how to configure the widget bundle in the module.json file:

`SSR`:

```json
{
	"widget": {
		"name": "my-widget",
		"type": "page",
		"route": "/my-route",
		"render": {
			"ssr": true,
			"sr": false,
			"csr": false
		}
	}
}
```

`CSR`:

```json
{
	"widget": {
		"name": "my-widget",
		"type": "page",
		"route": "/my-route",
		"render": {
			"ssr": false,
			"sr": false,
			"csr": true
		}
	}
}
```

`SR`:

```json
{
	"widget": {
		"name": "my-widget",
		"type": "page",
		"route": "/my-page/${entry}",
		"element": {
			"name": "sr-page"
		},
		"render": {
			"csr": false,
			"sr": ["/my-page/example", "/my-page/other-example"]
		}
	}
}
```

This setup provides developers with the flexibility to choose the appropriate rendering strategy based on the specific
needs of their application, ensuring optimal performance and user experience across different scenarios.
