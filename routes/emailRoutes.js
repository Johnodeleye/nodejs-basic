const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/send', emailController.sendEmail);
router.get('/stats', emailController.getStats);
router.get('/history', emailController.getHistory);
router.delete('/clear-stats', emailController.clearStats);

module.exports = router;