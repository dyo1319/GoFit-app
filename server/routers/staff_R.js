const express = require('express');
const router = express.Router();
const { validate, staffUpdateAccessSchema } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth_Mid');
const { requirePermission} = require('../middleware/permission_Mid');

function safeParseJSON(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') return v; 
  const s = String(v).trim();
  if (s === '' || s.toLowerCase() === 'null') return null;
  if (s.startsWith('[') || s.startsWith('{') || s.startsWith('"')) {
    try { return JSON.parse(s); } catch { /* ignore */ }
  }
  return null;
}


router.get('/', verifyToken, requirePermission('manage_staff_roles'), async (req, res) => {
  try {
    const db = global.db_pool.promise();
    const [rows] = await db.query(`
     SELECT id, username, phone, role, access_profile,
       CAST(permissions_json AS CHAR) AS permissions_json
      FROM users
      WHERE role IN ('trainer','admin')
      ORDER BY role, id
    `);
    const items = rows.map(r => ({
      ...r,
      permissions_json: safeParseJSON(r.permissions_json)
    }));
    res.json({ items });
  } catch (e) {
    console.error('GET /staff error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me/effective', verifyToken, async (req, res) => {
  const db = global.db_pool.promise();
  try {
    const id = Number(req.user.userId);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid auth context' });
    }

    const [rows] = await db.query(
      `SELECT id, username, phone, role, access_profile,
              CAST(permissions_json AS CHAR) AS permissions_json
       FROM users
       WHERE id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    let effective = [];

    if (user.access_profile === 'custom') {
      const arr = safeParseJSON(user.permissions_json) || [];
      effective = Array.isArray(arr) ? arr : [];
    } else if (user.access_profile === 'default') {
      const [presetRows] = await db.query(
        `SELECT perm_key FROM role_presets WHERE role = ?`,
        [user.role]
      );
      effective = presetRows.map(r => r.perm_key);
    } else if (user.access_profile === 'readonly') {
      const [roRows] = await db.query(
        `SELECT rp.perm_key
           FROM role_presets rp
           JOIN permissions_catalog pc ON pc.perm_key = rp.perm_key
         WHERE rp.role = ? AND pc.is_readonly_safe = 1`,
        [user.role]
      );
      effective = roRows.map(r => r.perm_key);
    } else {
      return res.status(400).json({ error: 'Unknown access_profile' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      access_profile: user.access_profile,
      effective_permissions: effective
    });
  } catch (e) {
    console.error('GET /staff/me/effective error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:id/effective', verifyToken, requirePermission('manage_permissions'), async (req, res) => {
  const db = global.db_pool.promise();
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const [rows] = await db.query(
      `SELECT id, username, phone, role, access_profile,
              CAST(permissions_json AS CHAR) AS permissions_json
       FROM users
       WHERE id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    const profile = user.access_profile;
    const role = user.role;

    let effective = [];

    if (profile === 'custom') {
      const arr = safeParseJSON(user.permissions_json) || [];
      effective = Array.isArray(arr) ? arr : [];
    } else if (profile === 'default') {
      const [presetRows] = await db.query(
        `SELECT perm_key FROM role_presets WHERE role = ?`,
        [role]
      );
      effective = presetRows.map(r => r.perm_key);
    } else if (profile === 'readonly') {
      const [roRows] = await db.query(
        `SELECT rp.perm_key
           FROM role_presets rp
           JOIN permissions_catalog pc ON pc.perm_key = rp.perm_key
         WHERE rp.role = ? AND pc.is_readonly_safe = 1`,
        [role]
      );
      effective = roRows.map(r => r.perm_key);
    } else {
      return res.status(400).json({ error: 'Unknown access_profile' });
    }

    res.json({
      id: user.id,
      username: user.username,
      role,
      access_profile: profile,
      effective_permissions: effective
    });
  } catch (e) {
    console.error('GET /staff/:id/effective error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/access', verifyToken, async (req, res, next) => {
  try {
    const db = global.db_pool.promise();
    
    const [userRows] = await db.query(
      `SELECT role, access_profile, CAST(permissions_json AS CHAR) AS permissions_json 
       FROM users WHERE id = ?`,
      [req.user.userId]
    );
    
    if (!userRows.length) {
      return res.status(403).json({ error: 'User not found' });
    }

    const user = userRows[0];
    let effectivePermissions = [];

    if (user.access_profile === 'custom') {
      const customPerms = safeParseJSON(user.permissions_json) || [];
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

    const hasStaffRolesPermission = effectivePermissions.includes('manage_staff_roles');
    const hasManagePermissions = effectivePermissions.includes('manage_permissions');

    if (!hasStaffRolesPermission && !hasManagePermissions) {
      return res.status(403).json({ 
        error: 'Insufficient permissions. Required: manage_staff_roles OR manage_permissions' 
      });
    }

    const { role, access_profile, permissions_json } = req.body;
    
    if (role !== undefined && !hasStaffRolesPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to change roles. Required: manage_staff_roles' 
      });
    }

    if ((access_profile !== undefined || permissions_json !== undefined) && !hasManagePermissions) {
      return res.status(403).json({ 
        error: 'Insufficient permissions to change access profiles. Required: manage_permissions' 
      });
    }

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    return res.status(500).json({ error: 'Permission check failed' });
  }
}, validate(staffUpdateAccessSchema), async (req, res) => {
  const conn = await global.db_pool.promise().getConnection();
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { role, access_profile, permissions_json } = req.body;

    if (access_profile === 'custom') {
      const keys = permissions_json || [];
      if (!keys.length) return res.status(400).json({ error: 'permissions_json is required for custom' });
      
      const placeholders = keys.map(() => '?').join(',');
      const [valid] = await conn.query(
        `SELECT perm_key FROM permissions_catalog WHERE perm_key IN (${placeholders})`,
        keys
      );
      if (valid.length !== keys.length) {
        return res.status(400).json({ error: 'Unknown permission in permissions_json' });
      }
    }

    const updates = [];
    const values = [];
    
    if (role !== undefined) { 
      updates.push('role = ?'); 
      values.push(role); 
    }
    if (access_profile !== undefined) { 
      updates.push('access_profile = ?'); 
      values.push(access_profile); 
    }
    if (permissions_json !== undefined) { 
      updates.push('permissions_json = CAST(? AS JSON)'); 
      values.push(JSON.stringify(permissions_json)); 
    }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    
    const [upd] = await conn.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (!upd.affectedRows) return res.status(404).json({ error: 'User not found' });

    const [userRows] = await conn.query(
      `SELECT id, username, phone, role, access_profile,
              CAST(permissions_json AS CHAR) AS permissions_json
       FROM users WHERE id = ?`, 
      [id]
    );
    const user = userRows[0];
    user.permissions_json = safeParseJSON(user.permissions_json);
    res.json({ ok: true, id, user });
  } catch (e) {
    console.error('PUT /staff/:id/access error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
