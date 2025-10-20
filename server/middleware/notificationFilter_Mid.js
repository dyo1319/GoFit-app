
function setNotificationBaseQuery(req, res, next) {
  const { audience = 'user' } = req.validatedQuery || {};
  
  const whereConditions = [];
  const queryParams = [];

  if (req.user.role === 'admin') {
    if (audience === 'admin') {
      whereConditions.push('(audience = ? OR audience IS NULL)');
      queryParams.push('admin');
    } else if (audience === 'user') {
      whereConditions.push('audience = ?');
      queryParams.push('user');
    }
  } else {
    whereConditions.push('(user_id = ? OR (audience = ? AND user_id IS NULL))');
    queryParams.push(req.user.userId, 'user');
  }

  req.notificationBaseConditions = whereConditions;
  req.notificationBaseParams = queryParams;
  
  next();
}

function buildNotificationQuery(req, res, next) {
  const { query, type, onlyUnread } = req.validatedQuery || {};
  
  const whereConditions = [...req.notificationBaseConditions];
  const queryParams = [...req.notificationBaseParams];

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

  req.notificationWhereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';
  
  req.notificationQueryParams = queryParams;
  
  next();
}


function validateNotificationOwnership(req, res, next) {
  const notificationId = parseInt(req.params.id, 10);
  
  if (isNaN(notificationId) || notificationId <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid notification ID' 
    });
  }

  req.notificationId = notificationId;
  
  if (req.user.role === 'admin') {
    return next();
  }

  const db = global.db_pool.promise();
  
  db.query(
    `SELECT id FROM notifications 
     WHERE id = ? AND (user_id = ? OR audience = ?)`,
    [notificationId, req.user.userId, 'user']
  )
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Notification not found or access denied' 
        });
      }
      next();
    })
    .catch(error => {
      console.error('Notification ownership validation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to validate notification access' 
      });
    });
}


function getNotificationStats(req, res, next) {
  const db = global.db_pool.promise();
  
  let statsQuery, statsParams;

  if (req.user.role === 'admin') {
    statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN type = 'info' THEN 1 ELSE 0 END) as info,
        SUM(CASE WHEN type = 'warning' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN type = 'error' THEN 1 ELSE 0 END) as error,
        SUM(CASE WHEN type = 'success' THEN 1 ELSE 0 END) as success
      FROM notifications 
      WHERE audience = 'admin' OR audience IS NULL
    `;
    statsParams = [];
  } else {
    statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN type = 'info' THEN 1 ELSE 0 END) as info,
        SUM(CASE WHEN type = 'warning' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN type = 'error' THEN 1 ELSE 0 END) as error,
        SUM(CASE WHEN type = 'success' THEN 1 ELSE 0 END) as success
      FROM notifications 
      WHERE user_id = ? OR (audience = 'user' AND user_id IS NULL)
    `;
    statsParams = [req.user.userId];
  }

  db.query(statsQuery, statsParams)
    .then(([stats]) => {
      req.notificationStats = stats[0] || {
        total: 0,
        unread: 0,
        info: 0,
        warning: 0,
        error: 0,
        success: 0
      };
      next();
    })
    .catch(error => {
      console.error('Notification stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification statistics'
      });
    });
}


function executeNotificationQuery(req, res, next) {
  const { page = 1, pageSize = 10 } = req.validatedQuery || {};
  const db = global.db_pool.promise();

  const offset = (page - 1) * pageSize;

  db.query(
    `SELECT COUNT(*) AS total FROM notifications ${req.notificationWhereClause}`,
    req.notificationQueryParams
  )
    .then(([cntRows]) => {
      const total = cntRows[0]?.total || 0;

      return db.query(
        `SELECT 
          id, audience, user_id, title, message, type, 
          read_at, created_at, updated_at
         FROM notifications 
         ${req.notificationWhereClause}
         ORDER BY 
           CASE WHEN read_at IS NULL THEN 0 ELSE 1 END,
           created_at DESC
         LIMIT ? OFFSET ?`,
        [...req.notificationQueryParams, pageSize, offset]
      )
        .then(([rows]) => {
          req.notificationResults = {
            items: rows,
            total,
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              totalPages: Math.ceil(total / pageSize)
            }
          };
          next();
        });
    })
    .catch(error => {
      console.error('Notification query execution error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notifications',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    });
}

module.exports = {
  setNotificationBaseQuery,
  buildNotificationQuery,
  validateNotificationOwnership,
  getNotificationStats,
  executeNotificationQuery
};