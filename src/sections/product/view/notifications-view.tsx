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
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Autocomplete from '@mui/material/Autocomplete';

import { DashboardContent } from 'src/layouts/dashboard';
import { firebaseController } from 'src/utils/firebaseMiddleware';

// ----------------------------------------------------------------------

export function NotificationsView({ preselectedUsers = [] }: { preselectedUsers?: any[] }) {
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationImage, setNotificationImage] = useState('');
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNotificationId, setEditNotificationId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [allSelected, setAllSelected] = useState<boolean>(true);

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

  useEffect(() => {
    const fetchUsers = async () => {
      const adminRefferal = getAdminRefferal();
      if (adminRefferal) {
        const usersList = await firebaseController.fetchUsersByRefferal(adminRefferal);
        setUsers(usersList);
        if (preselectedUsers.length > 0) {
          // Find matching user objects by id/email
          const selected = usersList.filter((u) =>
            preselectedUsers.some((sel) => sel.id === u.id || sel.email === u.email)
          );
          setSelectedUsers(selected);
          setAllSelected(selected.length === usersList.length);
        } else {
          setSelectedUsers(usersList);
          setAllSelected(true);
        }
      }
    };
    fetchUsers();
  }, [preselectedUsers]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNotificationImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitNotification = async () => {
    if (!notificationMessage || !notificationType || !notificationTitle) {
      alert('Please fill in title, message, and type.');
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
        image: notificationImage,
        title: notificationTitle,
      };

      let targetUsers = allSelected ? users : selectedUsers;
      if (targetUsers.length === 0) {
        alert('Please select at least one user.');
        return;
      }

      if (isEditing && editNotificationId) {
        // Update existing notification
        await firebaseController.updateNotification(editNotificationId, notificationData);
        await Promise.all(
          targetUsers.map((user: any) =>
            firebaseController.updateUserNotification(user.id, editNotificationId, notificationData)
          )
        );
        alert('Notification updated successfully!');
      } else {
        // Add new notification
        const notificationId = await firebaseController.addNotification(notificationData);
        await Promise.all(
          targetUsers.map((user: any) =>
            firebaseController.addUserNotification(user.id, notificationId, notificationData)
          )
        );
        alert('Notification sent successfully!');
      }

      setNotificationMessage('');
      setNotificationType('info');
      setNotificationTitle('');
      setNotificationImage('');
      setIsEditing(false);
      setEditNotificationId(null);
      setSelectedUsers(users);
      setAllSelected(true);
      fetchNotifications();
    } catch (error) {
      console.error('Error processing notification:', error);
      alert('Failed to process notification.');
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

  const handleEditNotification = (notification: any) => {
    setNotificationMessage(notification.message);
    setNotificationType(notification.type || 'info');
    setNotificationTitle(notification.title || '');
    setNotificationImage(notification.image || '');
    setIsEditing(true);
    setEditNotificationId(notification.id);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        const adminRefferal = getAdminRefferal();
        if (adminRefferal) {
          const childUsers = await firebaseController.fetchUsersByRefferal(adminRefferal);
          // Delete from main collection
          await firebaseController.deleteNotification(notificationId);
          // Delete from all child users' collections
          await Promise.all(
            childUsers.map((user) =>
              firebaseController.deleteUserNotification(user.id, notificationId)
            )
          );
          alert('Notification deleted successfully!');
          fetchNotifications(); // Refresh the list
        } else {
          alert('Admin referral not found. Cannot delete notification.');
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        alert('Failed to delete notification.');
      }
    }
  };

  return (
    <DashboardContent>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Notifications
      </Typography>

      <Card sx={{ p: 3, mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {isEditing ? 'Edit Notification' : 'Create New Notification'}
        </Typography>
        <TextField
          fullWidth
          label="Notification Title"
          value={notificationTitle}
          onChange={(e) => setNotificationTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Notification Message"
          multiline
          rows={4}
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="outlined" component="label" sx={{ mb: 2 }}>
          {notificationImage ? 'Change Image' : 'Upload Image'}
          <input type="file" accept="image/*" hidden onChange={handleImageChange} />
        </Button>
        {notificationImage && (
          <Box sx={{ mb: 2 }}>
            <img
              src={notificationImage}
              alt="Notification"
              style={{ maxWidth: 200, maxHeight: 100 }}
            />
          </Box>
        )}
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
        <Autocomplete
          multiple
          options={users}
          getOptionLabel={(option) => option.name || option.email || option.id}
          value={allSelected ? users : selectedUsers}
          onChange={(_, value) => {
            setSelectedUsers(value);
            setAllSelected(value.length === users.length);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Select Users" placeholder="Users" />
          )}
          disableCloseOnSelect
          sx={{ mb: 2 }}
        />
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            size="small"
            variant={allSelected ? 'contained' : 'outlined'}
            onClick={() => {
              setSelectedUsers(users);
              setAllSelected(true);
            }}
          >
            Select All Users
          </Button>
          <Button variant="contained" onClick={handleSubmitNotification}>
            {isEditing ? 'Update Notification' : 'Send Notification'}
          </Button>
        </Stack>
        {isEditing && (
          <Button
            variant="outlined"
            onClick={() => {
              setIsEditing(false);
              setEditNotificationId(null);
              setNotificationMessage('');
              setNotificationType('info');
              setNotificationTitle('');
              setNotificationImage('');
            }}
            sx={{ ml: 2 }}
          >
            Cancel Edit
          </Button>
        )}
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
                <ListItem
                  button
                  onClick={() => handleOpenDialog(notification)}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent ListItem onClick from firing
                          handleEditNotification(notification);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent ListItem onClick from firing
                          handleDeleteNotification(notification.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={notification.title || notification.message}
                    secondary={
                      <>
                        {notification.image && (
                          <img
                            src={notification.image}
                            alt="Notification"
                            style={{
                              maxWidth: 100,
                              maxHeight: 50,
                              display: 'block',
                              marginBottom: 4,
                            }}
                          />
                        )}
                        {notification.message}
                        <br />
                        Type: {notification.type || 'N/A'} | Created At:{' '}
                        {notification.createdAt.seconds
                          ? new Date(notification.createdAt.seconds * 1000).toLocaleString()
                          : 'N/A'}
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        )}
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedNotification?.title || selectedNotification?.message}</DialogTitle>
        <DialogContent dividers>
          {selectedNotification?.image && (
            <Box sx={{ mb: 2 }}>
              <img
                src={selectedNotification.image}
                alt="Notification"
                style={{ maxWidth: 200, maxHeight: 100 }}
              />
            </Box>
          )}
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
