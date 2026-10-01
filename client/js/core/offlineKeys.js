/**
 * @file client/js/core/offlineKeys.js
 * @description Local ECDSA P-256 asymmetric key generation, offline QR signature issuance,
 * and public key registration for disconnected point-of-care verification.
 */

import { LocalDB } from './idb.js';

export class OfflineKeys {
  /**
   * Generates or retrieves existing ECDSA P-256 key pair
   */
  static async getOrCreateKeyPair() {
    const existing = await LocalDB.get('keys', 'offline_ecdsa_pair');
    if (existing && existing.privateKey && existing.publicKey) {
      return existing;
    }

    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

    const exportedPublic = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);

    const record = {
      key_id: 'offline_ecdsa_pair',
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      publicKeyJwk: exportedPublic,
      created_at: new Date().toISOString()
    };

    await LocalDB.put('keys', record);
    return record;
  }

  /**
   * Creates an offline signed QR payload for emergency/critical summary
   */
  static async signOfflineSummary(patientId, summaryData) {
    const keyPairRecord = await this.getOrCreateKeyPair();
    const payload = {
      patient_id: patientId,
      mode: 'OFFLINE_SUMMARY',
      summary: summaryData,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes valid
    };

    const enc = new TextEncoder();
    const dataStr = JSON.stringify(payload);
    const signature = await window.crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      keyPairRecord.privateKey,
      enc.encode(dataStr)
    );

    const sigBase64 = window.btoa(String.fromCharCode(...new Uint8Array(signature)));
    return {
      payload,
      signature: sigBase64,
      publicKeyJwk: keyPairRecord.publicKeyJwk
    };
  }
}

export default OfflineKeys;
