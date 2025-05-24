import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation } from 'react-query';
import { patientsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const PatientDialog = ({ open, onClose, patient }) => {
  const { enqueueSnackbar } = useSnackbar();
  const isEdit = !!patient;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: null,
      gender: '',
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phoneNumber: '',
      },
      roomNumber: '',
      status: 'admitted',
    },
  });

  useEffect(() => {
    if (patient) {
      reset({
        ...patient,
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : null,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        dateOfBirth: null,
        gender: '',
        phoneNumber: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phoneNumber: '',
        },
        roomNumber: '',
        status: 'admitted',
      });
    }
  }, [patient, reset]);

  const mutation = useMutation(
    (data) => {
      if (isEdit) {
        return patientsAPI.update(patient._id, data);
      }
      return patientsAPI.create(data);
    },
    {
      onSuccess: () => {
        enqueueSnackbar(
          isEdit ? 'Patient updated successfully' : 'Patient created successfully',
          { variant: 'success' }
        );
        onClose();
      },
      onError: (error) => {
        enqueueSnackbar(
          error.response?.data?.error || 'An error occurred',
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
        <DialogTitle>
          {isEdit ? 'Edit Patient' : 'Add New Patient'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: 'Last name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="phoneNumber"
                  control={control}
                  rules={{ required: 'Phone number is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone Number"
                      fullWidth
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  rules={{ required: 'Date of birth is required' }}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Date of Birth"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.dateOfBirth}
                          helperText={errors.dateOfBirth?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="gender"
                  control={control}
                  rules={{ required: 'Gender is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Gender"
                      fullWidth
                      error={!!errors.gender}
                      helperText={errors.gender?.message}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="roomNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Room Number" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Status" fullWidth>
                      <MenuItem value="admitted">Admitted</MenuItem>
                      <MenuItem value="discharged">Discharged</MenuItem>
                      <MenuItem value="outpatient">Outpatient</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              {/* Address Fields */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address.street"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Street" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="address.city"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="City" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller
                  name="address.state"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="State" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller
                  name="address.zipCode"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Zip Code" fullWidth />
                  )}
                />
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Emergency Contact
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="emergencyContact.name"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Name" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="emergencyContact.relationship"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Relationship" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="emergencyContact.phoneNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Phone Number" fullWidth />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isLoading}>
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PatientDialog;