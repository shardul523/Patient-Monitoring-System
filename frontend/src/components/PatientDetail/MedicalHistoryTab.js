import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';

import {Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,} from '@mui/lab'

import {
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Vaccines as VaccinesIcon,
  Warning as WarningIcon,
  Healing as HealingIcon,
  Edit as EditIcon,
  Add as AddIcon,
  FamilyRestroom as FamilyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { patientsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const MedicalHistoryTab = ({ patient }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dialogType, setDialogType] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Initialize medical history if not present
  const medicalHistory = patient.medicalHistory || {
    conditions: [],
    medications: [],
    procedures: [],
    immunizations: [],
    familyHistory: []
  };

  const openDialog = (type, item = null) => {
    setDialogType(type);
    setEditingItem(item);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setDialogType('');
  };

  return (
    <Grid container spacing={3}>
      {/* Current Conditions */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Current Conditions</Typography>
            <IconButton size="small" onClick={() => openDialog('condition')}>
              <AddIcon />
            </IconButton>
          </Box>
          {medicalHistory.conditions.length === 0 ? (
            <Typography color="textSecondary">No conditions recorded</Typography>
          ) : (
            <List>
              {medicalHistory.conditions.map((condition, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <HealingIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={condition.name}
                    secondary={
                      <>
                        <Typography variant="caption" display="block">
                          Diagnosed: {format(new Date(condition.diagnosedDate), 'MMM dd, yyyy')}
                        </Typography>
                        {condition.notes && (
                          <Typography variant="caption">{condition.notes}</Typography>
                        )}
                      </>
                    }
                  />
                  {condition.status && (
                    <Chip
                      label={condition.status}
                      size="small"
                      color={condition.status === 'active' ? 'error' : 'success'}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>

      {/* Current Medications */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Current Medications</Typography>
            <IconButton size="small" onClick={() => openDialog('medication')}>
              <AddIcon />
            </IconButton>
          </Box>
          {medicalHistory.medications.length === 0 ? (
            <Typography color="textSecondary">No medications recorded</Typography>
          ) : (
            <List>
              {medicalHistory.medications
                .filter(med => med.status === 'active')
                .map((medication, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      <MedicationIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={medication.name}
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {medication.dosage} - {medication.frequency}
                          </Typography>
                          <Typography variant="caption">
                            Started: {format(new Date(medication.startDate), 'MMM dd, yyyy')}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </Paper>
      </Grid>

      {/* Allergies */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" color="error">Allergies</Typography>
            <IconButton size="small" onClick={() => openDialog('allergy')}>
              <AddIcon />
            </IconButton>
          </Box>
          {(!patient.allergies || patient.allergies.length === 0) ? (
            <Typography color="textSecondary">No allergies recorded</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {patient.allergies.map((allergy, index) => (
                <Chip
                  key={index}
                  icon={<WarningIcon />}
                  label={allergy}
                  color="error"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Immunizations */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Immunizations</Typography>
            <IconButton size="small" onClick={() => openDialog('immunization')}>
              <AddIcon />
            </IconButton>
          </Box>
          {medicalHistory.immunizations.length === 0 ? (
            <Typography color="textSecondary">No immunizations recorded</Typography>
          ) : (
            <List dense>
              {medicalHistory.immunizations.map((immunization, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <VaccinesIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={immunization.name}
                    secondary={format(new Date(immunization.date), 'MMM dd, yyyy')}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>

      {/* Medical Timeline */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Medical Timeline</Typography>
          <Timeline position="alternate">
            {/* Admission */}
            {patient.admissionDate && (
              <TimelineItem>
                <TimelineOppositeContent color="textSecondary">
                  {format(new Date(patient.admissionDate), 'MMM dd, yyyy')}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color="primary">
                    <HospitalIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6">Admitted</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Room {patient.roomNumber || 'N/A'}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            )}

            {/* Procedures */}
            {medicalHistory.procedures.map((procedure, index) => (
              <TimelineItem key={`procedure-${index}`}>
                <TimelineOppositeContent color="textSecondary">
                  {format(new Date(procedure.date), 'MMM dd, yyyy')}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color="secondary">
                    <HealingIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6">{procedure.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {procedure.notes}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}

            {/* Conditions */}
            {medicalHistory.conditions.map((condition, index) => (
              <TimelineItem key={`condition-${index}`}>
                <TimelineOppositeContent color="textSecondary">
                  {format(new Date(condition.diagnosedDate), 'MMM dd, yyyy')}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color="error">
                    <WarningIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6">Diagnosed: {condition.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {condition.notes}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Paper>
      </Grid>

      {/* Family History */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Family History</Typography>
            <IconButton size="small" onClick={() => openDialog('familyHistory')}>
              <AddIcon />
            </IconButton>
          </Box>
          {medicalHistory.familyHistory.length === 0 ? (
            <Typography color="textSecondary">No family history recorded</Typography>
          ) : (
            <Grid container spacing={2}>
              {medicalHistory.familyHistory.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FamilyIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">{item.relationship}</Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {item.condition}
                      </Typography>
                      {item.notes && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          {item.notes}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Grid>

      {/* Add/Edit Dialog */}
      <MedicalHistoryDialog
        open={dialogOpen}
        onClose={closeDialog}
        type={dialogType}
        item={editingItem}
        patient={patient}
      />
    </Grid>
  );
};

// Dialog component for adding/editing medical history items
const MedicalHistoryDialog = ({ open, onClose, type, item, patient }) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  React.useEffect(() => {
    if (item) {
      reset(item);
    } else {
      reset({});
    }
  }, [item, reset]);

  const mutation = useMutation(
    (data) => {
      // In a real app, you'd have specific endpoints for medical history
      // For now, we'll update the entire patient record
      const updatedPatient = { ...patient };
      
      if (!updatedPatient.medicalHistory) {
        updatedPatient.medicalHistory = {
          conditions: [],
          medications: [],
          procedures: [],
          immunizations: [],
          familyHistory: []
        };
      }

      switch (type) {
        case 'condition':
          updatedPatient.medicalHistory.conditions.push({
            ...data,
            diagnosedDate: new Date(),
            status: 'active'
          });
          break;
        case 'medication':
          updatedPatient.medicalHistory.medications.push({
            ...data,
            startDate: new Date(),
            status: 'active'
          });
          break;
        case 'immunization':
          updatedPatient.medicalHistory.immunizations.push({
            ...data,
            date: new Date()
          });
          break;
        case 'allergy':
          if (!updatedPatient.allergies) updatedPatient.allergies = [];
          updatedPatient.allergies.push(data.allergy);
          break;
        case 'familyHistory':
          updatedPatient.medicalHistory.familyHistory.push(data);
          break;
      }

      return patientsAPI.update(patient._id, updatedPatient);
    },
    {
      onSuccess: () => {
        enqueueSnackbar('Medical history updated successfully', { variant: 'success' });
        queryClient.invalidateQueries(['patient', patient._id]);
        onClose();
      },
      onError: (error) => {
        enqueueSnackbar(
          error.response?.data?.error || 'Failed to update medical history',
          { variant: 'error' }
        );
      },
    }
  );

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const getDialogContent = () => {
    switch (type) {
      case 'condition':
        return (
          <>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Condition name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Condition Name"
                  fullWidth
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                />
              )}
            />
          </>
        );

      case 'medication':
        return (
          <>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Medication name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Medication Name"
                  fullWidth
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
           <Controller
              name="dosage"
              control={control}
              rules={{ required: 'Dosage is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Dosage"
                  fullWidth
                  margin="normal"
                  error={!!errors.dosage}
                  helperText={errors.dosage?.message}
                />
              )}
            />
            <Controller
              name="frequency"
              control={control}
              rules={{ required: 'Frequency is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Frequency"
                  fullWidth
                  margin="normal"
                  error={!!errors.frequency}
                  helperText={errors.frequency?.message}
                  placeholder="e.g., Twice daily"
                />
              )}
            />
          </>
        );

      case 'immunization':
        return (
          <>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Immunization name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Immunization Name"
                  fullWidth
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  fullWidth
                  multiline
                  rows={2}
                  margin="normal"
                />
              )}
            />
          </>
        );

      case 'allergy':
        return (
          <Controller
            name="allergy"
            control={control}
            rules={{ required: 'Allergy is required' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Allergy"
                fullWidth
                margin="normal"
                error={!!errors.allergy}
                helperText={errors.allergy?.message}
              />
            )}
          />
        );

      case 'familyHistory':
        return (
          <>
            <Controller
              name="relationship"
              control={control}
              rules={{ required: 'Relationship is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Relationship"
                  fullWidth
                  margin="normal"
                  error={!!errors.relationship}
                  helperText={errors.relationship?.message}
                >
                  <MenuItem value="Mother">Mother</MenuItem>
                  <MenuItem value="Father">Father</MenuItem>
                  <MenuItem value="Sibling">Sibling</MenuItem>
                  <MenuItem value="Grandparent">Grandparent</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="condition"
              control={control}
              rules={{ required: 'Condition is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Condition"
                  fullWidth
                  margin="normal"
                  error={!!errors.condition}
                  helperText={errors.condition?.message}
                />
              )}
            />
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Additional Notes"
                  fullWidth
                  multiline
                  rows={2}
                  margin="normal"
                />
              )}
            />
          </>
        );

      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    const titles = {
      condition: 'Add Condition',
      medication: 'Add Medication',
      immunization: 'Add Immunization',
      allergy: 'Add Allergy',
      familyHistory: 'Add Family History'
    };
    return titles[type] || 'Add Item';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {getDialogContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isLoading}>
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MedicalHistoryTab;