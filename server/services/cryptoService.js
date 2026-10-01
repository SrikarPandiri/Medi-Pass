/**
 * @file server/services/cryptoService.js
 * @description Cryptographic primitives for hashing, key wrapping, and integrity checks.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class CryptoService {
  /**
   * Hashes plain text password or PIN
   */
  static async hash(plainText, saltRounds = 10) {
    return bcrypt.hash(plainText, saltRounds);
  }

  /**
   * Compares plain text against bcrypt hash
   */
  static async compare(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  }

  /**
   * Generates a 6-digit numeric OTP
   */
  static generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Computes SHA-256 hex digest
   */
  static sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Secure random string generator
   */
  static randomString(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }
}

export default CryptoService;
