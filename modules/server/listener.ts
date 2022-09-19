import {IncomingMessage, ServerResponse} from 'http';
import {URL} from 'url';
import render from './render';
import {URI} from '@beyond-js/kernel/routing';
import {Route, PageURI} from '@beyond-js/widgets/routing';

const process = async function (rq: IncomingMessage, response: ServerResponse) {
    const url = new URL(rq.url, 'void://foo');

    let language = url.searchParams.get('language');
    language = language ? language.slice(0, 2) : void 0;

    let content: any;
    switch (url.pathname) {
        case '/page': {
            const uri = url.searchParams.get('uri');
            content = await render.page(uri, language);
            break;
        }
        case '/widget': {
            const name = url.searchParams.get('name');

            const {uri, errors}: { uri?: PageURI, errors?: string[] } = await (async () => {
                if (!url.searchParams.has('uri')) return {};
                const param = url.searchParams.get('uri');

                const uri = new URI(param);
                const route = new Route(uri.pathname);
                await route.process();
                return route.page ? {uri: new PageURI({uri, route})} : {errors: [`URI "${uri.pathname}" not found`]};
            })();
            if (errors) return {errors};

            const attrs: Map<string, string> = (() => {
                const param = url.searchParams.get('attrs');
                if (!param) return;
                const names = new Set(param.split(','));

                const attrs = new Map();
                names.forEach(attr => {
                    const value = url.searchParams.get(`attrs.${attr}`);
                    attrs.set(attr, value);
                });
                return attrs;
            })();

            content = await render.widget({name, attrs, language, uri});
            break;
        }
        case '/store': {
            const widget = url.searchParams.get('pathname');
            const attrs = url.searchParams.get('attrs');
            content = await render.store(widget, language);
            break;
        }
        default:
            content = {errors: [`Endpoint "${rq.url}" not found`]};
    }

    try {
        const output = JSON.stringify(content);

        response.setHeader('Access-Control-Allow-Origin', '*');
        response.writeHead((<any>content).errors?.length ? 500 : 200, {
            'Content-Type': 'application/json',
            'Content_Length': output.length
        });
        response.write(output);
    } catch (exc) {
        console.log(exc.stack);
    } finally {
        response.end();
    }
}

export default function (rq: IncomingMessage, response: ServerResponse) {
    process(rq, response).catch(exc => console.log(exc.stack));
}
