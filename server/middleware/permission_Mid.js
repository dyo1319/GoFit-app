function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    try {
      const db = global.db_pool.promise();
      const userId = req.user?.userId ?? req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const [userRows] = await db.query(
        `SELECT role, access_profile, CAST(permissions_json AS CHAR) AS permissions_json 
         FROM users WHERE id = ?`,
        [userId]
      );
      
      if (!userRows.length) {
        return res.status(403).json({ success: false, error: 'User not found' });
      }

      const user = userRows[0];
      let effectivePermissions = [];

      if (user.access_profile === 'custom') {
        const customPerms = JSON.parse(user.permissions_json || '[]');
        effectivePermissions = Array.isArray(customPerms) ? customPerms : [];
      } else if (user.access_profile === 'default') {
        const [presetRows] = await db.query(
          `SELECT perm_key FROM role_presets WHERE role = ?`,
          [user.role]
        );
        effectivePermissions = presetRows.map(row => row.perm_key);
      } else if (user.access_profile === 'readonly') {
        const [roRows] = await db.query(
          `SELECT rp.perm_key
           FROM role_presets rp
           JOIN permissions_catalog pc ON pc.perm_key = rp.perm_key
           WHERE rp.role = ? AND pc.is_readonly_safe = 1`,
          [user.role]
        );
        effectivePermissions = roRows.map(row => row.perm_key);
      }

      if (!effectivePermissions.includes(permission)) {
        return res.status(403).json({ 
          success: false, 
          error: `Insufficient permissions. Required: ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ success: false, error: 'Permission check failed' });
    }
  };
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

module.exports = { requirePermission, requireAdmin };
