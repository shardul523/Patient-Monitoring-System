const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { authMiddleware } = require('../utils/auth');
const Joi = require('joi');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation schema for patient
const patientSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  phoneNumber: Joi.string().required(),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    country: Joi.string()
  }),
  emergencyContact: Joi.object({
    name: Joi.string(),
    relationship: Joi.string(),
    phoneNumber: Joi.string()
  }),
  medicalHistory: Joi.array().items(Joi.object({
    condition: Joi.string(),
    diagnosisDate: Joi.date(),
    status: Joi.string().valid('active', 'resolved', 'chronic')
  })),
  allergies: Joi.array().items(Joi.string()),
  medications: Joi.array().items(Joi.object({
    name: Joi.string(),
    dosage: Joi.string(),
    frequency: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date()
  })),
  roomNumber: Joi.string(),
  status: Joi.string().valid('admitted', 'discharged', 'outpatient'),
  notes: Joi.string()
});

// Get all patients
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'firstName lastName specialization')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Patient.countDocuments(query);

    res.json({
      patients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('assignedDoctor', 'firstName lastName specialization');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const { error } = patientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const patient = new Patient(req.body);
    if (req.user.role === 'doctor') {
      patient.assignedDoctor = req.user.id;
    }
    
    await patient.save();

    // Publish event to RabbitMQ
    const rabbitmq = req.app.locals.rabbitmq;
    if (rabbitmq) {
      await rabbitmq.publishToQueue('patient-events', {
        event: 'patient.created',
        patientId: patient._id,
        data: patient,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Patient created successfully',
      patient
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const { error } = patientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Publish event to RabbitMQ
    const rabbitmq = req.app.locals.rabbitmq;
    if (rabbitmq) {
      await rabbitmq.publishToQueue('patient-events', {
        event: 'patient.updated',
        patientId: patient._id,
        data: patient,
        timestamp: new Date()
      });
    }

    res.json({
      message: 'Patient updated successfully',
      patient
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient (soft delete by changing status)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete patients' });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { status: 'discharged', dischargeDate: new Date() },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      message: 'Patient discharged successfully',
      patient
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Assign doctor to patient
router.post('/:id/assign-doctor', async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Unauthorized to assign doctors' });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { assignedDoctor: doctorId },
      { new: true }
    ).populate('assignedDoctor', 'firstName lastName specialization');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      message: 'Doctor assigned successfully',
      patient
    });
  } catch (error) {
    console.error('Error assigning doctor:', error);
    res.status(500).json({ error: 'Failed to assign doctor' });
  }
});

module.exports = router;