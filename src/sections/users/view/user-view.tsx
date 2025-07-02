import { firebaseController } from 'src/utils/firebaseMiddleware'; // Import the firebase controller
import { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { UserTableRow } from '../user-table-row';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import type { UserProps } from '../user-table-row';

// ----------------------------------------------------------------------

export function UserView() {
  const table = useTable();
  const [data, setData] = useState<any[]>([]);
  const [filterName, setFilterName] = useState('');
  const [highlightedUsers, setHighlightedUsers] = useState<{ [userId: string]: boolean }>({});
  const [notificationUsers, setNotificationUsers] = useState<{ [userId: string]: boolean }>({});

  let dataFiltered: UserProps[] = applyFilter({
    inputData: data, // Use the fetched data directly
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });
  // Sort so highlighted users are on top
  dataFiltered = dataFiltered.sort((a, b) => {
    const aHighlighted = !!highlightedUsers[a.id];
    const bHighlighted = !!highlightedUsers[b.id];
    if (aHighlighted === bHighlighted) return 0;
    return aHighlighted ? -1 : 1;
  });
  console.log(dataFiltered);

  const notFound = !dataFiltered.length && !!filterName;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const adminDataString = localStorage.getItem('adminData');
        if (adminDataString) {
          const adminData = JSON.parse(adminDataString);
          const refferal = adminData.refferal;
          if (refferal) {
            const entries = await firebaseController.fetchUsersByRefferal(refferal); // Fetch data from Firebase based on referral
            setData(entries);
            console.log(entries);
          } else {
            console.error('Referral not found in admin data.');
            setData([]); // Clear data if no referral is found
          }
        } else {
          console.error('Admin data not found in local storage.');
          setData([]); // Clear data if no admin data is found
        }
      } catch (error) {
        console.error('Error fetching data from Firebase:', error);
      }
    };

    fetchData(); // Call the fetch function
  }, []);

  // Real-time listeners for trades and contracts
  useEffect(() => {
    const db = getFirestore();
    const unsubscribes: (() => void)[] = [];
    if (data && data.length > 0) {
      data.forEach((user) => {
        let tradesPending = 0;
        let contractsPending = 0;

        // Helper to update highlight/notification state
        function updateStates() {
          const totalPendingOrActive = tradesPending + contractsPending;
          setHighlightedUsers((prev) => ({ ...prev, [user.id]: totalPendingOrActive > 0 }));
          setNotificationUsers((prev) => ({ ...prev, [user.id]: totalPendingOrActive > 1 }));
        }

        // Listen to trades
        const tradesUnsub = onSnapshot(collection(db, 'users', user.id, 'trades'), (snapshot) => {
          tradesPending = 0;
          snapshot.forEach((doc) => {
            const status = doc.data().status;
            if (status === 'pending' || status === 'ACTIVE') tradesPending += 1;
          });
          updateStates();
        });

        // Listen to contracts
        const contractsUnsub = onSnapshot(
          collection(db, 'users', user.id, 'contracts'),
          (snapshot) => {
            contractsPending = 0;
            snapshot.forEach((doc) => {
              const status = doc.data().status;
              if (status === 'pending' || status === 'ACTIVE') contractsPending += 1;
            });
            updateStates();
          }
        );

        unsubscribes.push(tradesUnsub, contractsUnsub);
      });
    }
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [data]);

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" mb={5}>
        <Typography variant="h4" flexGrow={1}>
          Users
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          href="/archive"
        >
          Add New
        </Button>
      </Box>

      <Card>
        <UserTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={data.length} // Use the length of the fetched data
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    data.map((user) => user.id) // Use the fetched data
                  )
                }
                headLabel={[
                  { id: 'name', label: 'Name' },
                  { id: 'email', label: 'Email' },
                  { id: 'balance', label: 'Balance', align: 'center' },
                  { id: 'trade', label: 'Trade', align: 'center' },
                  { id: 'updateBalance', label: 'Update Balance', align: 'center' },

                  { id: 'Options' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <UserTableRow
                      key={row.name} // Ensure you have a unique key
                      row={row}
                      selected={table.selected.includes(row.name)} // Use row.imageUrl for selection
                      onSelectRow={() => table.onSelectRow(row.name)} // Use row.imageUrl for selection
                      highlighted={!!highlightedUsers[row.id]}
                      showNotification={!!notificationUsers[row.id]}
                    />
                  ))}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, data.length)} // Use the length of the fetched data
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={data.length} // Use the length of the fetched data
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('name');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}
