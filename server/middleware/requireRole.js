/**
 * @file server/middleware/requireRole.js
 * @description Role authorization guard ensuring requested endpoint matches authenticated role.
 */

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const currentRole = req.user?.role || req.doctor?.role || req.guestRole;

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Endpoint requires one of roles: [${allowedRoles.join(', ')}]`
        }
      });
    }

    next();
  };
}

export default requireRole;
