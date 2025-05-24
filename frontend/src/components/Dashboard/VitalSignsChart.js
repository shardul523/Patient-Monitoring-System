import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';

const VitalSignsChart = ({ alertsData }) => {
  const theme = useTheme();

  const data = alertsData?.statusBreakdown?.map(status => ({
    status: status._id,
    critical: status.types?.find(t => t.type === 'critical')?.count || 0,
    warning: status.types?.find(t => t.type === 'warning')?.count || 0,
    info: status.types?.find(t => t.type === 'info')?.count || 0,
  })) || [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="status" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="critical" fill={theme.palette.error.main} />
        <Bar dataKey="warning" fill={theme.palette.warning.main} />
        <Bar dataKey="info" fill={theme.palette.info.main} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default VitalSignsChart;