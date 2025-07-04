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
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    type: 'contract' | 'trade';
    idx: number;
    newStatus: string;
  } | null>(null);
  const [changedContracts, setChangedContracts] = useState<{ [id: string]: boolean }>({});
  const [changedTrades, setChangedTrades] = useState<{ [id: string]: boolean }>({});

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
        const changed: { [id: string]: boolean } = {};
        contractsList.forEach((trade) => {
          if (trade.statusChanged) changed[trade.id] = true;
        });
        setChangedContracts(changed);
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
        const changed: { [id: string]: boolean } = {};
        tradesArr.forEach((trade) => {
          if (trade.statusChanged) changed[trade.id] = true;
        });
        setChangedTrades(changed);
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
    setChangedContracts({});
    setChangedTrades({});
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

  const handleStatusChangeRequest = (
    type: 'contract' | 'trade',
    idx: number,
    newStatus: string
  ) => {
    setPendingStatusChange({ type, idx, newStatus });
    setStatusDialogOpen(true);
  };

  const handleStatusChangeConfirm = async () => {
    if (!pendingStatusChange) return;
    const { type, idx, newStatus } = pendingStatusChange;
    if (type === 'contract') {
      const trade = trades[idx];
      const db = getFirestore();
      const contractDocRef = doc(db, 'users', row.id, 'contracts', trade.id);
      await updateDoc(contractDocRef, { status: newStatus, statusChanged: true });
      setTrades((prev) =>
        prev.map((t, i) => (i === idx ? { ...t, status: newStatus, statusChanged: true } : t))
      );
      setChangedContracts((prev) => ({ ...prev, [trade.id]: true }));
    } else if (type === 'trade') {
      const trade = tradesList[idx];
      const db = getFirestore();
      const tradeDocRef = doc(db, 'users', row.id, 'trades', trade.id);
      await updateDoc(tradeDocRef, { status: newStatus, statusChanged: true });
      setTradesList((prev) =>
        prev.map((t, i) => (i === idx ? { ...t, status: newStatus, statusChanged: true } : t))
      );
      setChangedTrades((prev) => ({ ...prev, [trade.id]: true }));
      if (newStatus === 'WIN') {
        const winAmount =
          Number(trade.fromAmount) +
          (Number(trade.fromAmount) * Number(trade.returnPercentage || 0)) / 100;
        try {
          const balanceDocRef = doc(db, 'users', row.id, 'balance', 'main');
          const balanceDoc = await getDoc(balanceDocRef);
          let currentBalance = 0;
          if (balanceDoc.exists()) {
            const currentBalanceData = balanceDoc.data();
            currentBalance = Number(currentBalanceData.availableBalance) || 0;
          }
          const updatedBalance = currentBalance + winAmount;
          await updateDoc(balanceDocRef, { availableBalance: updatedBalance });
          setBalance(updatedBalance);
        } catch (error) {
          console.error('Error updating balance for WIN:', error);
        }
      }
    }
    setStatusDialogOpen(false);
    setPendingStatusChange(null);
  };

  const handleStatusChangeCancel = () => {
    setStatusDialogOpen(false);
    setPendingStatusChange(null);
  };

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
              <FlagIcon code={row.country} size={20} />
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
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpenTradesAside}
            disabled={tradesList.length === 0}
          >
            View Trades
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
                        disabled={!!changedContracts[trade.id]}
                        onChange={(e) => handleStatusChangeRequest('contract', idx, e.target.value)}
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
                    <td style={{ padding: 8 }}>
                      <Select
                        value={trade.status}
                        size="small"
                        disabled={!!changedTrades[trade.id]}
                        onChange={(e) => handleStatusChangeRequest('trade', idx, e.target.value)}
                      >
                        <MenuItem value="pending">PENDING</MenuItem>
                        <MenuItem value="WIN">WIN</MenuItem>
                        <MenuItem value="LOSS">LOSS</MenuItem>
                      </Select>
                    </td>
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

      <Dialog open={statusDialogOpen} onClose={handleStatusChangeCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent dividers>
          Are you sure you want to change the status? This action can only be performed once.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusChangeCancel}>Cancel</Button>
          <Button onClick={handleStatusChangeConfirm} variant="contained" color="primary">
            Confirm
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
