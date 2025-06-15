import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseController } from 'src/utils/firebaseMiddleware';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SignInView() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const username = formData.get('email') as string;
      const password = formData.get('password') as string;

      // Get all admin entries
      const adminEntries = await firebaseController.getAdminEntries();

      // Find matching admin
      const admin = adminEntries.find((entry) => entry.username === username);

      if (!admin) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }

      if (admin.password !== password) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }

      // Store admin data in localStorage
      localStorage.setItem('token', admin.id);
      localStorage.setItem('adminData', JSON.stringify(admin));

      navigate('/');
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An error occurred during sign in');
    }
    setLoading(false);
  };

  const renderForm = (
    <Box
      component="form"
      onSubmit={handleSignIn}
      display="flex"
      flexDirection="column"
      alignItems="flex-end"
    >
      <TextField
        fullWidth
        name="email"
        label="Username"
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2, width: '100%' }}>
          {error}
        </Typography>
      )}

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        loading={loading}
      >
        Sign in
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <Box gap={1.5} display="flex" flexDirection="column" alignItems="center" sx={{ mb: 5 }}>
        <Typography variant="h5">Sign in</Typography>
      </Box>

      {renderForm}
    </>
  );
}
