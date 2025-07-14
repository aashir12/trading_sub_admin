import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';

import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { Iconify } from 'src/components/iconify';
import { firebaseController } from '../../utils/firebaseMiddleware';

export type UserProps = {
  id: string;
  name: string;
  email: string;
  referrals: object;
  withdrawalRequests?: number;
  deposit?: number;
  notifications?: string;
};

type UserTableRowProps = {
  row: UserProps;
  selected: boolean;
  onSelectRow: () => void;
  requestTab: 'pending' | 'closed'; // Add prop for tab selection
};

type WithdrawalRequest = {
  id: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  amount: number;
  accountDetails: {
    additionalInfo: string;
    accountNumber: string;
    bankName: string;
    phoneNumber: string;
    accountName: string;
    swiftCode: string;
  };
  userId: string;
  requestId: string;
  status: string;
  userEmail: string;
};

export function UserTableRow({ row, selected, onSelectRow, requestTab }: UserTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [frozenAmount, setFrozenAmount] = useState<number>(0);
  const [trades, setTrades] = useState<any[]>([]);
  const [tradesModalOpen, setTradesModalOpen] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const db = getFirestore();
        const balanceDocRef = doc(db, 'users', row.id, 'balance', 'main');
        const balanceDoc = await getDoc(balanceDocRef);
        if (balanceDoc.exists()) {
          const currentBalanceData = balanceDoc.data();
          const currentBalance = Number(currentBalanceData.availableBalance) || 0;
          const currentFrozenAmount = Number(currentBalanceData.frozenBalance) || 0;
          setBalance(currentBalance);
          setFrozenAmount(currentFrozenAmount);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    const fetchTrades = async () => {
      try {
        const db = getFirestore();
        const contractsCol = collection(db, 'users', row.id, 'contracts');
        const contractsSnap = await getDocs(contractsCol);
        const tradesList = contractsSnap.docs.map((tradeDoc) => ({
          id: tradeDoc.id,
          ...tradeDoc.data(),
        }));
        setTrades(tradesList);
      } catch (error) {
        console.error('Error fetching trades:', error);
      }
    };

    const fetchWithdrawalRequests = async () => {
      try {
        const requests = await firebaseController.getWithdrawlRequest(row.id);
        if (requests && requests.length > 0) {
          console.log('Raw withdrawal requests data:', requests);
          setWithdrawalRequests(requests as WithdrawalRequest[]);
        }
      } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
      }
    };

    fetchBalance();
    fetchTrades();
    fetchWithdrawalRequests();
  }, [row.id, row.name]);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleDelete = async () => {
    try {
      await firebaseController.deleteUserEntry(row.id);
      console.log('User entry deleted successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
    handleClosePopover();
  };

  const handleOpenTradesModal = () => setTradesModalOpen(true);
  const handleCloseTradesModal = () => setTradesModalOpen(false);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    if (newStatus === 'rejected') {
      setPendingRejectId(requestId);
      setRejectionDialogOpen(true);
      return;
    }
    try {
      const db = getFirestore();
      const requestRef = doc(db, 'users', row.id, 'reviewWithdraw', requestId);
      await updateDoc(requestRef, { status: newStatus });
      setWithdrawalRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? { ...request, status: newStatus } : request
        )
      );
    } catch (error) {
      console.error('Error updating withdrawal request status:', error);
      alert('Failed to update status');
    }
  };

  const handleRejectConfirm = async () => {
    if (!pendingRejectId || !rejectionReason.trim()) return;
    try {
      const db = getFirestore();
      const requestRef = doc(db, 'users', row.id, 'reviewWithdraw', pendingRejectId);
      await updateDoc(requestRef, { status: 'rejected', rejectionReason });
      setWithdrawalRequests((prev) =>
        prev.map((request) =>
          request.id === pendingRejectId
            ? { ...request, status: 'rejected', rejectionReason }
            : request
        )
      );
      setRejectionDialogOpen(false);
      setRejectionReason('');
      setPendingRejectId(null);
    } catch (error) {
      console.error('Error updating withdrawal request status:', error);
      alert('Failed to update status');
    }
  };

  const handleRejectCancel = () => {
    setRejectionDialogOpen(false);
    setRejectionReason('');
    setPendingRejectId(null);
  };

  // Filter withdrawal requests based on selected tab
  let filteredWithdrawalRequests = withdrawalRequests.filter((request) =>
    requestTab === 'pending' ? request.status === 'pending' : request.status !== 'pending'
  );
  // Sort by createdAt descending (newest first)
  filteredWithdrawalRequests = filteredWithdrawalRequests.sort((a, b) => {
    const aTime = a.createdAt?.seconds ? a.createdAt.seconds : 0;
    const bTime = b.createdAt?.seconds ? b.createdAt.seconds : 0;
    return bTime - aTime;
  });

  // If no withdrawal requests, don't render the row
  if (filteredWithdrawalRequests.length === 0) {
    return null;
  }

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.email}</TableCell>
        <TableCell align="center">{Number(balance).toFixed(2)}</TableCell>
        <TableCell align="center">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ mr: 1 }}
          >
            {expanded ? 'Hide Requests' : `Show Requests (${filteredWithdrawalRequests.length})`}
          </Button>
        </TableCell>
        <TableCell align="right"></TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  User Balance Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Typography>Available Balance: ${Number(balance).toFixed(2)}</Typography>
                  <Typography>Frozen Balance: ${Number(frozenAmount).toFixed(2)}</Typography>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom component="div">
                Withdrawal Requests
              </Typography>
              {filteredWithdrawalRequests.map((request) => (
                <Paper key={request.id} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1">Request ID: {request.id}</Typography>
                    <Select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <Typography>Amount: ${request.amount}</Typography>
                    <Typography>Status: {request.status}</Typography>
                    <Typography>User Email: {request.userEmail}</Typography>
                    <Typography>
                      Created At:{' '}
                      {request.createdAt.seconds
                        ? new Date(request.createdAt.seconds * 1000).toLocaleString()
                        : 'N/A'}
                    </Typography>
                    <Typography>Bank Name: {request.accountDetails.bankName}</Typography>
                    <Typography>Account Name: {request.accountDetails.accountName}</Typography>
                    <Typography>Account Number: {request.accountDetails.accountNumber}</Typography>
                    <Typography>
                      Additional Info: {request.accountDetails.additionalInfo}
                    </Typography>
                    <Typography>Phone Number: {request.accountDetails.phoneNumber}</Typography>
                    <Typography>IFSC Code: {request.accountDetails.swiftCode}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <Dialog open={tradesModalOpen} onClose={handleCloseTradesModal} maxWidth="md" fullWidth>
        <DialogTitle>Trades List</DialogTitle>
        <DialogContent dividers>
          {trades.length === 0 ? (
            <div>No trades found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Coin</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Entry Price</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Order Type</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Return %</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8 }}>{trade.coinName}</td>
                    <td style={{ padding: 8 }}>{trade.amount}</td>
                    <td style={{ padding: 8 }}>
                      <Select
                        value={trade.status}
                        size="small"
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const db = getFirestore();
                          const contractDocRef = doc(db, 'users', row.id, 'contracts', trade.id);
                          await updateDoc(contractDocRef, { status: newStatus });
                          setTrades((prev) =>
                            prev.map((t, i) => (i === idx ? { ...t, status: newStatus } : t))
                          );
                        }}
                      >
                        <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                        <MenuItem value="LOSS">LOSS</MenuItem>
                        <MenuItem value="WIN">WIN</MenuItem>
                      </Select>
                    </td>
                    <td style={{ padding: 8 }}>{trade.type}</td>
                    <td style={{ padding: 8 }}>{trade.entryPrice}</td>
                    <td style={{ padding: 8 }}>{trade.orderType}</td>
                    <td style={{ padding: 8 }}>{trade.returnPercentage}</td>
                    <td style={{ padding: 8 }}>
                      {trade.timestamp && trade.timestamp.seconds
                        ? new Date(trade.timestamp.seconds * 1000).toLocaleString()
                        : trade.timestamp || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTradesModal}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectionDialogOpen} onClose={handleRejectCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Rejection Reason</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Reason for rejection"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCancel}>Cancel</Button>
          <Button
            onClick={handleRejectConfirm}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim()}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
