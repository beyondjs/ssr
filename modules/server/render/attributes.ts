export class WidgetAttributes extends Map {
    constructor(attrs: Map<string, string>) {
        super();
        attrs?.forEach((value, key) => this.set(key, value));
    }

    on(event: string, listener: string) {
        void (event);
        void (listener);
    }

    off(event: string, listener: string) {
        void (event);
        void (listener);
    }
}