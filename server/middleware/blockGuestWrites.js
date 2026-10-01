/**
 * @file server/middleware/blockGuestWrites.js
 * @description Hard isolation guard ensuring that Guest Sessions can never modify
 * persistent production tables or trigger external SMS gateways.
 */

export function blockGuestWrites(req, res, next) {
  // If request is from guest, ensure it operates on isolated sandbox only
  if (req.isGuest) {
    if (!req.guestId) {
      return res.status(403).json({
        error: { code: 'GUEST_WRITE_BLOCKED', message: 'Guest mutations without active sandbox are strictly prohibited.' }
      });
    }

    // Attach marker flag to request so repository methods route strictly into memory sandbox
    req.sandboxOnly = true;
  }

  next();
}

export default blockGuestWrites;
