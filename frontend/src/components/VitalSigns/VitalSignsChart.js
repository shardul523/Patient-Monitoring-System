import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useTheme } from '@mui/material/styles';

const VitalSignsChart = ({ data, parameter }) => {
  const theme = useTheme();

  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return <div>No data available</div>;
  }

  // Format data for recharts
  const chartData = data.timestamps.map((timestamp, index) => ({
    time: format(new Date(timestamp), 'MMM dd HH:mm'),
    heartRate: data.heartRate?.[index],
    systolic: data.bloodPressureSystolic?.[index],
    diastolic: data.bloodPressureDiastolic?.[index],
    temperature: data.temperature?.[index],
    oxygenSaturation: data.oxygenSaturation?.[index],
    respiratoryRate: data.respiratoryRate?.[index],
  }));

  const renderLines = () => {
    if (parameter === 'all') {
      return (
        <>
          <Line
            type="monotone"
            dataKey="heartRate"
            stroke={theme.palette.error.main}
            name="Heart Rate (bpm)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="oxygenSaturation"
            stroke={theme.palette.info.main}
            name="O₂ Saturation (%)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={theme.palette.warning.main}
            name="Temperature (°C)"
            strokeWidth={2}
          />
        </>
      );
    }

    switch (parameter) {
      case 'heartRate':
        return (
          <Line
            type="monotone"
            dataKey="heartRate"
            stroke={theme.palette.error.main}
            name="Heart Rate (bpm)"
            strokeWidth={2}
          />
        );
      case 'bloodPressure':
        return (
          <>
            <Line
              type="monotone"
              dataKey="systolic"
              stroke={theme.palette.primary.main}
              name="Systolic (mmHg)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke={theme.palette.primary.light}
              name="Diastolic (mmHg)"
              strokeWidth={2}
            />
          </>
        );
      case 'temperature':
        return (
          <Line
            type="monotone"
            dataKey="temperature"
            stroke={theme.palette.warning.main}
            name="Temperature (°C)"
            strokeWidth={2}
          />
        );
      case 'oxygenSaturation':
        return (
          <Line
            type="monotone"
            dataKey="oxygenSaturation"
            stroke={theme.palette.info.main}
            name="O₂ Saturation (%)"
            strokeWidth={2}
          />
        );
      case 'respiratoryRate':
        return (
          <Line
            type="monotone"
            dataKey="respiratoryRate"
            stroke={theme.palette.success.main}
            name="Respiratory Rate (breaths/min)"
            strokeWidth={2}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        {renderLines()}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default VitalSignsChart;