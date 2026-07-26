const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');

router.post('/send-batch', mailController.sendBatch);
router.get('/stats', mailController.getStats);
router.get('/history', mailController.getHistory);
router.delete('/clear-stats', mailController.clearStats);

module.exports = router;