import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert
} from '@mui/material';

const MetadataReview = ({ dataOverview, onMetadataConfirmed }) => {
  if (!dataOverview) {
    return (
      <Alert severity="warning">
        No metadata available for review. Please analyze your data first.
      </Alert>
    );
  }

  const handleConfirmMetadata = () => {
    onMetadataConfirmed({
      detectedMetadata: dataOverview._metadata?.detected_metadata,
      editedMetadata: {},
      suggestedRelationships: dataOverview._metadata?.suggested_relationships || []
    });
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Review Auto-Detected Metadata
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
        Review and confirm the automatically detected column types and metadata.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Detection Summary:</strong> {dataOverview._metadata?.type === 'single_table' ? 'Single Table (Gaussian Copula)' : 'Multi-Table (HMA)'}
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleConfirmMetadata}
          sx={{ px: 4, py: 1.5 }}
        >
          Confirm Metadata & Continue
        </Button>
      </Box>
    </Box>
  );
};

export default MetadataReview;