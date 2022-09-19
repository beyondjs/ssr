import {routing, URI} from '@beyond-js/kernel/routing';
import {Route, PageInstance, PageURI} from '@beyond-js/widgets/routing';
import {widgets, IWidgetSpecs} from '@beyond-js/widgets/render';
import cheerio from "cheerio";
import renderWidget, {IWidgetRenderSpecs} from './widget';

declare const bimport: (resource: string, version?: number) => Promise<any>;

interface IWidgetRendered {
    html?: string,
    css?: string,
    store?: object,
    errors?: string[],
    warnings?: string[],
    attributes?: [string, string][]
}

interface IPageRendered {
    errors?: string[],
    warnings?: string [],
    redirected?: string,
    main?: string,
    page?: {
        element: string,
        parents: string[]
    },
    widgets?: {
        instances: IWidgetRendered[],
        specs: [string, IWidgetSpecs][]
    }
}

export default async function (_uri: string, language: string): Promise<IPageRendered> {
    if (!_uri) return {errors: ['Uri not specified']};

    const uri = new URI(_uri);

    const redirected = typeof routing.redirect === 'function' ? await routing.redirect(uri) : void 0;
    if (redirected) {
        if (typeof redirected !== 'string') return {errors: ['Invalid route value set by custom routing function']};
        return {redirected};
    }

    const route = new Route(uri.pathname);
    await route.process();
    if (!route.page) return {errors: [`Page route for pathname "${uri.pathname}" not found`]}

    // Check if the page layouts parents have any error found
    const instance = new PageInstance(uri, route);
    const {error, value: layouts} = instance.parents;
    if (error) return {errors: [error]};

    const output: { instances: IWidgetRendered[], specs: Map<string, IWidgetSpecs> } = {
        instances: [],
        specs: new Map()
    };

    // Process all the widgets involved in the current requested page
    const process = async (specs?: IWidgetRenderSpecs) => {
        if (!widgets.has(specs.name)) {
            return {errors: [`Widget "${specs.name}" not found`]};
        }

        const wspecs = widgets.get(specs.name);
        output.specs.set(wspecs.name, wspecs);

        // Check if the widget supports ssr
        if (!wspecs.render.ssr) return;

        const done = (data: IWidgetRendered) => {
            const attributes = specs?.attrs ? [...specs.attrs] : void 0;
            output.instances.push(Object.assign({element: specs.name, attributes}, data));
        }

        let {html, css, errors, store} = await renderWidget(specs);
        if (errors?.length) return done({errors});

        // Find child widgets
        const $ = cheerio.load(html);
        for (const widget of widgets.values()) {
            const element = $(widget.name);
            if (!element.length) continue;

            const attrs = new Map();
            widget.attrs?.forEach(attr => attrs.set(attr, element.attr(attr)));

            await process({name: widget.name, attrs, language});
        }
        done({html, css, store});
    }

    // Process the project main layout (if configured)
    const {specifier} = (<any>globalThis).__app_package;
    const config = (await bimport(`${specifier}/config`)).default;
    const main = config.layout;
    main && await process({name: main, language});

    // Process the page
    await process({name: route.page, uri: new PageURI({uri, route}), language});

    // Process the parent layouts of the page
    for (const layout of layouts) {
        await process({name: layout.name, language});
    }

    // Process the response of the request
    const parents: string[] = layouts.map(parent => parent.name);
    const owidgets = {instances: output.instances, specs: [...output.specs]};

    const response = {widgets: owidgets, main, page: {element: route.page, parents}};
    !parents.length && delete response.page.parents;
    return response;
}
