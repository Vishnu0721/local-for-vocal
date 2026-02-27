const express = require('express');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getUsers, getArtisans, approveArtisan, removeUser } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticateJWT, authorizeRoles('ADMIN'));

router.get('/users', getUsers);
router.get('/artisans', getArtisans);
router.put('/approve-artisan/:id', approveArtisan);
router.delete('/remove-user/:id', removeUser);

module.exports = router;

