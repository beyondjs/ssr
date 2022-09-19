import {beyond, BeyondWidgetControllerSSR} from '@beyond-js/kernel/core/ts';
import {URI} from '@beyond-js/kernel/routing/ts';

export interface WidgetContext {
    uri?: URI,
    attributes?: Map<string, string>
}

export async function renderWidget(element: string, context: WidgetContext, language: string) {
    if (!beyond.widgets.has(element)) {
        return {errors: [`Widget element "${element}" is not registered`]};
    }

    const specs = beyond.widgets.get(element);
    const bundle = await beyond.import(specs.id);

    const {Controller} = bundle;
    if (!Controller || typeof Controller !== 'function') {
        return {errors: [`Widget "${element}" does not export its Controller`]};
    }

    try {
        const controller: BeyondWidgetControllerSSR = new Controller({specs});
        const store = controller.createStore?.(language);
        await store?.fetch();

        const css = controller.styles
            .filter(styles => styles.external)
            .map(styles => styles.bundle.pathname);

        const {html, errors} = controller.render(Object.assign({}, context, {store}));
        return {html, errors, css, store};
    } catch (exc) {
        console.error(exc.stack);
        return {errors: exc.message};
    }
}
