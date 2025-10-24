const MAX_PAGE_SIZE = 200;

async function listPlans(req, res) {
  try {
    const db = global.db_pool.promise();
    const { page = 1, pageSize = 10, active_only = false } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSize, 10) || 10));
    const offset = (pageNum - 1) * pageSizeNum;

    const where = [];
    const params = [];

    if (active_only === 'true') {
      where.push('is_active = ?');
      params.push(1);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [cntRows] = await db.query(
      `SELECT COUNT(*) AS total FROM subscription_plans ${whereSQL}`,
      params
    );
    const total = cntRows[0]?.total || 0;

    const [rows] = await db.query(
      `SELECT 
        id, plan_name, plan_type, price, duration_days, description, is_active,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d') AS updated_at
       FROM subscription_plans 
       ${whereSQL}
       ORDER BY plan_type, price ASC
       LIMIT ${pageSizeNum} OFFSET ${offset}`,
      params
    );

    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function getPlan(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [rows] = await db.query(
      `SELECT 
        id, plan_name, plan_type, price, duration_days, description, is_active,
        DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at,
        DATE_FORMAT(updated_at, '%Y-%m-%d') AS updated_at
       FROM subscription_plans 
       WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'סוג מנוי לא נמצא' });
    }

    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function createPlan(req, res) {
  try {
    const db = global.db_pool.promise();
    const { 
      plan_name, 
      plan_type, 
      price, 
      duration_days, 
      description = '', 
      is_active = true 
    } = req.body;

    const [ins] = await db.query(
      `INSERT INTO subscription_plans (plan_name, plan_type, price, duration_days, description, is_active) 
       VALUES (?,?,?,?,?,?)`,
      [plan_name, plan_type, price, duration_days, description, is_active]
    );

    res.status(201).json({ 
      success: true,
      message: 'סוג מנוי נוצר בהצלחה',
      data: { id: ins.insertId } 
    });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function updatePlan(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;
    const updates = [];
    const params = [];

    const allowedFields = ['plan_name', 'plan_type', 'price', 'duration_days', 'description', 'is_active'];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'לא הועברו שדות לעדכון' });
    }

    params.push(id);

    const [result] = await db.query(
      `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'סוג מנוי לא נמצא' });
    }

    res.json({ 
      success: true,
      message: 'סוג מנוי עודכן בהצלחה' 
    });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function deletePlan(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [activeSubs] = await db.query(
      'SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ? AND cancelled_at IS NULL',
      [id]
    );

    if (activeSubs[0].count > 0) {
      return res.status(409).json({ 
        error: 'לא ניתן למחוק סוג מנוי שיש לו מנויים פעילים' 
      });
    }

    const [result] = await db.query(
      'DELETE FROM subscription_plans WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'סוג מנוי לא נמצא' });
    }

    res.json({ 
      success: true,
      message: 'סוג מנוי נמחק בהצלחה' 
    });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

module.exports = {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan
};
