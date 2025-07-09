import { useEffect, useState, useCallback } from 'react';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { SelectChangeEvent } from '@mui/material/Select';

import { firebaseController, SupportTicket } from 'src/utils/firebaseMiddleware';
import { SupportTicketTableHead } from './table-head';
import { SupportTicketTableToolbar } from './table-toolbar';
import { SupportTicketTableRow } from './table-row';
import { SupportTicketDetailDialog } from './detail-dialog';

const HEAD_LABEL = [
  { id: 'userEmail', label: 'User Email', sortable: false },
  { id: 'subject', label: 'Subject', sortable: false },
  { id: 'message', label: 'Message', sortable: false },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'createdAt', label: 'Created At', sortable: true },
];

function descendingComparator(a: any, b: any, orderBy: string) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order: 'asc' | 'desc', orderBy: string) {
  return order === 'desc'
    ? (a: any, b: any) => descendingComparator(a, b, orderBy)
    : (a: any, b: any) => -descendingComparator(a, b, orderBy);
}

export default function SupportTicketsView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const options: any = {};
      if (filterStatus) options.status = filterStatus;
      if (filterName) options.search = filterName;
      const data = await firebaseController.fetchSupportTickets(options);
      // Type guard: filter out incomplete tickets
      setTickets(
        Array.isArray(data)
          ? data.filter(
              (t): t is SupportTicket =>
                !!t.userEmail && !!t.subject && !!t.message && !!t.status && !!t.createdAt
            )
          : []
      );
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterName]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSort = (id: string) => {
    if (orderBy === id) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(id);
      setOrder('asc');
    }
  };

  const handleOpenDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedTicket(null);
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    await firebaseController.updateSupportTicketStatus(ticketId, newStatus);
    fetchTickets();
  };

  // Sorting and pagination
  const sortedTickets = [...tickets].sort(getComparator(order, orderBy));
  const paginatedTickets = sortedTickets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Support Tickets
        </Typography>
      </Box>
      <Card>
        <SupportTicketTableToolbar
          filterName={filterName}
          onFilterName={(e) => {
            setFilterName(e.target.value);
            setPage(0);
          }}
          filterStatus={filterStatus}
          onFilterStatus={(e) => {
            setFilterStatus((e as SelectChangeEvent<string>).target.value as string);
            setPage(0);
          }}
        />
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <SupportTicketTableHead
              order={order}
              orderBy={orderBy}
              onSort={handleSort}
              headLabel={HEAD_LABEL}
            />
            <TableBody>
              {paginatedTickets.map((ticket) => (
                <SupportTicketTableRow
                  key={ticket.id}
                  ticket={ticket}
                  selected={selectedTicket?.id === ticket.id}
                  onOpenDetail={handleOpenDetail}
                />
              ))}
              {paginatedTickets.length === 0 && (
                <tr>
                  <td colSpan={HEAD_LABEL.length} style={{ textAlign: 'center', padding: 32 }}>
                    {loading ? 'Loading...' : 'No tickets found.'}
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={tickets.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>
      <SupportTicketDetailDialog
        open={detailOpen}
        ticket={selectedTicket}
        onClose={handleCloseDetail}
        onUpdateStatus={handleUpdateStatus}
      />
    </Box>
  );
}
