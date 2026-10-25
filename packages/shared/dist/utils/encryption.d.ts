export declare class EncryptionService {
    private masterKey;
    constructor(masterKeyB64: string);
    encrypt(plaintext: string): Promise<string>;
    decrypt(encrypted: string): Promise<string>;
}
export declare function createEncryptionService(masterKeyB64: string): EncryptionService;
export declare function getEncryptionService(): EncryptionService;
export declare function setEncryptionService(instance: EncryptionService): void;
//# sourceMappingURL=encryption.d.ts.map