const express = require('express');
const patientRoutes = require('./patientRoutes');
const healthRoutes = require('./healthRoutes');

const router = express.Router();

router.use('/patients', patientRoutes);
router.use('/health', healthRoutes);

module.exports = router;