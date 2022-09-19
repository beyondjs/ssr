import {createServer} from 'http';
import listener from './listener';

export /*bundle*/
class SSRServer {
    constructor(pkg: string, port: number) {
        !(<any>globalThis).__app_package && ((<any>globalThis).__app_package = pkg);

        const server = createServer(listener);
        server.listen(port);

        typeof process.send === 'function' && process.send({type: 'ready'});
    }
}
