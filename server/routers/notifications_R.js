const express = require('express');
const router = express.Router();

// Input validation middleware
const validateNotificationQuery = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '10', 10)));
  const query = (req.query.query || '').trim();
  const type = (req.query.type || '').trim();
  const onlyUnread = req.query.onlyUnread === '1';

  // Validate type if provided
  if (type && !['info', 'warning', 'error', 'success'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid notification type' 
    });
  }

  req.validatedQuery = { page, pageSize, query, type, onlyUnread };
  next();
};

// GET /notifications - Get notifications with pagination and filtering
router.get('/', validateNotificationQuery, async (req, res) => {
  try {
    console.log('Fetching notifications with query:', req.validatedQuery);
    
    const { page, pageSize, query, type, onlyUnread } = req.validatedQuery;

    // Use global.db_pool like other files
    const db = global.db_pool.promise();

    const whereConditions = ['1=1']; // Start with always true condition
    const queryParams = [];

    if (query) {
      whereConditions.push('(title LIKE ? OR message LIKE ?)');
      queryParams.push(`%${query}%`, `%${query}%`);
    }
    
    if (type) {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }
    
    if (onlyUnread) {
      whereConditions.push('read_at IS NULL');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const [cntRows] = await db.query(
      `SELECT COUNT(*) AS total FROM notifications ${whereClause}`,
      queryParams
    );

    console.log('Total count result:', cntRows);

    // Get paginated results
    const [rows] = await db.query(
      `SELECT 
        id, audience, user_id, title, message, type, 
        read_at, created_at, updated_at
       FROM notifications 
       ${whereClause}
       ORDER BY 
         CASE WHEN read_at IS NULL THEN 0 ELSE 1 END,
         created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, pageSize, (page - 1) * pageSize]
    );

    console.log('Fetched rows:', rows.length);

    res.json({ 
      success: true, 
      data: { 
        items: rows, 
        total: cntRows[0]?.total || 0,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil((cntRows[0]?.total || 0) / pageSize)
        }
      } 
    });
  } catch (error) {
    console.error('GET /notifications error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// POST /notifications/:id/read - Mark notification as read
router.post('/:id/read', async (req, res) => {
  try {
    const db = global.db_pool.promise();
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid notification ID' 
      });
    }

    const [result] = await db.query(
      `UPDATE notifications 
       SET read_at = IFNULL(read_at, NOW()), 
           updated_at = NOW() 
       WHERE id = ? AND audience = 'admin'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.json({ 
      success: true, 
      affected: result.affectedRows,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('POST /notifications/:id/read error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notification as read' 
    });
  }
});

// DELETE /notifications/:id - Delete specific notification
router.delete('/:id', async (req, res) => {
  try {
    const db = global.db_pool.promise();
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid notification ID' 
      });
    }

    const [result] = await db.query(
      `DELETE FROM notifications 
       WHERE id = ? AND audience = 'admin'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.json({ 
      success: true, 
      affected: result.affectedRows,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /notifications/:id error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete notification' 
    });
  }
});

// POST /notifications/read-all - Mark all notifications as read
router.post('/read-all', async (req, res) => {
  try {
    const db = global.db_pool.promise();
    const [result] = await db.query(
      `UPDATE notifications 
       SET read_at = NOW(), 
           updated_at = NOW() 
       WHERE audience = 'admin' AND read_at IS NULL`
    );

    res.json({ 
      success: true, 
      affected: result.affectedRows,
      message: `Marked ${result.affectedRows} notifications as read`
    });
  } catch (error) {
    console.error('POST /notifications/read-all error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark all notifications as read' 
    });
  }
});

// DELETE /notifications - Clear all notifications
router.delete('/', async (req, res) => {
  try {
    const db = global.db_pool.promise();
    const [result] = await db.query(
      `DELETE FROM notifications WHERE audience = 'admin'`
    );

    res.json({ 
      success: true, 
      affected: result.affectedRows,
      message: `Deleted ${result.affectedRows} notifications`
    });
  } catch (error) {
    console.error('DELETE /notifications error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear notifications' 
    });
  }
});

module.exports = router;