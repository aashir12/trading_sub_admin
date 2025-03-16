import { useState, useCallback } from 'react';

import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Iconify } from 'src/components/iconify';
import { firebaseController } from 'src/utils/firebaseMiddleware';

// ----------------------------------------------------------------------

export type UserProps = {
  id: string;
  title: string;
  assets: string;
  material: string;
  location: string;
};

type Props = {
  row: UserProps;
  selected: boolean;
  onSelectRow: VoidFunction;
};

export function UserTableRow({ row, selected, onSelectRow }: Props) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  // if (row.status === 'approved') {
  //   console.log(row.status);
  // } else {
  //   row.status = 'error';
  // }

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleDelete = async () => {
    try {
      await firebaseController.deleteArchive1Entry(row.id);
      console.log('Archive entry deleted successfully');
      window.location.reload(); // Refresh the page after deletion
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
    handleClosePopover();
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>
        <TableCell>{row.title}</TableCell>
        <TableCell>{row.location}</TableCell>
        <TableCell>{row.assets}</TableCell>
        <TableCell>{row.material}</TableCell>
        {/* 
        <TableCell>
          <Label color={(row.status === 'banned' && 'error') || 'success'}>
            {row.status === 'approved' ? 'Approved' : 'Pending'}
          </Label>
        </TableCell> */}
        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

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
