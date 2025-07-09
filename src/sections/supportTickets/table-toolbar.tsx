import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type SupportTicketTableToolbarProps = {
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string;
  onFilterStatus: (event: SelectChangeEvent<string>, child: React.ReactNode) => void;
};

export function SupportTicketTableToolbar({
  filterName,
  onFilterName,
  filterStatus,
  onFilterStatus,
}: SupportTicketTableToolbarProps) {
  return (
    <Toolbar
      sx={{
        height: 96,
        display: 'flex',
        justifyContent: 'space-between',
        p: (theme) => theme.spacing(0, 1, 0, 3),
      }}
    >
      <OutlinedInput
        fullWidth
        value={filterName}
        onChange={onFilterName}
        placeholder="Search by user email or subject..."
        startAdornment={
          <InputAdornment position="start">
            <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
          </InputAdornment>
        }
        sx={{ maxWidth: 320 }}
      />
      <Box sx={{ minWidth: 160, ml: 2 }}>
        <Select value={filterStatus} onChange={onFilterStatus} displayEmpty size="small">
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </Select>
      </Box>
    </Toolbar>
  );
}
