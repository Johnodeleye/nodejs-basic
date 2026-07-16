const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');
const { protect } = require('../middleware/auth');

router.post('/send', mailController.sendEmail);
router.post('/send-batch', mailController.sendBatch);
router.get('/stats', mailController.getStats);
router.get('/history', mailController.getHistory);

module.exports = router;