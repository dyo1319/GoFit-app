const express = require('express');
const router = express.Router();
const user_Mid = require('../middleware/user_Mid');
const { validate, userCreateSchema, userUpdateSchema, userSearchSchema, idParamSchema } = require('../middleware/validate');

router.get('/search', validate(userSearchSchema, 'query'), user_Mid.search);
router.post('/Add', validate(userCreateSchema), user_Mid.AddUser);
router.put('/users/:id', validate(idParamSchema, 'params'), validate(userUpdateSchema), user_Mid.UpdateUser);
router.delete('/users/:id', validate(idParamSchema, 'params'), user_Mid.DeleteUser);
router.get('/list',user_Mid.GetAllUsers,(req, res) => {
    return res.json({
      success: true,
      data: req.users_data || [],
      total_rows: req.total_rows ?? 0,
      total_pages: req.total_pages ?? 0,
    });
  }
);
router.get('/users/:id',validate(idParamSchema, 'params'),user_Mid.GetOneUser,(req, res) => {
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