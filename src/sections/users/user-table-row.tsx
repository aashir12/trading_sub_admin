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

export function UserTableRow({ row, selected, onSelectRow }: UserTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [trades, setTrades] = useState<any[]>([]);
  const [tradesModalOpen, setTradesModalOpen] = useState(false);
  const [updateBalanceModalOpen, setUpdateBalanceModalOpen] = useState(false);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [frozenAmount, setFrozenAmount] = useState<number>(0);

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
        const tradesList = contractsSnap.docs.map((tradeDoc) => ({
          id: tradeDoc.id,
          ...tradeDoc.data(),
        }));
        setTrades(tradesList);
      } catch (error) {
        console.error('Error fetching trades:', error);
      }
    };

    fetchBalance();
    fetchTrades();
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

  const handleOpenUpdateBalanceModal = () => setUpdateBalanceModalOpen(true);
  const handleCloseUpdateBalanceModal = () => setUpdateBalanceModalOpen(false);

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
            onClick={handleOpenTradesModal}
            disabled={trades.length === 0}
            sx={{ mr: 1 }}
          >
            View Trades
          </Button>
        </TableCell>
        <TableCell align="center">
          <Button variant="contained" size="small" onClick={handleOpenUpdateBalanceModal}>
            Update Balance
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
