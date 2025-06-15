import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export type NotificationItemProps = {
  id: string;
  title: string;
  content: string;
  createdAt: any; // Firebase Timestamp
};

export function NotificationItem({ notification }: { notification: NotificationItemProps }) {
  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle1" noWrap>
          {notification.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {notification.content}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {notification.createdAt.seconds
            ? new Date(notification.createdAt.seconds * 1000).toLocaleString()
            : 'N/A'}
        </Typography>
      </Stack>
    </Card>
  );
}
