import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  MenuItem,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery } from 'react-query';
import { vitalsAPI, patientsAPI } from '../services/api';
import { format } from 'date-fns';
import RecordVitalsDialog from '../components/VitalSigns/RecordVitalsDialog';
import BulkUploadDialog from '../components/VitalSigns/BulkUploadDialog';
import VitalSignsHistory from '../components/VitalSigns/VitalSignsHistory';

const VitalSigns = () => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch patients for dropdown
  const { data: patientsData } = useQuery(
    'vitalsPagePatients',
    async () => {
      const response = await patientsAPI.getAll({ limit: 1000, status: 'admitted' });
      return response.data;
    }
  );

  // Fetch vital signs history
  const { data: vitalsData, isLoading, refetch } = useQuery(
    ['allVitals', selectedPatientId, page, pageSize],
    async () => {
      if (selectedPatientId) {
        const response = await vitalsAPI.getByPatient(selectedPatientId, {
          page: page + 1,
          limit: pageSize,
        });
        return response.data;
      } else {
        // In a real app, you might have an endpoint to get all vitals
        // For now, return empty data
        return { vitals: [], total: 0 };
      }
    },
    {
      enabled: !!selectedPatientId,
    }
  );

  const columns = [
    {
      field: 'createdAt',
      headerName: 'Date/Time',
      width: 180,
      valueFormatter: (params) =>
        format(new Date(params.value), 'MMM dd, yyyy HH:mm'),
    },
    {
      field: 'heartRate',
      headerName: 'Heart Rate',
      width: 120,
      valueGetter: (params) => `${params.row.heartRate.value} ${params.row.heartRate.unit}`,
      renderCell: (params) => {
        const value = params.row.heartRate.value;
        const isAbnormal = value < 60 || value > 100;
        return (
          <Box color={isAbnormal ? 'error.main' : 'text.primary'}>
            {params.value}
          </Box>
        );
      },
    },
    {
      field: 'bloodPressure',
      headerName: 'Blood Pressure',
      width: 140,
      valueGetter: (params) => 
        `${params.row.bloodPressure.systolic}/${params.row.bloodPressure.diastolic} ${params.row.bloodPressure.unit}`,
    },
    {
      field: 'temperature',
      headerName: 'Temperature',
      width: 120,
      valueGetter: (params) => 
        `${params.row.temperature.value}°${params.row.temperature.unit === 'celsius' ? 'C' : 'F'}`,
      renderCell: (params) => {
        const value = params.row.temperature.value;
        const isAbnormal = value < 36 || value > 38;
        return (
          <Box color={isAbnormal ? 'warning.main' : 'text.primary'}>
            {params.value}
          </Box>
        );
      },
    },
    {
      field: 'oxygenSaturation',
      headerName: 'O₂ Saturation',
      width: 120,
      valueGetter: (params) => `${params.row.oxygenSaturation.value}${params.row.oxygenSaturation.unit}`,
      renderCell: (params) => {
        const value = params.row.oxygenSaturation.value;
        const isLow = value < 95;
        return (
          <Box color={isLow ? 'error.main' : 'text.primary'}>
            {params.value}
          </Box>
        );
      },
    },
    {
      field: 'respiratoryRate',
      headerName: 'Resp. Rate',
      width: 120,
      valueGetter: (params) => `${params.row.respiratoryRate.value} ${params.row.respiratoryRate.unit}`,
    },
    {
      field: 'recordedBy',
      headerName: 'Recorded By',
      width: 150,
      valueGetter: (params) => params.row.recordedBy?.name || 'System',
    },
    {
      field: 'alerts',
      headerName: 'Alerts',
      width: 150,
      renderCell: (params) => {
        const alerts = params.row.alertsTriggered || [];
        if (alerts.length === 0) return '-';
        
        const criticalCount = alerts.filter(a => a.type === 'critical').length;
        const warningCount = alerts.filter(a => a.type === 'warning').length;
        
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {criticalCount > 0 && (
              <Chip label={`${criticalCount} Critical`} size="small" color="error" />
            )}
            {warningCount > 0 && (
              <Chip label={`${warningCount} Warning`} size="small" color="warning" />
            )}
          </Box>
        );
      },
    },
  ];

  const handleRecordSuccess = () => {
    refetch();
  };

  // Statistics cards
  const stats = vitalsData?.vitals || [];
  const recentAbnormal = stats.filter(v => 
    v.alertsTriggered && v.alertsTriggered.length > 0
  ).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Vital Signs Monitoring</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setBulkUploadOpen(true)}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setRecordDialogOpen(true)}
            disabled={!selectedPatientId}
          >
            Record Vital Signs
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Patients
              </Typography>
              <Typography variant="h3">
                {patientsData?.patients?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Admitted Patients
              </Typography>
              <Typography variant="h3">
                {patientsData?.patients?.filter(p => p.status === 'admitted').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Recordings
              </Typography>
              <Typography variant="h3">
                {stats.filter(v => 
                  new Date(v.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Abnormal Readings
              </Typography>
              <Typography variant="h3" color="error">
                {recentAbnormal}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patient Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Select Patient"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">
                <em>Select a patient to view vital signs</em>
              </MenuItem>
              {patientsData?.patients?.map((patient) => (
                <MenuItem key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName} - Room {patient.roomNumber || 'N/A'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <IconButton onClick={() => refetch()} disabled={!selectedPatientId}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {!selectedPatientId ? (
        <Paper sx={{ p: 4 }}>
          <Alert severity="info">
            Please select a patient to view their vital signs history
          </Alert>
        </Paper>
      ) : (
        <>
          {/* Latest Vitals Summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Latest Vital Signs
            </Typography>
            <VitalSignsHistory 
              history={vitalsData?.vitals?.slice(0, 1) || []} 
              showActions={false}
            />
          </Paper>

          {/* Vital Signs History Grid */}
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={vitalsData?.vitals || []}
              columns={columns}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              rowsPerPageOptions={[5, 10, 20]}
              page={page}
              onPageChange={setPage}
              rowCount={vitalsData?.total || 0}
              loading={isLoading}
              paginationMode="server"
              getRowId={(row) => row._id}
              disableSelectionOnClick
            />
          </Paper>
        </>
      )}

      <RecordVitalsDialog
        open={recordDialogOpen}
        onClose={() => setRecordDialogOpen(false)}
        patientId={selectedPatientId}
        onSuccess={handleRecordSuccess}
      />

      <BulkUploadDialog
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={handleRecordSuccess}
      />
    </Box>
  );
};

export default VitalSigns;