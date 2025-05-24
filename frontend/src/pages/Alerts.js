import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery } from 'react-query';
import { alertsAPI } from '../services/api';
import { format } from 'date-fns';
import AlertActions from '../components/Alerts/AlertActions';

const Alerts = () => {
  const [tabValue, setTabValue] = useState('active');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery(
    ['alerts', tabValue, page, pageSize, typeFilter],
    async () => {
      const response = await alertsAPI.getAll({
        status: tabValue === 'all' ? undefined : tabValue,
        type: typeFilter || undefined,
        page: page + 1,
        limit: pageSize,
      });
      return response.data;
    }
  );

  const columns = [
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => {
        const colors = {
          critical: 'error',
          warning: 'warning',
          info: 'info',
        };
        return (
          <Chip
            label={params.value}
            size="small"
            color={colors[params.value]}
          />
        );
      },
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 250,
    },
    {
      field: 'patientId',
      headerName: 'Patient ID',
      width: 150,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
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
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <AlertActions alert={params.row} onUpdate={refetch} />
      ),
    },
  ];

  const tabCounts = {
    active: data?.alerts?.filter(a => a.status === 'active').length || 0,
    acknowledged: data?.alerts?.filter(a => a.status === 'acknowledged').length || 0,
    resolved: data?.alerts?.filter(a => a.status === 'resolved').length || 0,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Alerts Management
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search alerts..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Active
                {tabCounts.active > 0 && (
                  <Chip label={tabCounts.active} size="small" color="error" />
                )}
              </Box>
            }
            value="active"
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Acknowledged
                {tabCounts.acknowledged > 0 && (
                  <Chip label={tabCounts.acknowledged} size="small" color="warning" />
                )}
              </Box>
            }
            value="acknowledged"
          />
          <Tab label="Resolved" value="resolved" />
          <Tab label="All" value="all" />
        </Tabs>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
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
    </Box>
  );
};

export default Alerts;