import React, { useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  MonitorHeart as MonitorHeartIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { patientsAPI, alertsAPI, vitalsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import StatsCard from '../components/Dashboard/StatsCard';
import RecentAlerts from '../components/Dashboard/RecentAlerts';
import VitalSignsChart from '../components/Dashboard/VitalSignsChart';
import PatientStatusChart from '../components/Dashboard/PatientStatusChart';

const Dashboard = () => {
  const { socket } = useSocket();

  const { data: patientsData, isLoading: patientsLoading } = useQuery(
    'dashboardPatients',
    async () => {
      const response = await patientsAPI.getAll({ limit: 1000 });
      return response.data;
    }
  );

  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery(
    'dashboardAlerts',
    async () => {
      const response = await alertsAPI.getStats({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });
      return response.data;
    }
  );

  const { data: recentAlerts, refetch: refetchRecentAlerts } = useQuery(
    'recentAlerts',
    async () => {
      const response = await alertsAPI.getAll({ limit: 5, status: 'active' });
      return response.data.alerts;
    }
  );

  useEffect(() => {
    if (socket) {
      socket.on('new-alert', () => {
        refetchAlerts();
        refetchRecentAlerts();
      });

      return () => {
        socket.off('new-alert');
      };
    }
  }, [socket, refetchAlerts, refetchRecentAlerts]);

  const totalPatients = patientsData?.total || 0;
  const admittedPatients = patientsData?.patients?.filter(p => p.status === 'admitted').length || 0;
  const activeAlerts = alertsData?.statusBreakdown?.find(s => s._id === 'active')?.total || 0;
  const criticalAlerts = alertsData?.statusBreakdown?.find(s => s._id === 'active')?.types?.find(t => t.type === 'critical')?.count || 0;

  if (patientsLoading || alertsLoading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Patients"
            value={totalPatients}
            icon={<PeopleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Admitted"
            value={admittedPatients}
            icon={<MonitorHeartIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Alerts"
            value={activeAlerts}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Critical Alerts"
            value={criticalAlerts}
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Patient Status Distribution" />
            <CardContent>
              <PatientStatusChart patients={patientsData?.patients || []} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Alert Summary (24h)" />
            <CardContent>
              <VitalSignsChart alertsData={alertsData} />
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12}>
          <RecentAlerts alerts={recentAlerts || []} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;