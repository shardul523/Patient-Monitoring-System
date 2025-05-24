import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery } from 'react-query';
import { patientsAPI } from '../services/api';
import { format } from 'date-fns';
import PatientDialog from '../components/Patients/PatientDialog';

const Patients = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const { data, isLoading, refetch } = useQuery(
    ['patients', page, pageSize, search],
    async () => {
      const response = await patientsAPI.getAll({
        page: page + 1,
        limit: pageSize,
        search,
      });
      return response.data;
    }
  );

  const columns = [
    {
      field: 'fullName',
      headerName: 'Name',
      width: 200,
      valueGetter: (params) => `${params.row.firstName} ${params.row.lastName}`,
    },
    {
      field: 'age',
      headerName: 'Age',
      width: 80,
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'male' ? 'primary' : 'secondary'}
        />
      ),
    },
    {
      field: 'roomNumber',
      headerName: 'Room',
      width: 100,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'admitted'
              ? 'warning'
              : params.value === 'discharged'
              ? 'success'
              : 'default'
          }
        />
      ),
    },
    {
      field: 'admissionDate',
      headerName: 'Admission Date',
      width: 150,
      valueFormatter: (params) => 
        params.value ? format(new Date(params.value), 'MMM dd, yyyy') : '-',
    },
    {
      field: 'assignedDoctor',
      headerName: 'Doctor',
      width: 150,
      valueGetter: (params) => 
        params.row.assignedDoctor 
          ? `Dr. ${params.row.assignedDoctor.firstName} ${params.row.assignedDoctor.lastName}`
          : 'Unassigned',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => navigate(`/patients/${params.row._id}`)}
          >
            View Details
          </Button>
        </Box>
      ),
    },
  ];

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setDialogOpen(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPatient(null);
    refetch();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Patients</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPatient}
        >
          Add Patient
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search patients..."
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
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data?.patients || []}
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
          onRowDoubleClick={(params) => navigate(`/patients/${params.row._id}`)}
        />
      </Paper>

      <PatientDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        patient={selectedPatient}
      />
    </Box>
  );
};

export default Patients;