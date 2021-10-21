export class URLHelpers {
    public static validate(value: string): boolean {
        const regStr =
            '^' + // position at start
            '(https?:\\/\\/)?' + //protocol
            '((([a-zA-Z\\d]{1,}([-\\.]{1}[a-zA-Z\\d]{1,})*\\.[a-zA-Z]+)' + // domain name
            '|((\\d{1,3}\\.){3}\\d{1,3}))' + // ip(v4) address
            '(\\:\\d+)?)' + // port
            '|localhost\\:\\d+'; // localhost:8080
        const pattern = new RegExp(regStr, 'i');
        return pattern.test(value);
    }
    public static httpToWsUrl = (url: string): string => {
        if (URLHelpers.validate(url)) {
            return url.replace('http', 'ws');
        } else {
            throw new Error(`Not a valid url ${url}`);
        }
    };
}
