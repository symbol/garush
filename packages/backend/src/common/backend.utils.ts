export class BackendUtils {
    public static toOptionalBigInt(uint64: string | undefined): bigint | undefined {
        return uint64 == undefined ? undefined : this.toBigInt(uint64);
    }

    public static fromOptionalBigInt(bigint: bigint | undefined): string | undefined {
        return bigint == undefined ? undefined : this.fromBigInt(bigint);
    }

    public static toBigInt(uint64: string): bigint {
        return BigInt(uint64.toString());
    }

    public static fromBigInt(bigint: bigint): string {
        return bigint.toString();
    }
}
