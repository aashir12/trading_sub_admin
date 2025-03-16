// Import necessary hooks and components
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { firebaseController } from '../../utils/firebaseMiddleware'; // Adjust the path as necessary

// Define the type for archive data

// ----------------------------------------------------------------------

export function   ArchiveForm() {
  const [title, setTitle] = useState(''); // State for title
  const [location, setLocation] = useState(''); // State for location
  const [asset, setAsset] = useState(''); // State for asset
  const [material, setMaterial] = useState(''); // State for material
  const [insight, setInsight] = useState(''); // State for insight
  const [imageUrl, setImageUrl] = useState(''); // State for imageUrl
  const [loading, setLoading] = useState(false); // Loading state
  const [relatedLinks, setRelatedLinks] = useState(''); // State for relatedLinks
  const [approach, setApproach] = useState(''); // State for approach
  const [introductoryText, setIntroductoryText] = useState(''); // State for introductoryText
  const [regionHistory, setRegionHistory] = useState(''); // State for regionHistory

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true); // Set loading state
    try {
      const docData = {
        title,
        location,
        asset,
        material,
        insight,
        introductoryText,
        regionHistory,
        approach,
        imageUrl,
        relatedLinks,
      };
      await firebaseController.addArchiveEntry(docData); // Use controller to add entry
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
        name="title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
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
        name="asset"
        label="Asset Category"
        value={asset}
        onChange={(e) => setAsset(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        label="Material"
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="insight"
        label="In-depth insight"
        value={insight}
        onChange={(e) => setInsight(e.target.value)}
      />
      <TextField
        fullWidth
        name="introductoryText"
        label="Introductory Text"
        value={introductoryText}
        onChange={(e) => setIntroductoryText(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="regionHistory"
        label="History in the region"
        value={regionHistory}
        onChange={(e) => setRegionHistory(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="insight"
        label="In-depth insight"
        value={insight}
        onChange={(e) => setInsight(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        name="approach"
        label="Our Conversation Approach"
        value={approach}
        onChange={(e) => setApproach(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        name="imageUrl"
        label="Image Tags"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        name="relatedLinks"
        label="Related Links"
        value={relatedLinks}
        onChange={(e) => setRelatedLinks(e.target.value)}
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
        Archive Detail Form
      </Typography>
      {renderArchiveForm}
    </>
  );
}
