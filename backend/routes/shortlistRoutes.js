const express = require('express');
const router = express.Router();
const shortlistController = require('../controllers/shortlistController');

router.post('/', shortlistController.addToShortlist);
router.delete('/:id', shortlistController.removeFromShortlist);
router.get('/:teamId', shortlistController.getShortlist);

module.exports = router;
