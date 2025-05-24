import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { format } from 'date-fns';

const PatientInfo = ({ patient }) => {
  return (
    <Grid container spacing={3}>
      {/* Basic Information */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Full Name"
                secondary={`${patient.firstName} ${patient.lastName}`}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Date of Birth"
                secondary={format(new Date(patient.dateOfBirth), 'MMMM dd, yyyy')}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Gender" secondary={patient.gender} />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Email" secondary={patient.email} />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Phone" secondary={patient.phoneNumber} />
            </ListItem>
          </List>
        </Paper>
      </Grid>

      {/* Medical Information */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Medical Information
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Admission Date"
                secondary={
                  patient.admissionDate
                    ? format(new Date(patient.admissionDate), 'MMMM dd, yyyy')
                    : 'N/A'
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Assigned Doctor"
                secondary={
                  patient.assignedDoctor
                    ? `Dr. ${patient.assignedDoctor.firstName} ${patient.assignedDoctor.lastName}`
                    : 'Unassigned'
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Room Number" secondary={patient.roomNumber || 'N/A'} />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText primary="Status" secondary={patient.status} />
            </ListItem>
          </List>
        </Paper>
      </Grid>

      {/* Address */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Address
          </Typography>
          <Typography variant="body2">
            {patient.address?.street || 'N/A'}
            {patient.address?.street && <br />}
            {patient.address?.city && `${patient.address.city}, `}
            {patient.address?.state} {patient.address?.zipCode}
            {patient.address?.country && <br />}
            {patient.address?.country}
          </Typography>
        </Paper>
      </Grid>

      {/* Emergency Contact */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Emergency Contact
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Name"
                secondary={patient.emergencyContact?.name || 'N/A'}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Relationship"
                secondary={patient.emergencyContact?.relationship || 'N/A'}
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Phone"
                secondary={patient.emergencyContact?.phoneNumber || 'N/A'}
              />
            </ListItem>
          </List>
        </Paper>
      </Grid>

      {/* Allergies */}
      {patient.allergies && patient.allergies.length > 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Allergies
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {patient.allergies.map((allergy, index) => (
                <Chip
                  key={index}
                  label={allergy}
                  color="error"
                  variant="outlined"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
};

export default PatientInfo;