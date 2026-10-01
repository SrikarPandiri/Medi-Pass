/**
 * @file server/middleware/rateLimit.js
 * @description Express rate limiters for authentication endpoints, AI chat requests,
 * and emergency break-glass invocations.
 */

import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
  }
});

export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'OTP_RATE_LIMIT_EXCEEDED',
      message: 'Too many OTP requests. Please wait a few minutes before retrying.'
    }
  }
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // 60 messages per hour per IP/session
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'CHAT_RATE_LIMIT_EXCEEDED',
      message: 'AI assistant usage limit reached for this hour (30-60 queries/hr). Please try again later.'
    }
  }
});

export const breakGlassLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 emergency triggers per hour per doctor IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'BREAK_GLASS_RATE_LIMIT_EXCEEDED',
      message: 'Emergency break-glass rate limit reached for this session.'
    }
  }
});

export default {
  authLimiter,
  otpLimiter,
  chatLimiter,
  breakGlassLimiter
};
