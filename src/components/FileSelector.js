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
  Alert
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  TableChart as CsvIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';

// Access electron API through preload script

const FileSelector = ({ onFilesSelected, isProcessing }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available');
        return;
      }
      const result = await window.electronAPI.selectFiles();
      if (result && result.length > 0) {
        // Files now come with name and size already populated from main process
        setSelectedFiles(prev => [...prev, ...result]);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  }, []);

  const handleFolderSelect = useCallback(async () => {
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available');
        return;
      }
      const result = await window.electronAPI.selectFolder();
      if (result && result.length > 0) {
        // Files now come with name and size already populated from main process
        setSelectedFiles(prev => [...prev, ...result]);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.toLowerCase().endsWith('.csv')
    );
    
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        path: file.path,
        name: file.name,
        size: file.size
      }));
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
        Select Your Data Files
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
        Choose one or more CSV files to generate synthetic data. You can select individual files
        or browse an entire folder for CSV files.
      </Typography>

      <Paper
        sx={{
          p: 4,
          border: dragOver ? '2px dashed #667eea' : '2px dashed #ccc',
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backgroundColor: dragOver ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
          mb: 3
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleFileSelect}
      >
        <UploadIcon sx={{ fontSize: 48, color: '#667eea', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Drop CSV files here or click to browse
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Supports multiple file selection
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<CsvIcon />}
          onClick={handleFileSelect}
          disabled={isProcessing}
        >
          Select CSV Files
        </Button>
        <Button
          variant="outlined"
          startIcon={<FolderIcon />}
          onClick={handleFolderSelect}
          disabled={isProcessing}
        >
          Browse Folder
        </Button>
      </Box>

      {selectedFiles.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Selected Files ({selectedFiles.length})
          </Typography>
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemIcon>
                  <CsvIcon color="primary" />
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