import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  Favorite as HeartIcon,
  Thermostat as TempIcon,
  Air as AirIcon,
  Speed as SpeedIcon,
  WaterDrop as WaterDropIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const VitalSignCard = ({ title, value, unit, icon, color, status }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">
              {value} <Typography variant="caption">{unit}</Typography>
            </Typography>
            {status && (
              <Chip
                label={status}
                size="small"
                color={status === 'Normal' ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.3 }}>
            {React.cloneElement(icon, { sx: { fontSize: 50 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const LatestVitalSigns = ({ vitals }) => {
  if (!vitals) {
    return (
      <Card>
        <CardContent>
          <Typography align="center" color="textSecondary">
            No vital signs recorded yet
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getStatus = (type, value) => {
    switch (type) {
      case 'heartRate':
        if (value < 60 || value > 100) return 'Abnormal';
        return 'Normal';
      case 'oxygenSaturation':
        if (value < 95) return 'Low';
        return 'Normal';
      case 'temperature':
        if (value < 36 || value > 38) return 'Abnormal';
        return 'Normal';
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Latest Vital Signs</Typography>
        <Typography variant="caption" color="textSecondary">
          Recorded {formatDistanceToNow(new Date(vitals.createdAt), { addSuffix: true })}
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2.4}>
          <VitalSignCard
            title="Heart Rate"
            value={vitals.heartRate.value}
            unit={vitals.heartRate.unit}
            icon={<HeartIcon />}
            color="error"
            status={getStatus('heartRate', vitals.heartRate.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <VitalSignCard
            title="Blood Pressure"
            value={`${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`}
            unit={vitals.bloodPressure.unit}
            icon={<WaterDropIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <VitalSignCard
            title="Temperature"
            value={vitals.temperature.value}
            unit={`°${vitals.temperature.unit === 'celsius' ? 'C' : 'F'}`}
            icon={<TempIcon />}
            color="warning"
            status={getStatus('temperature', vitals.temperature.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <VitalSignCard
            title="O₂ Saturation"
            value={vitals.oxygenSaturation.value}
            unit={vitals.oxygenSaturation.unit}
            icon={<AirIcon />}
            color="info"
            status={getStatus('oxygenSaturation', vitals.oxygenSaturation.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <VitalSignCard
            title="Respiratory Rate"
            value={vitals.respiratoryRate.value}
            unit={vitals.respiratoryRate.unit}
            icon={<SpeedIcon />}
            color="success"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default LatestVitalSigns;