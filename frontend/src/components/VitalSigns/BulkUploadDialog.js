import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useMutation } from 'react-query';
import { vitalsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const BulkUploadDialog = ({ open, onClose, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);

  const uploadMutation = useMutation(
    (records) => vitalsAPI.bulkCreate(records),
    {
      onSuccess: (response) => {
        const data = response.data;
        enqueueSnackbar(
          `Successfully uploaded ${data.successful} vital signs records`,
          { variant: 'success' }
        );
        if (data.failed > 0) {
          enqueueSnackbar(
            `Failed to upload ${data.failed} records`,
            { variant: 'warning' }
          );
        }
        handleClose();
        if (onSuccess) onSuccess();
      },
      onError: (error) => {
        enqueueSnackbar(
          error.response?.data?.error || 'Failed to upload vital signs',
          { variant: 'error' }
        );
      },
    }
  );

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setErrors([]);
    onClose();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const records = [];
        const parseErrors = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const record = {};
          
          headers.forEach((header, index) => {
            record[header] = values[index];
          });

          // Validate and transform record
          try {
            const vitalRecord = {
              patientId: record.patientId,
              heartRate: { value: parseFloat(record.heartRate), unit: 'bpm' },
              bloodPressure: {
                systolic: parseFloat(record.systolic),
                diastolic: parseFloat(record.diastolic),
                unit: 'mmHg'
              },
              temperature: { value: parseFloat(record.temperature), unit: 'celsius' },
              oxygenSaturation: { value: parseFloat(record.oxygenSaturation), unit: '%' },
              respiratoryRate: { value: parseFloat(record.respiratoryRate), unit: 'breaths/min' }
            };

            if (record.painLevel) {
              vitalRecord.painLevel = parseInt(record.painLevel);
            }

            records.push(vitalRecord);
          } catch (err) {
            parseErrors.push(`Row ${i}: ${err.message}`);
          }
        }

        setParsedData(records);
        setErrors(parseErrors);
      } catch (error) {
        enqueueSnackbar('Failed to parse CSV file', { variant: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = () => {
    if (parsedData && parsedData.length > 0) {
      uploadMutation.mutate(parsedData);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Upload Vital Signs</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Upload a CSV file with columns: patientId, heartRate, systolic, diastolic, 
            temperature, oxygenSaturation, respiratoryRate, painLevel (optional)
          </Alert>

          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="csv-file-input"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="csv-file-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              Select CSV File
            </Button>
          </label>

          {file && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                Selected file: {file.name}
              </Typography>
            </Box>
          )}

          {parsedData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">
                Parsed Records: {parsedData.length}
              </Typography>
              
              {errors.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">Errors found:</Typography>
                  <List dense>
                    {errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="subtitle2">Preview (first 5 records):</Typography>
                <List dense>
                  {parsedData.slice(0, 5).map((record, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`Patient: ${record.patientId}`}
                        secondary={`HR: ${record.heartRate.value}, BP: ${record.bloodPressure.systolic}/${record.bloodPressure.diastolic}, Temp: ${record.temperature.value}°C`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          )}

          {uploadMutation.isLoading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Uploading vital signs...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploadMutation.isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!parsedData || parsedData.length === 0 || uploadMutation.isLoading}
        >
          Upload {parsedData ? `(${parsedData.length} records)` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUploadDialog;