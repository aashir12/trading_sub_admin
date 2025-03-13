// Import necessary hooks and components
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { firebaseController } from '../../utils/firebaseMiddleware';

export function ArchiveForm() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [assets, setAssets] = useState('');
  const [material, setMaterial] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !location || !assets || !material) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const docData = { title, location, assets, material };
      await firebaseController.addArchive1Entry(docData);
      alert('Entry successfully added!');
      fetchArchiveData();
    } catch (error) {
      console.error('Error adding entry:', error);
      alert(`Error adding entry: ${error.message}`);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const fetchArchiveData = async () => {};

  useEffect(() => {
    fetchArchiveData(); // Fetch data on component mount
  }, []);

  const renderArchiveForm = (
    <Box
      component="form"
      onSubmit={handleSubmit}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
    >
      <TextField
        fullWidth
        name="title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="location"
        label="location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="assets"
        label="Assets"
        value={assets}
        onChange={(e) => setAssets(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="material"
        label="Material"
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        sx={{ mb: 3 }}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        loading={loading}
      >
        {loading ? 'Adding...' : 'Add Entry'}
      </LoadingButton>
    </Box>
  );

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Archive Form
      </Typography>
      {renderArchiveForm}
    </>
  );
}
