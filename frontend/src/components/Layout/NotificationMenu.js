import React from 'react';
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Check as CheckIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { alertsAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const NotificationMenu = ({ anchorEl, open, onClose }) => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery(
    'notifications',
    async () => {
      const response = await alertsAPI.getNotifications();
      return response.data;
    },
    {
      enabled: open,
    }
  );

  const markAsReadMutation = useMutation(
    (id) => alertsAPI.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotifications');
      },
    }
  );

  const markAllAsReadMutation = useMutation(
    () => alertsAPI.markAllAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotifications');
      },
    }
  );

  const handleMarkAsRead = (id, e) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'error';
    if (priority === 'normal') return 'warning';
    return 'info';
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          width: 360,
          maxHeight: 500,
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Notifications</Typography>
        {notifications.length > 0 && (
          <Button size="small" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </Box>
      <Divider />
      
      {isLoading ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No notifications</Typography>
        </Box>
      ) : (
        notifications.map((notification) => (
          <MenuItem
            key={notification.id}
            sx={{
              py: 2,
              backgroundColor: notification.read ? 'transparent' : 'action.hover',
              '&:hover': {
                backgroundColor: notification.read ? 'action.hover' : 'action.selected',
              },
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={notification.read ? 'normal' : 'bold'}>
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {notification.message}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Chip
                      label={notification.priority}
                      size="small"
                      color={getPriorityColor(notification.priority)}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </Typography>
                  </Box>
                </Box>
                {!notification.read && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </MenuItem>
        ))
      )}
    </Menu>
  );
};

export default NotificationMenu;