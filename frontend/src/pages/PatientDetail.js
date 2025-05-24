import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  MonitorHeart as MonitorHeartIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { patientsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import PatientInfo from '../components/PatientDetail/PatientInfo';
import VitalSignsTab from '../components/PatientDetail/VitalSignsTab';
import AlertsTab from '../components/PatientDetail/AlertsTab';
import MedicalHistoryTab from '../components/PatientDetail/MedicalHistoryTab';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscribeToPatient } = useSocket();
  const [tabValue, setTabValue] = React.useState(0);

  const { data: patient, isLoading, error } = useQuery(
    ['patient', id],
    () => patientsAPI.getById(id),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  useEffect(() => {
    if (id) {
      subscribeToPatient(id);
    }
  }, [id, subscribeToPatient]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !patient) {
    return (
      <Box>
        <Typography color="error">Failed to load patient data</Typography>
        <Button onClick={() => navigate('/patients')}>Back to Patients</Button>
      </Box>
    );
  }

  const patientData = patient.data;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/patients')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">
            {patientData.firstName} {patientData.lastName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip 
              label={`Room ${patientData.roomNumber || 'N/A'}`} 
              color="primary" 
              size="small" 
            />
            <Chip 
              label={patientData.status} 
              color={patientData.status === 'admitted' ? 'warning' : 'success'} 
              size="small" 
            />
            <Chip 
              label={`Age: ${patientData.age}`} 
              size="small" 
            />
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/patients/${id}/edit`)}
        >
          Edit Patient
        </Button>
        <Button
          variant="contained"
          startIcon={<MonitorHeartIcon />}
          onClick={() => navigate(`/vitals?patientId=${id}`)}
        >
          Record Vitals
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Vital Signs" />
          <Tab label="Alerts" />
          <Tab label="Medical History" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && <PatientInfo patient={patientData} />}
      {tabValue === 1 && <VitalSignsTab patientId={id} />}
      {tabValue === 2 && <AlertsTab patientId={id} />}
      {tabValue === 3 && <MedicalHistoryTab patient={patientData} />}
    </Box>
  );
};

export default PatientDetail;