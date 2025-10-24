const MAX_PAGE_SIZE = 200;

async function listInvoices(req, res) {
  try {
    const db = global.db_pool.promise();
    const {
      page = 1,
      pageSize = 10,
      query = '',
      status = '',
      sort = 'created_at:desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSize, 10) || 10));
    const offset = (pageNum - 1) * pageSizeNum;

    const [sortField, sortDir] = sort.split(':');
    const orderBy = sortField || 'created_at';
    const orderDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

    const where = [];
    const params = [];

    if (query) {
      where.push('(u.username LIKE ? OR u.phone LIKE ? OR i.invoice_number LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (status) {
      where.push('i.status = ?');
      params.push(status);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [cntRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM invoices i
       JOIN users u ON u.id = i.user_id
       ${whereSQL}`,
      params
    );
    const total = cntRows[0]?.total || 0;

    const [rows] = await db.query(
      `SELECT
        i.id, i.invoice_number, i.amount, i.tax_amount, i.total_amount,
        i.status, DATE_FORMAT(i.due_date, '%Y-%m-%d') AS due_date, i.paid_at, i.payment_method,
        DATE_FORMAT(i.created_at, '%Y-%m-%d') AS created_at,
        u.username, u.phone
       FROM invoices i
       JOIN users u ON u.id = i.user_id
       ${whereSQL}
       ORDER BY i.${orderBy} ${orderDirection}
       LIMIT ${pageSizeNum} OFFSET ${offset}`,
      params
    );

    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function getInvoice(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [rows] = await db.query(
      `SELECT
        i.id, i.invoice_number, i.amount, i.tax_amount, i.total_amount,
        i.status, DATE_FORMAT(i.due_date, '%Y-%m-%d') AS due_date, i.paid_at, i.payment_method, i.notes,
        DATE_FORMAT(i.created_at, '%Y-%m-%d') AS created_at,
        u.username, u.phone, u.birth_date, u.gender,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date, s.plan_name, s.price
       FROM invoices i
       JOIN users u ON u.id = i.user_id
       LEFT JOIN subscriptions s ON s.id = i.subscription_id
       WHERE i.id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'חשבונית לא נמצאה' });
    }

    const [items] = await db.query(
      `SELECT description, quantity, unit_price, total_price
       FROM invoice_items
       WHERE invoice_id = ?`,
      [id]
    );

    res.json({ 
      data: {
        ...rows[0],
        items
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function createInvoice(req, res) {
  try {
    const db = global.db_pool.promise();
    const {
      subscription_id,
      user_id,
      amount,
      tax_amount = 0,
      due_date,
      notes = '',
      items = []
    } = req.body;

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const totalAmount = parseFloat(amount) + parseFloat(tax_amount);

    const [ins] = await db.query(
      `INSERT INTO invoices (subscription_id, user_id, invoice_number, amount, tax_amount, total_amount, due_date, notes) 
       VALUES (?,?,?,?,?,?,?,?)`,
      [subscription_id, user_id, invoiceNumber, amount, tax_amount, totalAmount, due_date, notes]
    );

    const invoiceId = ins.insertId;

    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) 
           VALUES (?,?,?,?,?)`,
          [invoiceId, item.description, item.quantity, item.unit_price, item.total_price]
        );
      }
    }

    res.status(201).json({ 
      success: true,
      message: 'חשבונית נוצרה בהצלחה',
      data: { id: invoiceId, invoice_number: invoiceNumber }
    });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function updateInvoiceStatus(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'סטטוס לא תקין' });
    }

    const updateData = { status };
    if (status === 'paid') {
      updateData.paid_at = new Date();
    }

    const [result] = await db.query(
      `UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?`,
      [status, updateData.paid_at, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'חשבונית לא נמצאה' });
    }

    res.json({ 
      success: true,
      message: 'סטטוס החשבונית עודכן בהצלחה'
    });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function generateInvoiceFromSubscription(req, res) {
  try {
    const db = global.db_pool.promise();
    const { subscription_id } = req.body;

    const [subRows] = await db.query(
      `SELECT s.*, u.username, u.phone
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
      [subscription_id]
    );

    if (!subRows.length) {
      return res.status(404).json({ error: 'מנוי לא נמצא' });
    }

    const subscription = subRows[0];
    
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const [ins] = await db.query(
      `INSERT INTO invoices (subscription_id, user_id, invoice_number, amount, tax_amount, total_amount, due_date, notes) 
       VALUES (?,?,?,?,?,?,?,?)`,
      [subscription_id, subscription.user_id, invoiceNumber, subscription.price, 0, subscription.price, dueDate, `חשבונית עבור ${subscription.plan_name}`]
    );

    const invoiceId = ins.insertId;

    await db.query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) 
       VALUES (?,?,?,?,?)`,
      [invoiceId, subscription.plan_name, 1, subscription.price, subscription.price]
    );

    res.status(201).json({ 
      success: true,
      message: 'חשבונית נוצרה אוטומטית',
      data: { id: invoiceId, invoice_number: invoiceNumber }
    });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoiceStatus,
  generateInvoiceFromSubscription
};
