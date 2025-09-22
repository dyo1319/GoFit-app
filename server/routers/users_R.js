const express = require('express');
const router = express.Router();
const user_Mid = require('../middleware/user_Mid');

router.get('/search', user_Mid.search);

router.post('/Add', user_Mid.AddUser);

router.get("/list", user_Mid.GetAllUsers, (req, res) => {
  res.json({
    success: true,
    page: req.page,
    total_rows: req.total_rows,
    total_pages: req.total_pages,
    data: req.users_data,
  });
});

router.get('/users/:id', user_Mid.GetOneUser, (req, res) => {
  if (req.one_user_error) {
    return res.status(req.one_user_error.status).json({ 
      success: false, 
      message: req.one_user_error.message 
    });
  }
  
  const payload = { 
    user: req.one_user_data 
  };
  
  if (req.one_user_body !== undefined) {
    payload.bodydetails = req.one_user_body;
  }
  
  if (req.one_user_subscription !== undefined) {
    payload.subscription = req.one_user_subscription;
  }
  
  return res.json({ 
    success: true, 
    data: payload 
  });
});

router.put('/users/:id', user_Mid.UpdateUser);

router.delete('/users/:id', user_Mid.DeleteUser);


module.exports = router;