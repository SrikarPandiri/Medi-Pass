/**
 * @file client/js/core/cryptoClient.js
 * @description Client-side cryptographic engine using Web Crypto API:
 * PBKDF2 key derivation from user PIN, AES-256-GCM record envelope encryption.
 */

export class CryptoClient {
  /**
   * Derives AES-GCM key from patient PIN using PBKDF2
   */
  static async deriveKeyFromPin(pin, salt = 'medipass_salt_val') {
    const enc = new TextEncoder();
    const pinKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      pinKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plaintext data using AES-GCM
   */
  static async encryptData(data, key) {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = enc.encode(typeof data === 'string' ? data : JSON.stringify(data));

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return {
      ciphertext: this.bufferToBase64(ciphertext),
      iv: this.bufferToBase64(iv)
    };
  }

  /**
   * Decrypts ciphertext using AES-GCM
   */
  static async decryptData(encryptedObj, key) {
    const iv = this.base64ToBuffer(encryptedObj.iv);
    const ciphertext = this.base64ToBuffer(encryptedObj.ciphertext);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const str = dec.decode(decrypted);
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  static bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  static base64ToBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default CryptoClient;
