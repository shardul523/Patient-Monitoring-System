import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Typography,
  Button,
  Box,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const RecentAlerts = ({ alerts }) => {
  const navigate = useNavigate();

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

  return (
    <Card>
      <CardHeader
        title="Recent Alerts"
        action={
          <Button onClick={() => navigate('/alerts')}>View All</Button>
        }
      />
      <CardContent>
        {alerts.length === 0 ? (
          <Typography color="textSecondary" align="center">
            No active alerts
          </Typography>
        ) : (
          <List>
            {alerts.map((alert) => (
              <ListItem
                key={alert._id}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getAlertColor(alert.type)}.main` }}>
                    {getAlertIcon(alert.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{alert.title}</Typography>
                      <Chip
                        label={alert.type}
                        size="small"
                        color={getAlertColor(alert.type)}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Patient ID: {alert.patientId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentAlerts;