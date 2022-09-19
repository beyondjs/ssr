export default async function (widget: string, language: string, attrs?: Map<string, string>): Promise<object> {
    return {value: `The widget store: "${widget}", language: "${language}", attrs: "${attrs}"`};
}
