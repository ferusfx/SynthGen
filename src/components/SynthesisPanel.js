import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

// Python operations handled via electron API

const SynthesisPanel = ({ files, dataOverview, columnMappings, onSynthesisComplete, setIsProcessing }) => {
  const [generationParams, setGenerationParams] = useState({
    numRows: '',
    preserveRelationships: true,
    algorithm: 'GaussianCopula'
  });
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Initializing...');
    setError(null);
    setResult(null);

    try {
      // Simulate progress updates
      const progressCallback = (percent, message) => {
        setProgress(percent);
        setProgressMessage(message);
      };

      progressCallback(10, 'Setting up synthesizer...');
      
      // Determine number of rows to generate
      const numRows = generationParams.numRows ? 
        parseInt(generationParams.numRows) : 
        null; // Use original dataset size

      progressCallback(20, 'Loading data files...');

      // Generate synthetic data
      const generationResult = await window.electronAPI.pythonGenerateSynthetic(
        files,
        columnMappings,
        numRows
      );

      if (!generationResult.success) {
        throw new Error(generationResult.error);
      }

      progressCallback(90, 'Finalizing results...');

      // Process results
      const processedResult = {
        ...generationResult,
        generationParams,
        timestamp: new Date().toISOString(),
        originalFiles: files.map(f => f.name)
      };

      setResult(processedResult);
      onSynthesisComplete(processedResult);
      progressCallback(100, 'Generation complete!');

    } catch (err) {
      setError(err.message);
      setProgressMessage('Generation failed');
    } finally {
      setGenerating(false);
      setIsProcessing(false);
    }
  }, [files, columnMappings, generationParams, onSynthesisComplete, setIsProcessing]);

  const handleDownload = useCallback(async (tableName, data, delimiter = ',') => {
    try {
      // Convert data to CSV format with proper delimiter
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(delimiter),
        ...data.map(row => headers.map(header => {
          const value = row[header];
          // Handle null/undefined values
          if (value === null || value === undefined) {
            return '';
          }
          // Convert boolean values to proper string representation
          if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
          }
          // Escape values that contain the delimiter, quotes, or newlines
          if (typeof value === 'string' && (
            value.includes(delimiter) || 
            value.includes('"') || 
            value.includes('\n') || 
            value.includes('\r')
          )) {
            return '"' + value.replace(/"/g, '""') + '"';
          }
          return value;
        }).join(delimiter))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `synthetic_${tableName}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, []);

  const getTableStats = (tableName) => {
    if (!dataOverview || !dataOverview[tableName]) return null;
    return dataOverview[tableName];
  };

  const renderGenerationSettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Generation Settings</Typography>
          <Button
            startIcon={<SettingsIcon />}
            onClick={() => setShowSettings(true)}
            size="small"
          >
            Advanced
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Number of Rows"
              type="number"
              value={generationParams.numRows}
              onChange={(e) => setGenerationParams(prev => ({
                ...prev,
                numRows: e.target.value
              }))}
              placeholder="Auto (same as original)"
              helperText="Leave empty to match original dataset size"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Algorithm</InputLabel>
              <Select
                value={generationParams.algorithm}
                onChange={(e) => setGenerationParams(prev => ({
                  ...prev,
                  algorithm: e.target.value
                }))}
              >
                <MenuItem value="GaussianCopula">Gaussian Copula (Recommended)</MenuItem>
                <MenuItem value="CTGAN">CTGAN (Deep Learning)</MenuItem>
                <MenuItem value="TVAE">TVAE (Variational Autoencoder)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Relationships: {columnMappings.length > 0 ? 
                  `${columnMappings.length} defined` : 
                  'None'
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tables: {files.length}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );


  const renderProgress = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="h6">Generating Synthetic Data</Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mb: 2, height: 8, borderRadius: 4 }}
        />
        
        <Typography variant="body2" color="textSecondary">
          {progressMessage} ({progress}%)
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            This process may take several minutes depending on your dataset size and complexity.
            The SDV library is analyzing patterns and generating statistically similar data.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );

  const renderResults = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CheckIcon color="success" sx={{ mr: 2 }} />
          <Typography variant="h6">Generation Complete!</Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
          Your synthetic data has been successfully generated. Review the results below and download
          the files when ready.
        </Typography>

        <Grid container spacing={2}>
          {Object.entries(result.data).map(([tableName, tableData], index) => {
            const originalStats = getTableStats(`table_${index}`);
            return (
              <Grid item xs={12} md={6} key={tableName}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {files[index]?.name || tableName}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`${tableData.length} rows generated`}
                      color="success"
                      size="small"
                    />
                    {originalStats && (
                      <Chip 
                        label={`${originalStats.shape[1]} columns`}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      // Get delimiter for this table
                      const delimiter = result.delimiters?.[`table_${index}`] || ',';
                      handleDownload(tableName, tableData, delimiter);
                    }}
                    fullWidth
                  >
                    Download CSV
                  </Button>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Generation Summary</Typography>
          <Typography variant="body2" color="textSecondary">
            • Algorithm: {generationParams.algorithm}<br/>
            • Generated: {new Date(result.timestamp).toLocaleString()}<br/>
            • Relationships preserved: {columnMappings.length} defined<br/>
            • Total synthetic records: {Object.values(result.data).reduce((sum, table) => sum + table.length, 0).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const renderError = () => (
    <Alert severity="error" sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <ErrorIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Generation Failed</Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {error}
      </Typography>
      <Button 
        variant="outlined" 
        size="small" 
        onClick={handleGenerate}
        disabled={generating}
      >
        Retry Generation
      </Button>
    </Alert>
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Generate Synthetic Data
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
        Configure your generation parameters and create synthetic data that maintains the
        statistical properties and relationships of your original datasets.
      </Typography>

      {!generating && !result && !error && renderGenerationSettings()}
      
      {generating && renderProgress()}
      
      {error && renderError()}
      
      {result && renderResults()}

      {!generating && !result && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayIcon />}
            onClick={handleGenerate}
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Start Generation
          </Button>
        </Box>
      )}

      {/* Advanced Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
        <DialogTitle>Advanced Generation Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Table Relationships ({columnMappings.length})
            </Typography>
            
            {columnMappings.length === 0 ? (
              <Alert severity="info">
                No relationships defined. Tables will be generated independently.
              </Alert>
            ) : (
              <List>
                {columnMappings.map((mapping, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${mapping.parent_table}.${mapping.parent_key} → ${mapping.child_table}.${mapping.child_key}`}
                      secondary="Foreign key relationship"
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Generation Parameters
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Gaussian Copula:</strong> Best for mixed data types with complex correlations<br/>
                    <strong>CTGAN:</strong> Deep learning approach, good for tabular data<br/>
                    <strong>TVAE:</strong> Variational autoencoder, handles categorical data well
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SynthesisPanel;