import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { SupportTicket } from 'src/utils/firebaseMiddleware';

// ----------------------------------------------------------------------

type SupportTicketTableRowProps = {
  ticket: SupportTicket;
  selected: boolean;
  onOpenDetail: (ticket: SupportTicket) => void;
};

export function SupportTicketTableRow({
  ticket,
  selected,
  onOpenDetail,
}: SupportTicketTableRowProps) {
  return (
    <TableRow
      hover
      selected={selected}
      onClick={() => onOpenDetail(ticket)}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell>{ticket.userEmail}</TableCell>
      <TableCell>{ticket.subject}</TableCell>
      <TableCell>
        {ticket.message.length > 40 ? `${ticket.message.slice(0, 40)}…` : ticket.message}
      </TableCell>
      <TableCell>{ticket.status}</TableCell>
      <TableCell>
        {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : ''}
      </TableCell>
    </TableRow>
  );
}
