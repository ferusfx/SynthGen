import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  Grid
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  TableChart as CsvIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderIcon,
  InsertDriveFile as ExcelIcon,
  Storage as DatabaseIcon
} from '@mui/icons-material';

// Access electron API through preload script

const FileSelector = ({ onFilesSelected, isProcessing }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  // Helper function to get the appropriate icon for a file
  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return <ExcelIcon color="success" />;
      case 'csv':
        return <CsvIcon color="primary" />;
      default:
        return <CsvIcon color="primary" />;
    }
  };

  const handleFileSelect = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available');
        return;
      }
      const result = await window.electronAPI.selectFiles();
      console.log('File selection result:', result);
      if (result && result.length > 0) {
        // Files now come with name and size already populated from main process
        setSelectedFiles(prev => [...prev, ...result]);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  }, []);


  const handleRemoveFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.toLowerCase().endsWith('.csv')
    );
    
    if (files.length > 0) {
      // Check if any files are missing path property
      const filesWithoutPath = files.filter(file => !file.path);
      
      if (filesWithoutPath.length > 0) {
        // Show error message for drag and drop limitation
        console.error('Drag and drop files are missing path property. Please use the file selection button instead.');
        alert('Drag and drop is not fully supported. Please use the "Select Data Files" button to choose your files.');
        return;
      }
      
      // All files have path property, proceed normally
      const newFiles = files.map(file => ({
        path: file.path,
        name: file.name,
        size: file.size
      }));
      console.log('Drag and drop files:', newFiles);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleProceed = useCallback(() => {
    if (selectedFiles.length > 0) {
      // Debug: Log selected files before passing
      console.log('FileSelector handleProceed called with selectedFiles:', selectedFiles);
      onFilesSelected(selectedFiles);
    }
  }, [selectedFiles, onFilesSelected]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Select Input Data
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
        Choose your data source to generate synthetic data. Select from file-based data or database connections.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* SQL Server Tile */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '200px',
              opacity: 0.6,
              cursor: 'not-allowed',
              border: '2px solid #e0e0e0',
              transition: 'all 0.3s ease'
            }}
          >
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center'
            }}>
              <DatabaseIcon sx={{ fontSize: 64, color: '#bbb', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#999', mb: 1 }}>
                SQL Server
              </Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>
                Connect to SQL Server databases
              </Typography>
              <Typography variant="caption" sx={{ color: '#999', mt: 1, fontStyle: 'italic' }}>
                Coming soon
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* CSV/XLSX Tile */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '200px',
              cursor: 'pointer',
              border: '2px solid #667eea',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
                borderColor: '#5a67d8'
              }
            }}
          >
            <CardActionArea 
              onClick={handleFileSelect}
              disabled={isProcessing}
              sx={{ height: '100%' }}
            >
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <CsvIcon sx={{ fontSize: 32, color: '#667eea' }} />
                  <ExcelIcon sx={{ fontSize: 32, color: '#667eea' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea', mb: 1 }}>
                  CSV / XLSX
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Upload CSV or Excel files
                </Typography>
                <Typography variant="body2" sx={{ color: '#667eea', mt: 1, fontWeight: 'medium' }}>
                  Click to select files
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {selectedFiles.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Selected Files ({selectedFiles.length})
          </Typography>
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemIcon>
                  {getFileIcon(file.name)}
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${file.path} • ${formatFileSize(file.size)}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isProcessing}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {selectedFiles.length > 1 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Multiple files detected. You'll be able to define relationships between tables
          in the next step to maintain data integrity across your synthetic datasets.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleProceed}
          disabled={selectedFiles.length === 0 || isProcessing}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem'
          }}
        >
          Analyze Selected Files
        </Button>
      </Box>
    </Box>
  );
};

export default FileSelector;