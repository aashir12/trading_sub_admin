import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { DashboardContent } from 'src/layouts/dashboard';
import { firebaseController } from 'src/utils/firebaseMiddleware';

// ----------------------------------------------------------------------

export function NotificationsView() {
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  const getAdminRefferal = () => {
    const adminDataString = localStorage.getItem('adminData');
    if (adminDataString) {
      const adminData = JSON.parse(adminDataString);
      return adminData.refferal;
    }
    return null;
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const adminRefferal = getAdminRefferal();
      if (adminRefferal) {
        const notifications = await firebaseController.getNotificationsByRefferal(adminRefferal);
        setNotificationsList(notifications);
      } else {
        console.error('Admin referral not found.');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSubmitNotification = async () => {
    if (!notificationMessage || !notificationType) {
      alert('Please fill in both message and type.');
      return;
    }

    const adminRefferal = getAdminRefferal();
    if (!adminRefferal) {
      alert('Admin referral not found. Cannot send notification.');
      return;
    }

    try {
      const notificationData = {
        message: notificationMessage,
        read: false,
        type: notificationType,
        refferal: adminRefferal,
        createdAt: new Date(),
      };

      const notificationId = await firebaseController.addNotification(notificationData);

      // Send notification to child users
      const childUsers = await firebaseController.fetchUsersByRefferal(adminRefferal);
      for (const user of childUsers) {
        await firebaseController.addUserNotification(user.id, notificationId, notificationData);
      }

      alert('Notification sent successfully!');
      setNotificationMessage('');
      setNotificationType('info');
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification.');
    }
  };

  const handleOpenDialog = (notification: any) => {
    setSelectedNotification(notification);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedNotification(null);
  };

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Notifications
      </Typography>

      <Card sx={{ p: 3, mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Create New Notification
        </Typography>
        <TextField
          fullWidth
          label="Notification Message"
          multiline
          rows={4}
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="notification-type-label">Notification Type</InputLabel>
          <Select
            labelId="notification-type-label"
            id="notification-type-select"
            value={notificationType}
            label="Notification Type"
            onChange={(e) => setNotificationType(e.target.value as string)}
          >
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="success">Success</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSubmitNotification}>
          Send Notification
        </Button>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          My Notifications
        </Typography>
        {notificationsList.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No notifications created yet.
          </Typography>
        ) : (
          <List>
            {notificationsList.map((notification) => (
              <div key={notification.id}>
                <ListItem button onClick={() => handleOpenDialog(notification)}>
                  <ListItemText
                    primary={notification.message}
                    secondary={`Type: ${notification.type || 'N/A'} | Created At: ${notification.createdAt.seconds ? new Date(notification.createdAt.seconds * 1000).toLocaleString() : 'N/A'}`}
                  />
                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        )}
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedNotification?.message}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">{selectedNotification?.message}</Typography>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            Type: {selectedNotification?.type || 'N/A'} | Read:{' '}
            {selectedNotification?.read ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
            Created At:{' '}
            {selectedNotification?.createdAt.seconds
              ? new Date(selectedNotification.createdAt.seconds * 1000).toLocaleString()
              : 'N/A'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
