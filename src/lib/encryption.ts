// Enterprise-grade encryption utilities for credential vault
// Uses AES-256 encryption via crypto-js for at-rest encryption of sensitive data

import CryptoJS from 'crypto-js';

const DEFAULT_KEY = 'mc-vault-2026-default-key';

function getEncryptionKey(): string {
    try {
        return localStorage.getItem('mc-encryption-key') || DEFAULT_KEY;
    } catch {
        return DEFAULT_KEY;
    }
}

export function encrypt(plainText: string, customKey?: string): string {
    if (!plainText) return '';
    const key = customKey || getEncryptionKey();
    return CryptoJS.AES.encrypt(plainText, key).toString();
}

export function decrypt(cipherText: string, customKey?: string): string {
    if (!cipherText) return '';
    try {
        const key = customKey || getEncryptionKey();
        const bytes = CryptoJS.AES.decrypt(cipherText, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
        return cipherText; // Return original if decryption fails (e.g., not encrypted)
    }
}

export function setEncryptionKey(key: string): void {
    localStorage.setItem('mc-encryption-key', key);
}

export function hasCustomEncryptionKey(): boolean {
    return !!localStorage.getItem('mc-encryption-key');
}

export function generateStrongKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Hash for comparing without exposing raw values
export function hash(value: string): string {
    return CryptoJS.SHA256(value).toString();
}
