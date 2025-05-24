import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Slider,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from 'react-query';
import { vitalsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const RecordVitalsDialog = ({ open, onClose, patientId, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      heartRate: 70,
      systolic: 120,
      diastolic: 80,
      temperature: 36.5,
      oxygenSaturation: 98,
      respiratoryRate: 16,
      painLevel: 0,
      notes: '',
    },
  });

  const mutation = useMutation(
    (data) => vitalsAPI.create({
      patientId,
      heartRate: { value: data.heartRate, unit: 'bpm' },
      bloodPressure: {
        systolic: data.systolic,
        diastolic: data.diastolic,
        unit: 'mmHg',
      },
      temperature: { value: data.temperature, unit: 'celsius' },
      oxygenSaturation: { value: data.oxygenSaturation, unit: '%' },
      respiratoryRate: { value: data.respiratoryRate, unit: 'breaths/min' },
      painLevel: data.painLevel,
      notes: data.notes,
    }),
    {
      onSuccess: (response) => {
        const alerts = response.data.alerts;
        if (alerts && alerts.length > 0) {
          alerts.forEach(alert => {
            enqueueSnackbar(alert.message, { 
              variant: alert.type === 'critical' ? 'error' : 'warning',
              persist: alert.type === 'critical',
            });
          });
        } else {
          enqueueSnackbar('Vital signs recorded successfully', { variant: 'success' });
        }
        reset();
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (error) => {
        enqueueSnackbar(
          error.response?.data?.error || 'Failed to record vital signs',
          { variant: 'error' }
        );
      },
    }
  );

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Record Vital Signs</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Heart Rate */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="heartRate"
                  control={control}
                  rules={{
                    required: 'Heart rate is required',
                    min: { value: 30, message: 'Heart rate too low' },
                    max: { value: 200, message: 'Heart rate too high' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Heart Rate (bpm)"
                      type="number"
                      fullWidth
                      error={!!errors.heartRate}
                      helperText={errors.heartRate?.message}
                    />
                  )}
                />
              </Grid>

              {/* Blood Pressure */}
              <Grid item xs={12} sm={3}>
                <Controller
                  name="systolic"
                  control={control}
                  rules={{
                    required: 'Systolic pressure is required',
                    min: { value: 70, message: 'Value too low' },
                    max: { value: 250, message: 'Value too high' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Systolic (mmHg)"
                      type="number"
                      fullWidth
                      error={!!errors.systolic}
                      helperText={errors.systolic?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller
                  name="diastolic"
                  control={control}
                  rules={{
                    required: 'Diastolic pressure is required',
                    min: { value: 40, message: 'Value too low' },
                    max: { value: 150, message: 'Value too high' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Diastolic (mmHg)"
                      type="number"
                      fullWidth
                      error={!!errors.diastolic}
                      helperText={errors.diastolic?.message}
                    />
                  )}
                />
              </Grid>

              {/* Temperature */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="temperature"
                  control={control}
                  rules={{
                    required: 'Temperature is required',
                    min: { value: 34, message: 'Temperature too low' },
                    max: { value: 42, message: 'Temperature too high' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Temperature (°C)"
                      type="number"
                      fullWidth
                      inputProps={{ step: 0.1 }}
                      error={!!errors.temperature}
                      helperText={errors.temperature?.message}
                    />
                  )}
                />
              </Grid>

              {/* Oxygen Saturation */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="oxygenSaturation"
                  control={control}
                  rules={{
                    required: 'Oxygen saturation is required',
                    min: { value: 70, message: 'Value too low' },
                    max: { value: 100, message: 'Value cannot exceed 100%' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Oxygen Saturation (%)"
                      type="number"
                      fullWidth
                      error={!!errors.oxygenSaturation}
                      helperText={errors.oxygenSaturation?.message}
                    />
                  )}
                />
              </Grid>

              {/* Respiratory Rate */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="respiratoryRate"
                  control={control}
                  rules={{
                    required: 'Respiratory rate is required',
                    min: { value: 8, message: 'Rate too low' },
                    max: { value: 40, message: 'Rate too high' },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Respiratory Rate (breaths/min)"
                      type="number"
                      fullWidth
                      error={!!errors.respiratoryRate}
                      helperText={errors.respiratoryRate?.message}
                    />
                  )}
                />
              </Grid>

              {/* Pain Level */}
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Pain Level (0-10)</Typography>
                <Controller
                  name="painLevel"
                  control={control}
                  render={({ field }) => (
                    <Slider
                      {...field}
                      marks
                      min={0}
                      max={10}
                      valueLabelDisplay="auto"
                    />
                  )}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notes (optional)"
                      multiline
                      rows={3}
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isLoading}>
            Record
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RecordVitalsDialog;