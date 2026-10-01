/**
 * @file server/middleware/authGuest.js
 * @description Dedicated authentication middleware for guest session tokens.
 */

import { TokenService } from '../services/tokenService.js';
import repository from '../db/repository.js';

export function authGuest(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Guest token required.' }
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = TokenService.verifyGuestToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: { code: 'INVALID_GUEST_TOKEN', message: 'Guest session expired or invalid.' }
    });
  }

  const sandbox = repository.getGuestSandbox(decoded.guest_id);
  if (!sandbox) {
    return res.status(401).json({
      error: { code: 'SANDBOX_NOT_FOUND', message: 'Guest sandbox expired.' }
    });
  }

  req.guestId = decoded.guest_id;
  req.guestRole = decoded.role;
  req.isGuest = true;
  req.sandbox = sandbox;

  next();
}

export default authGuest;
