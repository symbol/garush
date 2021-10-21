import * as _ from 'lodash';

export class Utils {
    /**
     * It concats a list of Uint8Array into a new one.
     *
     * @param arrays - the Uint8Array to concat.
     */
    public static concat(...arrays: Uint8Array[]): Uint8Array {
        const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
        const result = new Uint8Array(totalLength);
        let length = 0;
        for (const array of arrays) {
            result.set(array, length);
            length += array.length;
        }
        return result;
    }

    public static arraysEqual(a: Uint8Array | unknown[], b: Uint8Array | unknown[]): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    public static getMessageFromError(error: any): string {
        let message = error.message || error.toString();
        try {
            if (message) {
                const parsedMessage = JSON.parse(message);
                const parsedBody = JSON.parse(parsedMessage.body);
                message = parsedBody.message || message;
            }
            return message;
        } catch (anotherError) {
            return error.toString();
        }
    }

    public static split = (content: Uint8Array, maxSize = 1024): Uint8Array[] => {
        return _.chunk(content, maxSize).map((chuck) => Uint8Array.from(chuck));
    };
    public static join = (chunks: Uint8Array[][]): Promise<Uint8Array> => {
        return Promise.resolve(Utils.concat(..._.flatMap(chunks)));
    };
}
