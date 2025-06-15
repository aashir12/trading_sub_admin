// Import necessary hooks and components
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { firebaseController } from '../../utils/firebaseMiddleware'; // Adjust the path as necessary

// Define the type for archive data

// ----------------------------------------------------------------------

export function MapForm() {
  const [date, setDate] = useState(''); // State for title
  const [description, setDescription] = useState(''); // State for latitude
  const [longitude, setLongitude] = useState(''); // State for longitude
  const [latitude, setLatitude] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [assets, setAssets] = useState('');
  const [material, setMaterial] = useState('');
  const [location, setLocation] = useState('');
  const [archiveLink, setArchiveLink] = useState('');
  const [relatedLink, setRelatedLink] = useState('');
  const [loading, setLoading] = useState(false); // Loading state

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
      if (!date || !description || !longitude || !projectTitle || !placeName) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true); // Set loading state
    try {
      const docData = { date, description, longitude, latitude, projectTitle, placeName, assets, material, archiveLink, relatedLink, location };
      await firebaseController.addMapEntry(docData); // Use controller to add entry
      alert('Entry successfully added!');
      fetchArchiveData(); // Fetch data after adding
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
        name="date"
        label="Date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="description"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="longitude"
        label="Longitude"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="latitude"
        label="Latitude"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="projectTitle"
        label="Project Title"
        value={projectTitle}
        onChange={(e) => setProjectTitle(e.target.value)}
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
      <TextField
        fullWidth
        name="location"
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="archiveLink"
        label="Archive Link"
        value={archiveLink}
        onChange={(e) => setArchiveLink(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="relatedLink"
        label="Related Link"
        value={relatedLink}
        onChange={(e) => setRelatedLink(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="placeName"
        label="Place Name"
        value={placeName}
        onChange={(e) => setPlaceName(e.target.value)}
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
        Map Form
      </Typography>
      {renderArchiveForm}
    </>
  );
}
