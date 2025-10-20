const express = require('express');
const router = express.Router();
const { validate, roleParamSchema, rbacPutPresetSchema } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth_Mid');
const { requirePermission, requireAdmin } = require('../middleware/permission_Mid'); // UPDATED

router.get('/catalog', verifyToken, requirePermission('manage_permissions'), async (req, res) => {
  try {
    const db = global.db_pool.promise();
    const [rows] = await db.query(`
      SELECT perm_key, is_readonly_safe, description
      FROM permissions_catalog
      ORDER BY perm_key
    `);
    res.json({ items: rows });
  } catch (e) {
    console.error('GET /rbac/catalog error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/presets/:role', verifyToken, requirePermission('manage_permissions'), validate(roleParamSchema, 'params'), async (req, res) => {
    try {
    const db = global.db_pool.promise();
    const role = req.params.role;

    const [presetRows] = await db.query(
      `SELECT perm_key FROM role_presets WHERE role = ?`,
      [role]
    );
    const [readonlyRows] = await db.query(
      `SELECT rp.perm_key
         FROM role_presets rp
         JOIN permissions_catalog pc ON pc.perm_key = rp.perm_key
       WHERE rp.role = ? AND pc.is_readonly_safe = 1`,
      [role]
    );

    res.json({
      role,
      preset: presetRows.map(r => r.perm_key),
      readonly_subset: readonlyRows.map(r => r.perm_key),
    });
  } catch (e) {
    console.error('GET /rbac/presets/:role error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/presets/:role', verifyToken, requireAdmin, validate(roleParamSchema, 'params'), validate(rbacPutPresetSchema), async (req, res) => {
  const conn = await global.db_pool.promise().getConnection();
  try {
    const role = req.params.role;
    const { perm_keys } = req.body;

    await conn.beginTransaction();

    if (perm_keys.length) {
      const placeholders = perm_keys.map(() => '?').join(',');
      const [valid] = await conn.query(
        `SELECT perm_key FROM permissions_catalog WHERE perm_key IN (${placeholders})`,
        perm_keys
      );
      if (valid.length !== perm_keys.length) {
        await conn.rollback();
        return res.status(400).json({ error: 'Unknown permission key(s)' });
      }
    }

    await conn.query(`DELETE FROM role_presets WHERE role = ?`, [role]);

    if (perm_keys.length) {
      const values = perm_keys.map(pk => [role, pk]);
      await conn.query(`INSERT INTO role_presets (role, perm_key) VALUES ?`, [values]);
    }

    await conn.commit();
    res.json({ ok: true, updated: perm_keys.length });
  } catch (e) {
    await conn.rollback();
    console.error('PUT /rbac/presets/:role error:', e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;