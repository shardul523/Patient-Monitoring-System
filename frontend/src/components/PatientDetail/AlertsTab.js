import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,} from '@mui/lab'
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { alertsAPI } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useSocket } from '../../contexts/SocketContext';

const AlertsTab = ({ patientId }) => {
  const [tabValue, setTabValue] = useState('active');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Fetch alerts for this patient
  const { data, isLoading, refetch } = useQuery(
    ['patientAlerts', patientId, tabValue, page, pageSize],
    async () => {
      const response = await alertsAPI.getByPatient(patientId, {
        status: tabValue === 'all' ? undefined : tabValue,
        page: page + 1,
        limit: pageSize,
      });
      return response.data;
    }
  );

  // Subscribe to alerts for this patient
  React.useEffect(() => {
    if (socket && patientId) {
      const handleNewAlert = (alert) => {
        if (alert.patientId === patientId) {
          refetch();
          enqueueSnackbar('New alert received', { variant: 'warning' });
        }
      };

      socket.on('alert', handleNewAlert);
      return () => socket.off('alert', handleNewAlert);
    }
  }, [socket, patientId, refetch, enqueueSnackbar]);

  const acknowledgeMutation = useMutation(
    (alertId) => alertsAPI.acknowledge(alertId),
    {
      onSuccess: () => {
        enqueueSnackbar('Alert acknowledged', { variant: 'success' });
        refetch();
      },
    }
  );

  const resolveMutation = useMutation(
    ({ alertId, resolution }) => alertsAPI.resolve(alertId, resolution),
    {
      onSuccess: () => {
        enqueueSnackbar('Alert resolved', { variant: 'success' });
        setResolveDialogOpen(false);
        setResolution('');
        refetch();
      },
    }
  );

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const columns = [
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getAlertColor(params.value)}
          icon={getAlertIcon(params.value)}
        />
      ),
    },
    {
      field: 'title',
      headerName: 'Alert',
      width: 250,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
    },
    {
      field: 'createdAt',
      headerName: 'Time',
      width: 180,
      valueFormatter: (params) =>
        format(new Date(params.value), 'MMM dd, yyyy HH:mm'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const colors = {
          active: 'error',
          acknowledged: 'warning',
          resolved: 'success',
          escalated: 'info',
        };
        return (
          <Chip
            label={params.value}
            size="small"
            color={colors[params.value] || 'default'}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          {params.row.status === 'active' && (
            <IconButton
              size="small"
              onClick={() => acknowledgeMutation.mutate(params.row._id)}
              disabled={acknowledgeMutation.isLoading}
            >
              <CheckIcon />
            </IconButton>
          )}
          {(params.row.status === 'active' || params.row.status === 'acknowledged') && (
            <IconButton
              size="small"
              onClick={() => {
                setSelectedAlert(params.row);
                setResolveDialogOpen(true);
              }}
            >
              <CheckCircleIcon />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    total: data?.total || 0,
    active: data?.alerts?.filter(a => a.status === 'active').length || 0,
    critical: data?.alerts?.filter(a => a.type === 'critical' && a.status === 'active').length || 0,
    resolved: data?.alerts?.filter(a => a.status === 'resolved').length || 0,
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Alerts
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Alerts
              </Typography>
              <Typography variant="h4" color="error">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical Alerts
              </Typography>
              <Typography variant="h4" color="error">
                {stats.critical}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Resolved Today
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.resolved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Critical Alerts */}
      {stats.critical > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            {stats.critical} critical alert{stats.critical > 1 ? 's' : ''} require immediate attention
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Active
                  {stats.active > 0 && (
                    <Chip label={stats.active} size="small" color="error" />
                  )}
                </Box>
              }
              value="active"
            />
            <Tab label="Acknowledged" value="acknowledged" />
            <Tab label="Resolved" value="resolved" />
            <Tab label="All" value="all" />
          </Tabs>
          <IconButton onClick={() => refetch()} sx={{ mr: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Alerts Grid */}
      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={data?.alerts || []}
          columns={columns}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          rowsPerPageOptions={[5, 10, 20]}
          page={page}
          onPageChange={setPage}
          rowCount={data?.total || 0}
          loading={isLoading}
          paginationMode="server"
          getRowId={(row) => row._id}
          disableSelectionOnClick
        />
      </Paper>

      {/* Alert Timeline */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Alert Timeline
        </Typography>
        <Timeline position="alternate">
          {(data?.alerts || []).slice(0, 5).map((alert, index) => (
            <TimelineItem key={alert._id}>
              <TimelineOppositeContent color="textSecondary">
                {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={getAlertColor(alert.type)}>
                  {getAlertIcon(alert.type)}
                </TimelineDot>
                {index < 4 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  {alert.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {alert.message}
                </Typography>
                <Chip
                  label={alert.status}
                  size="small"
                  sx={{ mt: 1 }}
                  color={
                    alert.status === 'resolved'
                      ? 'success'
                      : alert.status === 'acknowledged'
                      ? 'warning'
                      : 'error'
                  }
                />
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Paper>

      {/* Resolve Dialog */}
      <Dialog
        open={resolveDialogOpen}
        onClose={() => setResolveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resolve Alert</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box sx={{ mb: 2 }}>
              <Alert severity={getAlertColor(selectedAlert.type)}>
                <Typography variant="subtitle2">{selectedAlert.title}</Typography>
                <Typography variant="body2">{selectedAlert.message}</Typography>
              </Alert>
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Resolution"
            fullWidth
            multiline
            rows={3}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe how the alert was resolved..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() =>
              resolveMutation.mutate({
                alertId: selectedAlert._id,
                resolution,
              })
            }
            variant="contained"
            disabled={!resolution.trim() || resolveMutation.isLoading}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsTab;