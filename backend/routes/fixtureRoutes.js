const express = require('express');
const router = express.Router();
const fixtureController = require('../controllers/fixtureController');

router.post('/generate', fixtureController.generateFixtures);
router.post('/', fixtureController.createFixture);
router.get('/:auctionId', fixtureController.getFixtures);
router.delete('/:auctionId', fixtureController.deleteFixtures);
router.put('/item/:id', fixtureController.updateFixture);
router.delete('/item/:id', fixtureController.deleteFixtureById);

module.exports = router;
