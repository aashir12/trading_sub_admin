import { useState, useCallback, useEffect } from 'react';
import {
  doc,
  getDoc,
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

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
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

import { Iconify } from 'src/components/iconify';
import { FlagIcon } from 'src/components/iconify/flag-icon';
import { firebaseController } from '../../utils/firebaseMiddleware';

export type UserProps = {
  id: string;
  name: string;
  email: string;
  referrals: object;
  withdrawalRequests?: number;
  deposit?: number;
  notifications?: string;
  isFrozen?: boolean;
  country?: string;
  creditScore?: number;
};

type UserTableRowProps = {
  row: UserProps;
  selected: boolean;
  onSelectRow: () => void;
  highlighted?: boolean;
  showNotification?: boolean;
};

export function UserTableRow({
  row,
  selected,
  onSelectRow,
  highlighted = false,
  showNotification = false,
}: UserTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [trades, setTrades] = useState<any[]>([]);
  const [tradesModalOpen, setTradesModalOpen] = useState(false);
  const [updateBalanceModalOpen, setUpdateBalanceModalOpen] = useState(false);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [frozenAmount, setFrozenAmount] = useState<number>(0);
  const [isFrozen, setIsFrozen] = useState<boolean>(row.isFrozen ?? false);
  const [tradesList, setTradesList] = useState<any[]>([]);
  const [tradesAsideOpen, setTradesAsideOpen] = useState(false);
  const [creditScore, setCreditScore] = useState<number>(row.creditScore ?? 100);
  const [creditScoreDialogOpen, setCreditScoreDialogOpen] = useState(false);
  const [newCreditScore, setNewCreditScore] = useState<number>(creditScore);
  // Update snackbar state type to restrict severity
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    { open: false, message: '', severity: 'success' }
  );

  // Auto-set creditScore to 100 if not present in Firestore
  useEffect(() => {
    if (row.creditScore === undefined) {
      const db = getFirestore();
      updateDoc(doc(db, 'users', row.id), { creditScore: 100 });
    }
  }, [row.creditScore, row.id]);

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
          setNewBalance(currentBalance);
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
        const contractsList = contractsSnap.docs.map((tradeDoc) => ({
          id: tradeDoc.id,
          ...(tradeDoc.data() as { [key: string]: any; statusChanged?: boolean }),
        }));
        setTrades(contractsList);
      } catch (error) {
        console.error('Error fetching trades:', error);
      }
    };

    const fetchTradesCollection = async () => {
      try {
        const db = getFirestore();
        const tradesCol = collection(db, 'users', row.id, 'trades');
        const tradesSnap = await getDocs(tradesCol);
        const tradesArr = tradesSnap.docs.map((tradeDoc) => ({
          id: tradeDoc.id,
          ...(tradeDoc.data() as { [key: string]: any; statusChanged?: boolean }),
        }));
        setTradesList(tradesArr);
        console.log('Fetched trades from "trades" collection:', tradesArr);
      } catch (error) {
        console.error('Error fetching trades from "trades" collection:', error);
      }
    };

    const fetchIsFrozen = async () => {
      try {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', row.id);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsFrozen(!!userData.isFrozen);
        }
      } catch (error) {
        console.error('Error fetching freeze status:', error);
      }
    };

    fetchBalance();
    fetchTrades();
    fetchIsFrozen();
    fetchTradesCollection();
  }, [row.id]);

  useEffect(() => {
    const db = getFirestore();
    const unsubContracts = onSnapshot(collection(db, 'users', row.id, 'contracts'), (snapshot) => {
      const contractsList = snapshot.docs.map((tradeDoc) => ({
        id: tradeDoc.id,
        ...tradeDoc.data(),
      }));
      setTrades(contractsList);
    });
    const unsubTrades = onSnapshot(collection(db, 'users', row.id, 'trades'), (snapshot) => {
      const tradesArr = snapshot.docs.map((tradeDoc) => ({
        id: tradeDoc.id,
        ...tradeDoc.data(),
      }));
      setTradesList(tradesArr);
    });
    return () => {
      unsubContracts();
      unsubTrades();
    };
  }, [row.id]);

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
  const handleOpenTradesAside = () => setTradesAsideOpen(true);
  const handleCloseTradesAside = () => setTradesAsideOpen(false);

  const handleOpenUpdateBalanceModal = () => setUpdateBalanceModalOpen(true);
  const handleCloseUpdateBalanceModal = () => setUpdateBalanceModalOpen(false);

  const handleOpenCreditScoreDialog = () => {
    setNewCreditScore(creditScore);
    setCreditScoreDialogOpen(true);
  };
  const handleCloseCreditScoreDialog = () => setCreditScoreDialogOpen(false);
  const handleSaveCreditScore = async () => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', row.id), { creditScore: newCreditScore });
      setCreditScore(newCreditScore);
      setCreditScoreDialogOpen(false);
    } catch (error) {
      alert('Failed to update credit score');
    }
  };

  const handleUpdateBalance = async () => {
    try {
      await firebaseController.updateUserBalance(row.id, newBalance);
      await firebaseController.updateUserFreezeBalance(row.id, frozenAmount);
      setBalance(newBalance);
      handleCloseUpdateBalanceModal();
      alert('Balance updated successfully!');
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update balance.');
    }
  };

  const handleToggleFreeze = async () => {
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', row.id);
      await updateDoc(userDocRef, { isFrozen: !isFrozen });
      setIsFrozen((prev) => !prev);
    } catch (error) {
      console.error('Error updating freeze status:', error);
      alert('Failed to update freeze status.');
    }
  };

  // Sort trades by timestamp descending (newest first)
  const sortedTrades = [...trades].sort((a, b) => {
    const aTime = a.timestamp?.seconds ? a.timestamp.seconds : 0;
    const bTime = b.timestamp?.seconds ? b.timestamp.seconds : 0;
    return bTime - aTime;
  });

  return (
    <>
      <TableRow
        hover
        tabIndex={-1}
        role="checkbox"
        selected={selected}
        sx={
          highlighted
            ? { backgroundColor: '#fff3cd !important', transition: 'background 0.3s' }
            : {}
        }
      >
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>
        <TableCell sx={{ position: 'relative' }}>
          {row.country && (
            <span style={{ marginRight: 8, verticalAlign: 'middle' }}>
              <FlagIcon code={row.country} />
            </span>
          )}
          {row.name}
          {showNotification && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: -10,
                width: 10,
                height: 10,
                background: '#d32f2f',
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: '0 0 0 2px #fff',
              }}
            />
          )}
        </TableCell>
        <TableCell>{row.email}</TableCell>
        <TableCell align="center">{Number(balance).toFixed(2)}</TableCell>
        <TableCell align="center">
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpenTradesModal}
            disabled={trades.length === 0}
            sx={{ mr: 1 }}
          >
            View Contracts
          </Button>
        </TableCell>
        <TableCell align="center">
          <Button variant="contained" size="small" onClick={handleOpenUpdateBalanceModal}>
            Update Balance
          </Button>
        </TableCell>
        <TableCell align="center">
          <Button
            variant={isFrozen ? 'outlined' : 'contained'}
            color={isFrozen ? 'warning' : 'success'}
            size="small"
            onClick={handleToggleFreeze}
          >
            {isFrozen ? 'Unfreeze' : 'Freeze'}
          </Button>
        </TableCell>
        <TableCell align="center">
          <Button variant="outlined" size="small" onClick={handleOpenCreditScoreDialog}>
            Credit Score: {creditScore}
          </Button>
        </TableCell>
        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
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
                {sortedTrades.map((trade, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8 }}>{trade.coinName}</td>
                    <td style={{ padding: 8 }}>{trade.amount}</td>
                    <td style={{ padding: 8 }}>
                      <Select
                        value={trade.status}
                        size="small"
                        disabled={trade.status !== 'ACTIVE'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          const db = getFirestore();
                          const contractDocRef = doc(db, 'users', row.id, 'contracts', trade.id);
                          try {
                            await updateDoc(contractDocRef, { status: newStatus });
                            if (newStatus === 'WIN') {
                              // Update user balance
                              const amount = Number(trade.amount) || 0;
                              const returnPercentage = Number(trade.returnPercentage) || 0;
                              const winAmount = amount + (amount * returnPercentage) / 100;
                              const balanceDocRef = doc(db, 'users', row.id, 'balance', 'main');
                              const balanceDoc = await getDoc(balanceDocRef);
                              let currentBalance = 0;
                              if (balanceDoc.exists()) {
                                const currentBalanceData = balanceDoc.data();
                                currentBalance = Number(currentBalanceData.availableBalance) || 0;
                              }
                              const updatedBalance = currentBalance + winAmount;
                              await updateDoc(balanceDocRef, { availableBalance: updatedBalance });
                              setSnackbar({
                                open: true,
                                message: 'Status and balance updated successfully!',
                                severity: 'success',
                              });
                            } else {
                              setSnackbar({
                                open: true,
                                message: 'Status updated successfully!',
                                severity: 'success',
                              });
                            }
                          } catch (error) {
                            setSnackbar({
                              open: true,
                              message: 'Failed to update status or balance.',
                              severity: 'error',
                            });
                            console.error('Failed to update status or balance:', error);
                          }
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
        open={updateBalanceModalOpen}
        onClose={handleCloseUpdateBalanceModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Update User Balance</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="New Balance"
            type="number"
            fullWidth
            value={newBalance}
            onChange={(e) => setNewBalance(Number(e.target.value))}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Frozen Amount"
            type="number"
            fullWidth
            value={frozenAmount}
            onChange={(e) => setFrozenAmount(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateBalanceModal}>Cancel</Button>
          <Button onClick={handleUpdateBalance} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={tradesAsideOpen} onClose={handleCloseTradesAside} maxWidth="md" fullWidth>
        <DialogTitle>Trades (from &quot;trades&quot; collection)</DialogTitle>
        <DialogContent dividers>
          {tradesList.length === 0 ? (
            <div>No trades found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Token</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Token Symbol</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Leverage</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>From Amount</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>To Amount</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Token Price</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Order Type</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Trade ID</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Created At</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>User Email</th>
                </tr>
              </thead>
              <tbody>
                {tradesList.map((trade, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8 }}>{trade.token}</td>
                    <td style={{ padding: 8 }}>{trade.tokenSymbol}</td>
                    <td style={{ padding: 8 }}>{trade.type}</td>
                    <td style={{ padding: 8 }}>{trade.leverage}</td>
                    <td style={{ padding: 8 }}>{trade.fromAmount}</td>
                    <td style={{ padding: 8 }}>{trade.toAmount}</td>
                    <td style={{ padding: 8 }}>{trade.tokenPrice}</td>
                    <td style={{ padding: 8 }}>{trade.orderType}</td>
                    <td style={{ padding: 8 }}>{trade.status}</td>
                    <td style={{ padding: 8 }}>{trade.tradeId}</td>
                    <td style={{ padding: 8 }}>
                      {trade.createdAt && trade.createdAt.seconds
                        ? new Date(trade.createdAt.seconds * 1000).toLocaleString()
                        : ''}
                    </td>
                    <td style={{ padding: 8 }}>{trade.userEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTradesAside}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={creditScoreDialogOpen}
        onClose={handleCloseCreditScoreDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Update Credit Score</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Credit Score"
            type="number"
            fullWidth
            value={newCreditScore}
            onChange={(e) => setNewCreditScore(Number(e.target.value))}
            inputProps={{ min: 0, max: 1000 }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreditScoreDialog}>Cancel</Button>
          <Button onClick={handleSaveCreditScore} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
}
