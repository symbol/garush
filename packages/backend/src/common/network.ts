export enum Network {
    GARUSH = 1,
    SYMBOL = 2,
}

export function getName(network: Network): string {
    return Object.entries(Network)
        .filter(([k, v]) => v === network)
        .map(([k]) => k)[0]
        .toLowerCase();
}
