import {widgets} from '@beyond-js/widgets/render/ts';
import {routing} from '@beyond-js/kernel/routing/ts';
import {renderWidget, WidgetContext} from './renderWidget';
import cheerio from 'cheerio';

interface IWidgetRendered {
    html?: string,
    errors?: string[],
    store?: object,
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
    widgets?: [number, IWidgetRendered][],
    exception?: Error
}

export /*bundle*/ const renderer = new class {
    async render(_uri: string, language: string): Promise<IPageRendered> {
        let wid = 0; // The widget id
        const widgets: Map<number, IWidgetRendered> = new Map();

        const {page, error, redirected, uri} = await routing.page(_uri);
        if (redirected) return {redirected};
        if (error) return {errors: [error]};
        if (page.parents.error) return {errors: [page.parents.error]};

        const process = async (element: string, context?: WidgetContext) => {
            const id = wid++;

            const done = (data: IWidgetRendered) => {
                const attributes = context?.attributes ? [...context.attributes] : void 0;
                widgets.set(id, Object.assign({element, attributes}, data));
            }

            let {html, errors, css, store} = await renderWidget(element, context, language);
            if (errors?.length) return done({errors});

            // Find child widgets
            const $ = cheerio.load(html);
            for (const widget of beyond.widgets.values()) {
                const element = $(widget.name);
                if (!element.length) continue;

                const attributes = new Map();
                widget.attrs?.forEach(attr => attributes.set(attr, element.attr(attr)));

                await process(widget.name, {attributes});
            }

            done({html, css, store});
        }

        // Render the application main layout
        const main = beyond.application.layout;
        main && await process(main);

        const {element} = page;
        await process(element, {uri});

        const parents: string[] = page.parents.value.map(parent => parent.element);
        for (const element of parents) {
            await process(element);
        }

        return {main, page: {element, parents}, widgets: [...widgets]};
    }
}
