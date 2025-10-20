const express = require('express');
const router = express.Router();
const user_Mid = require('../middleware/user_Mid');
const { validate, userCreateSchema, userUpdateSchema, userSearchSchema, idParamSchema } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth_Mid'); 
const { requirePermission } = require('../middleware/permission_Mid'); 

router.get('/search', verifyToken, requirePermission('view_users'), validate(userSearchSchema, 'query'), user_Mid.search);

router.post('/Add', verifyToken, requirePermission('create_users'), validate(userCreateSchema), user_Mid.AddUser);

router.put('/Update/:id', verifyToken, requirePermission('edit_users'), validate(idParamSchema, 'params'), validate(userUpdateSchema), user_Mid.UpdateUser);

router.delete('/Delete/:id', verifyToken, requirePermission('delete_users'), validate(idParamSchema, 'params'), user_Mid.DeleteUser);

router.get('/list', verifyToken, requirePermission('view_users'), user_Mid.GetAllUsers, (req, res) => {
    return res.json({
      success: true,
      data: req.users_data || [],
      total_rows: req.total_rows ?? 0,
      total_pages: req.total_pages ?? 0,
    });
  }
);

router.get('/:id', verifyToken, requirePermission('view_users'), validate(idParamSchema, 'params'), user_Mid.GetOneUser, (req, res) => {
    if (req.one_user_error) {
      return res.status(req.one_user_error.status).json({ success: false, message: req.one_user_error.message });
    }
    return res.json({
      success: true,
      data: {
        user:         req.one_user_data || null,
        bodydetails:  req.one_user_body || null,
        subscription: req.one_user_subscription || null,
      }
    });
  }
);

module.exports = router;