import {widgets, IWidgetSpecs} from '@beyond-js/widgets/render';
import type {IWidgetStore, WidgetServerController} from '@beyond-js/widgets/controller';
import type {PageURI} from '@beyond-js/widgets/routing';
import {WidgetAttributes} from './attributes';

declare const bimport: (resource: string, version?: number) => Promise<any>;

export interface IWidgetRenderSpecs {
    name: string,
    language: string,
    uri?: PageURI,
    attrs?: Map<string, any>
}

interface IResponse {
    html?: string,
    css?: string,
    store?: IWidgetStore,
    specs?: IWidgetSpecs,
    errors?: string[],
    warnings?: string[]
}

export default async function (specs: IWidgetRenderSpecs): Promise<IResponse> {
    if (!widgets.has(specs.name)) {
        return {errors: [`Widget "${specs.name}" not found`]};
    }

    const widget = widgets.get(specs.name);

    let Controller: any;
    try {
        const specifier = (() => {
            const split = widget.vspecifier.split('/');
            const scope = split[0].startsWith('@') ? split.shift() : void 0;
            const [name] = split.shift().split('@');

            const subpath = split.join('/');
            return (scope ? `${scope}/${name}` : name) + (subpath ? `/${subpath}` : '');
        })();

        // Import the widget controller
        ({Controller} = await bimport(specifier));
        if (!Controller || typeof Controller !== 'function') {
            return {errors: [`Widget "${specs.name}" does not export its Controller`], specs: widget};
        }
    } catch (exc) {
        console.error(exc.stack);
        return {errors: [`Error importing widget "${specs.name}". ${exc.message}`], specs: widget};
    }

    try {
        // Instantiate the controller
        const controller: WidgetServerController = new Controller({specs: widget});

        // Create the store
        const store = controller.createStore?.(specs.language);
        await store?.fetch();

        const attributes = new WidgetAttributes(specs.attrs);

        // Render the widget
        const props: { store: IWidgetStore, attributes: Map<string, string>, uri?: PageURI } = {store, attributes};
        specs.uri && (props.uri = specs.uri);
        const {errors, warnings, html, css} = await controller.render(props);
        return {html, css, errors, warnings, store, specs: widget};
    } catch (exc) {
        console.log(exc.stack);
        return {errors: [`Error rendering "${specs.name}". ${exc.message}`], specs: widget};
    }
}
