import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { format } from 'date-fns';

const VitalSignsHistory = ({ history, showActions = true }) => {
  if (!history || history.length === 0) {
    return (
      <Typography align="center" color="textSecondary" sx={{ py: 3 }}>
        No vital signs recorded yet
      </Typography>
    );
  }

  const getCellColor = (parameter, value) => {
    switch (parameter) {
      case 'heartRate':
        if (value < 60 || value > 100) return 'error.main';
        break;
      case 'oxygenSaturation':
        if (value < 95) return 'error.main';
        if (value < 98) return 'warning.main';
        break;
      case 'temperature':
        if (value < 36 || value > 38) return 'warning.main';
        break;
    }
    return 'text.primary';
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date/Time</TableCell>
            <TableCell>Heart Rate</TableCell>
            <TableCell>Blood Pressure</TableCell>
            <TableCell>Temperature</TableCell>
            <TableCell>O₂ Saturation</TableCell>
            <TableCell>Resp. Rate</TableCell>
            {history[0]?.painLevel !== undefined && <TableCell>Pain Level</TableCell>}
            <TableCell>Recorded By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((vital) => (
            <TableRow key={vital._id}>
              <TableCell>
                {format(new Date(vital.createdAt), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell>
                <Box color={getCellColor('heartRate', vital.heartRate.value)}>
                  {vital.heartRate.value} {vital.heartRate.unit}
                </Box>
              </TableCell>
              <TableCell>
                {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} {vital.bloodPressure.unit}
              </TableCell>
              <TableCell>
                <Box color={getCellColor('temperature', vital.temperature.value)}>
                  {vital.temperature.value}°
                  {vital.temperature.unit === 'celsius' ? 'C' : 'F'}
                </Box>
              </TableCell>
              <TableCell>
                <Box color={getCellColor('oxygenSaturation', vital.oxygenSaturation.value)}>
                  {vital.oxygenSaturation.value}{vital.oxygenSaturation.unit}
                </Box>
              </TableCell>
              <TableCell>
                {vital.respiratoryRate.value} {vital.respiratoryRate.unit}
              </TableCell>
              {vital.painLevel !== undefined && (
                <TableCell>
                  <Chip
                    label={vital.painLevel}
                    size="small"
                    color={vital.painLevel > 7 ? 'error' : vital.painLevel > 4 ? 'warning' : 'default'}
                  />
                </TableCell>
              )}
              <TableCell>
                {vital.recordedBy?.name || 'System'}
                {vital.isAutoRecorded && (
                  <Chip label="Auto" size="small" sx={{ ml: 1 }} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VitalSignsHistory;