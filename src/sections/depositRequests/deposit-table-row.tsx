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
};

type DepositRequest = {
  id: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  amount: number;
  fileName: string;
  fileType: string;
  proofImageBase64: string;
  status: string;
  userEmail: string;
  userId: string;
};

export function UserTableRow({ row, selected, onSelectRow }: UserTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [frozenAmount, setFrozenAmount] = useState<number>(0);
  const [trades, setTrades] = useState<any[]>([]);
  const [tradesModalOpen, setTradesModalOpen] = useState(false);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

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

    const fetchDepositRequests = async () => {
      try {
        const requests = await firebaseController.getDepositRequest(row.id);
        if (requests && requests.length > 0) {
          console.log('Raw deposit requests data:', requests);
          setDepositRequests(requests as DepositRequest[]);
        }
      } catch (error) {
        console.error('Error fetching deposit requests:', error);
      }
    };

    fetchBalance();
    fetchTrades();
    fetchDepositRequests();
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
    try {
      const db = getFirestore();
      const requestRef = doc(db, 'users', row.id, 'reviewDeposit', requestId);
      await updateDoc(requestRef, { status: newStatus });

      // Update local state
      setDepositRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? { ...request, status: newStatus } : request
        )
      );
    } catch (error) {
      console.error('Error updating deposit request status:', error);
      alert('Failed to update status');
    }
  };

  const handleImageClick = (imageBase64: string) => {
    setSelectedImage(imageBase64);
    setImagePreviewOpen(true);
  };

  const handleCloseImagePreview = () => {
    setImagePreviewOpen(false);
    setSelectedImage('');
  };

  // If no deposit requests, don't render the row
  if (depositRequests.length === 0) {
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
            {expanded ? 'Hide Requests' : `Show Requests (${depositRequests.length})`}
          </Button>
        </TableCell>
        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
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
                Deposit Requests
              </Typography>
              {depositRequests.map((request) => (
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
                    <Typography>File Name: {request.fileName}</Typography>
                    <Typography>File Type: {request.fileType}</Typography>
                    {request.proofImageBase64 && (
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Proof Image:
                        </Typography>
                        <Button
                          onClick={() => handleImageClick(request.proofImageBase64)}
                          sx={{
                            p: 0,
                            '&:hover': {
                              bgcolor: 'transparent',
                              '& img': {
                                transform: 'scale(1.02)',
                              },
                            },
                          }}
                        >
                          <img
                            src={request.proofImageBase64}
                            alt="Deposit Proof"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '200px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                            }}
                          />
                        </Button>
                      </Box>
                    )}
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

      <Dialog
        open={imagePreviewOpen}
        onClose={handleCloseImagePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 2,
          },
        }}
      >
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6">Proof Image Preview</Typography>
          <IconButton onClick={handleCloseImagePreview} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              minHeight: '400px',
            }}
          >
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size proof"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 140 },
        }}
      >
        <MenuList>
          <MenuItem
            onClick={handleDelete}
            sx={{
              [`&.${menuItemClasses.root}`]: {
                color: 'error.main',
              },
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
