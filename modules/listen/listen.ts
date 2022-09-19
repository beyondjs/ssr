import {SSRServer} from '@beyond-js/ssr/server';

interface IBeeSpecs {
    id: string,
    engine: string,
    dashboard: boolean,
    project: {
        id: number,
        path: string,
        pkg: string
    },
    distribution: {
        name: string,
        local: boolean,
        platform: string,
        bundles: {
            mode: string
        },
        imports: [string, string][]
    },
    ports: {
        bundles: number,
        server: number,
        http: number
    }
}

export /*bundle*/ function listen(pkg?: string, port?: number): void {
    if (typeof (<any>globalThis).__bee === 'object') {
        const specs: IBeeSpecs = (<any>globalThis).__bee.specs;

        pkg = specs.project.pkg;
        port = specs.ports.http;
    }

    if (!pkg) {
        console.log('Package name parameter must be specified');
        return;
    }

    if (!port) {
        console.log('Port number parameter must be specified');
        return;
    }

    new SSRServer(pkg, port);
}
