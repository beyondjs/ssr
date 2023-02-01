# Welcome to @beyond-js/ssr

BeyondJS implements Server Side Rendering (SSR) via an HTTP server with three endpoints: widget and page. It allows to implement SSR solutions in web projects, which focuses on generating the HTML of a component or widget on the server side before sending it to the client, allowing to load the data structure of the component quickly and avoid the need for intervening packages, dependencies, or client-side frameworks to load it.

### Installation

To use @beyond-js/ssr, it is necessary to install it as a dependency in your project. You can do this by running the following command in your terminal:

```
npm install @beyond-js/ssr

```

Usage
To enable SSR in a module or widget, you need to add an "ssr" property in the bundle configuration (widget) of the module's "module.json" file. This property must be a boolean indicating whether server-side rendering is active.

In addition, it is necessary to define a "createStore" property in the view's Controller, which is a getter that returns an object of type IWidgetStore. This object must contain three main methods:

-   `toJSON`: responsible for returning the data that the widget will consume from the server, and serializing the HTML response so that it can be sent to the client and displayed on the screen.
-   `hydrate`: responsible for hydrating or updating the HTML in the client, assuming that the state previously rendered on the server matches the state to be returned to the client. This process is called hydrate and is responsible for synchronizing the client state with the server state.
-   `fetch`: used in both SSR and CSR (Client Side Rendering) strategies, and responsible for processing the Store data and making it available. This method is executed both on the client and on the server, depending on the strategy used.

Here's an example of how to configure the widget bundle configuration in the module.json file:

```json
{
    "widget": {
        "name": "mi-widget",
        "type": "page",
        "route": "/mi-pagina",
        "render": {
            "ssr": true
        }
    }
}
```
