import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useMutation } from 'react-query';
import { alertsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const AlertActions = ({ alert, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  const acknowledgeMutation = useMutation(
    () => alertsAPI.acknowledge(alert._id),
    {
      onSuccess: () => {
        enqueueSnackbar('Alert acknowledged', { variant: 'success' });
        onUpdate();
      },
    }
  );

  const resolveMutation = useMutation(
    () => alertsAPI.resolve(alert._id, resolution),
    {
      onSuccess: () => {
        enqueueSnackbar('Alert resolved', { variant: 'success' });
        setResolveDialogOpen(false);
        setResolution('');
        onUpdate();
      },
    }
  );

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAcknowledge = () => {
    handleMenuClose();
    acknowledgeMutation.mutate();
  };

  const handleResolve = () => {
    handleMenuClose();
    setResolveDialogOpen(true);
  };

  const handleResolveSubmit = () => {
    if (resolution.trim()) {
      resolveMutation.mutate();
    }
  };

  return (
    <>
      <Box>
        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {alert.status === 'active' && (
            <MenuItem onClick={handleAcknowledge}>
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Acknowledge</ListItemText>
            </MenuItem>
          )}
          {(alert.status === 'active' || alert.status === 'acknowledged') && (
            <MenuItem onClick={handleResolve}>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Resolve</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <InfoIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)}>
        <DialogTitle>Resolve Alert</DialogTitle>
        <DialogContent>
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
            onClick={handleResolveSubmit}
            variant="contained"
            disabled={!resolution.trim() || resolveMutation.isLoading}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AlertActions;