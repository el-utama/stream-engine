// AES-256-GCM Encryption for OAuth Tokens
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
const scryptAsync = promisify(scrypt);
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
export class EncryptionService {
    masterKey;
    constructor(masterKeyB64) {
        this.masterKey = Buffer.from(masterKeyB64, 'base64');
        if (this.masterKey.length !== KEY_LENGTH) {
            throw new Error('Master key must be 32 bytes (base64 encoded)');
        }
    }
    async encrypt(plaintext) {
        const salt = randomBytes(SALT_LENGTH);
        const iv = randomBytes(IV_LENGTH);
        const key = await scryptAsync(this.masterKey, salt, KEY_LENGTH);
        const cipher = createCipheriv(ALGORITHM, key, iv);
        const ciphertext = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final()
        ]);
        const authTag = cipher.getAuthTag();
        // Format: salt:iv:authTag:ciphertext (all base64)
        return [
            salt.toString('base64'),
            iv.toString('base64'),
            authTag.toString('base64'),
            ciphertext.toString('base64')
        ].join(':');
    }
    async decrypt(encrypted) {
        const parts = encrypted.split(':');
        if (parts.length !== 4) {
            throw new Error('Invalid encrypted format');
        }
        const [saltB64, ivB64, authTagB64, ciphertextB64] = parts;
        const salt = Buffer.from(saltB64, 'base64');
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');
        const ciphertext = Buffer.from(ciphertextB64, 'base64');
        const key = await scryptAsync(this.masterKey, salt, KEY_LENGTH);
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const plaintext = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final()
        ]);
        return plaintext.toString('utf8');
    }
}
// Singleton factory
let encryptionInstance = null;
export function createEncryptionService(masterKeyB64) {
    return new EncryptionService(masterKeyB64);
}
export function getEncryptionService() {
    if (!encryptionInstance) {
        throw new Error('EncryptionService not initialized. Call createEncryptionService first.');
    }
    return encryptionInstance;
}
export function setEncryptionService(instance) {
    encryptionInstance = instance;
}
//# sourceMappingURL=encryption.js.map