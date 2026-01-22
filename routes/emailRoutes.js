const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

router.post('/send', protect, emailController.sendEmail);
router.get('/stats', protect, emailController.getStats);
router.get('/history', protect, emailController.getHistory);

module.exports = router;