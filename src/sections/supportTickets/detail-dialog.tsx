import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupportTicket, firebaseController } from 'src/utils/firebaseMiddleware';

// ----------------------------------------------------------------------

type SupportTicketDetailDialogProps = {
  open: boolean;
  ticket: SupportTicket | null;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, newStatus: string) => void;
};

export function SupportTicketDetailDialog({
  open,
  ticket,
  onClose,
  onUpdateStatus,
}: SupportTicketDetailDialogProps) {
  const [status, setStatus] = useState(ticket?.status || '');
  const navigate = useNavigate();

  // Update local status if ticket changes
  React.useEffect(() => {
    setStatus(ticket?.status || '');
  }, [ticket]);

  if (!ticket) return null;

  const handleSave = async () => {
    if (status !== ticket.status) {
      await onUpdateStatus(ticket.id!, status);
      if (status === 'closed') {
        // Delete the ticket after closing
        await firebaseController.deleteSupportTicket(ticket.id!);
        // Redirect to notifications and preselect this user
        navigate('/notifications', {
          state: { preselectedUsers: [{ email: ticket.userEmail }] },
        });
        return;
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Support Ticket Details</DialogTitle>
      <DialogContent dividers>
        <Box mb={2}>
          <Typography variant="subtitle2">User Email:</Typography>
          <Typography>{ticket.userEmail}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Subject:</Typography>
          <Typography>{ticket.subject}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Message:</Typography>
          <Typography sx={{ whiteSpace: 'pre-line' }}>{ticket.message}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Status:</Typography>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </Box>
        <Box mb={2}>
          <Typography variant="subtitle2">Created At:</Typography>
          <Typography>
            {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : ''}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
