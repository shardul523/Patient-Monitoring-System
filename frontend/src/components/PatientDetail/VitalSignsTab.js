import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { vitalsAPI } from '../../services/api';
import VitalSignsChart from '../VitalSigns/VitalSignsChart';
import LatestVitalSigns from '../VitalSigns/LatestVitalSigns';
import VitalSignsHistory from '../VitalSigns/VitalSignsHistory';
import RecordVitalsDialog from '../VitalSigns/RecordVitalsDialog';

const VitalSignsTab = ({ patientId }) => {
  const [timeRange, setTimeRange] = useState(7);
  const [selectedParameter, setSelectedParameter] = useState('all');
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  const { data: latestVitals, refetch: refetchLatest } = useQuery(
    ['latestVitals', patientId],
    () => vitalsAPI.getLatest(patientId),
    {
      refetchInterval: 30000,
    }
  );

  const { data: vitalsTrends, isLoading: trendsLoading } = useQuery(
    ['vitalsTrends', patientId, timeRange],
    () => vitalsAPI.getTrends(patientId, { days: timeRange }),
    {
      refetchInterval: 60000,
    }
  );

  const { data: vitalsHistory, refetch: refetchHistory } = useQuery(
    ['vitalsHistory', patientId],
    () => vitalsAPI.getByPatient(patientId, { limit: 10 }),
  );

  const handleRecordSuccess = () => {
    refetchLatest();
    refetchHistory();
  };

  return (
    <Box>
      {/* Actions Bar */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Vital Signs Monitoring</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setRecordDialogOpen(true)}
        >
          Record Vital Signs
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Latest Vital Signs */}
        <Grid item xs={12}>
          <LatestVitalSigns vitals={latestVitals?.data} />
        </Grid>

        {/* Trends Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">Vital Signs Trends</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <MenuItem value={1}>24 Hours</MenuItem>
                    <MenuItem value={3}>3 Days</MenuItem>
                    <MenuItem value={7}>7 Days</MenuItem>
                    <MenuItem value={14}>14 Days</MenuItem>
                    <MenuItem value={30}>30 Days</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Parameter</InputLabel>
                  <Select
                    value={selectedParameter}
                    label="Parameter"
                    onChange={(e) => setSelectedParameter(e.target.value)}
                  >
                    <MenuItem value="all">All Parameters</MenuItem>
                    <MenuItem value="heartRate">Heart Rate</MenuItem>
                    <MenuItem value="bloodPressure">Blood Pressure</MenuItem>
                    <MenuItem value="temperature">Temperature</MenuItem>
                    <MenuItem value="oxygenSaturation">Oxygen Saturation</MenuItem>
                    <MenuItem value="respiratoryRate">Respiratory Rate</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            {trendsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <VitalSignsChart data={vitalsTrends?.data} parameter={selectedParameter} />
            )}
          </Paper>
        </Grid>

        {/* History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Measurements
            </Typography>
            <VitalSignsHistory history={vitalsHistory?.data?.vitals || []} />
          </Paper>
        </Grid>
      </Grid>

      <RecordVitalsDialog
        open={recordDialogOpen}
        onClose={() => setRecordDialogOpen(false)}
        patientId={patientId}
        onSuccess={handleRecordSuccess}
      />
    </Box>
  );
};

export default VitalSignsTab;