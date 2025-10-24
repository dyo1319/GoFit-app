const express = require('express');
const router = express.Router();
const auth_Mid = require('../middleware/auth_Mid');
const { validate, authSignupSchema, authSigninSchema, profileUpdateSchema } = require('../middleware/validate');

router.post('/signup', validate(authSignupSchema), auth_Mid.signup);
router.post('/signin', validate(authSigninSchema), auth_Mid.signin);

router.get('/verify', auth_Mid.verifyToken, auth_Mid.verify);

router.get('/profile', auth_Mid.verifyToken, auth_Mid.getProfile);
router.put('/profile', auth_Mid.verifyToken, validate(profileUpdateSchema), auth_Mid.updateProfile);

router.put('/change-password', auth_Mid.verifyToken, async (req, res) => {
  try {
    await auth_Mid.changePassword(req, res);
  } catch (err) {
    console.error('PUT /auth/change-password error:', err);
    res.status(500).json({ success: false, message: 'שגיאת שרת' });
  }
});


module.exports = router;