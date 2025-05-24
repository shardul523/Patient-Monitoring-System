import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  admitted: '#2196f3',
  discharged: '#4caf50',
  outpatient: '#ff9800',
};

const PatientStatusChart = ({ patients }) => {
  const data = [
    {
      name: 'Admitted',
      value: patients.filter(p => p.status === 'admitted').length,
    },
    {
      name: 'Discharged',
      value: patients.filter(p => p.status === 'discharged').length,
    },
    {
      name: 'Outpatient',
      value: patients.filter(p => p.status === 'outpatient').length,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PatientStatusChart;