import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TableChart as TableIcon
} from '@mui/icons-material';

// Python operations handled via electron API

const DataOverview = ({ files, onDataAnalyzed, setIsProcessing }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyzeFiles();
  }, [files]);

  const analyzeFiles = async () => {
    setLoading(true);
    setIsProcessing(true);
    setError(null);

    try {
      // Check Python environment first
      const pythonCheck = await window.electronAPI.pythonCheckSetup();
      console.log('Python check result:', pythonCheck);
      
      if (!pythonCheck.ready) {
        let errorMsg = 'Python environment not ready';
        if (pythonCheck.error) {
          errorMsg += `: ${pythonCheck.error}`;
        }
        if (pythonCheck.missingPackages && pythonCheck.missingPackages.length > 0) {
          errorMsg += `\n\nMissing packages: ${pythonCheck.missingPackages.join(', ')}`;
          errorMsg += `\n\nTo install missing packages, run:\nnpm run setup-python`;
        }
        if (pythonCheck.message) {
          errorMsg += `\n\nDetailed output:\n${pythonCheck.message}`;
        }
        throw new Error(errorMsg);
      }

      // Analyze the data
      const analysis = await window.electronAPI.pythonAnalyzeData(files);
      
      if (analysis.error) {
        throw new Error(analysis.error);
      }

      setAnalysisData(analysis);
      onDataAnalyzed(analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const getDataTypeColor = (dtype) => {
    if (dtype.includes('int') || dtype.includes('float')) return 'primary';
    if (dtype.includes('object') || dtype.includes('string')) return 'secondary';
    if (dtype.includes('bool')) return 'success';
    if (dtype.includes('datetime')) return 'warning';
    return 'default';
  };

  const formatSampleData = (sampleData) => {
    if (!sampleData || sampleData.length === 0) return [];
    return sampleData.slice(0, 3); // Show first 3 rows
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Analyzing Data Files...
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
          This may take a moment for large datasets
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={analyzeFiles}>
              Retry
            </Button>
          }
        >
          <Typography variant="h6">Analysis Failed</Typography>
          {error}
        </Alert>
        
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Troubleshooting tips:</strong><br/>
            • Ensure Python 3 is installed and accessible<br/>
            • Run the setup script: <code>npm run setup-python</code><br/>
            • Check that CSV files are properly formatted<br/>
            • Verify file permissions and accessibility
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!analysisData) {
    return (
      <Alert severity="warning">
        No analysis data available. Please try reloading the files.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Data Structure Overview
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
        Review the structure and data types of your selected files. This analysis helps
        ensure optimal synthetic data generation.
      </Typography>

      {Object.entries(analysisData).filter(([key]) => key !== '_metadata').map(([tableName, tableData], index) => (
        <Accordion key={tableName} defaultExpanded={index === 0} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TableIcon color="primary" />
              <Typography variant="h6">
                {files[index]?.name || tableName}
              </Typography>
              <Chip 
                label={`${tableData.shape[0]} rows × ${tableData.shape[1]} columns`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Column Information
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Column Name</strong></TableCell>
                      <TableCell><strong>Data Type</strong></TableCell>
                      <TableCell align="right"><strong>Unique Values</strong></TableCell>
                      <TableCell align="right"><strong>Null Count</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.columns.map((column) => (
                      <TableRow key={column}>
                        <TableCell>{column}</TableCell>
                        <TableCell>
                          <Chip
                            label={tableData.dtypes[column]}
                            size="small"
                            color={getDataTypeColor(tableData.dtypes[column])}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {tableData.unique_counts[column].toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {tableData.null_counts[column] > 0 ? (
                            <Chip
                              label={tableData.null_counts[column]}
                              size="small"
                              color="warning"
                            />
                          ) : (
                            <Chip
                              label="0"
                              size="small"
                              color="success"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {tableData.sample_data && tableData.sample_data.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Sample Data (First 3 Rows)
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {tableData.columns.map((column) => (
                          <TableCell key={column}><strong>{column}</strong></TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formatSampleData(tableData.sample_data).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {tableData.columns.map((column) => (
                            <TableCell key={column}>
                              {String(row[column] || '').length > 50 
                                ? String(row[column]).substring(0, 50) + '...'
                                : String(row[column] || 'null')
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Analysis Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="textSecondary">Total Tables</Typography>
            <Typography variant="h5">{Object.keys(analysisData).filter(key => key !== '_metadata').length}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Total Columns</Typography>
            <Typography variant="h5">
              {Object.entries(analysisData)
                .filter(([key]) => key !== '_metadata')
                .reduce((sum, [, table]) => sum + (table.columns?.length || 0), 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Total Rows</Typography>
            <Typography variant="h5">
              {Object.entries(analysisData)
                .filter(([key]) => key !== '_metadata')
                .reduce((sum, [, table]) => sum + (table.shape?.[0] || 0), 0).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Metadata Information */}
      {analysisData._metadata && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Auto-Detected Metadata
          </Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Detection Type:</strong> {analysisData._metadata.type === 'single_table' ? 'Single Table (Gaussian Copula)' : 'Multi-Table (HMA Synthesizer)'}
            </Typography>
          </Alert>
          
          {analysisData._metadata.suggested_relationships && analysisData._metadata.suggested_relationships.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Suggested Relationships Found:</strong>
              </Typography>
              {analysisData._metadata.suggested_relationships.slice(0, 3).map((rel, index) => (
                <Typography key={index} variant="caption" sx={{ display: 'block', ml: 2 }}>
                  • {rel.parent_table}.{rel.parent_key} → {rel.child_table}.{rel.child_key} (confidence: {(rel.confidence * 100).toFixed(0)}%)
                </Typography>
              ))}
              {analysisData._metadata.suggested_relationships.length > 3 && (
                <Typography variant="caption" sx={{ display: 'block', ml: 2, color: 'text.secondary' }}>
                  ... and {analysisData._metadata.suggested_relationships.length - 3} more suggestions
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      )}

      {Object.keys(analysisData).filter(key => key !== '_metadata').length > 1 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <strong>Multiple tables detected!</strong> In the next step, you'll be able to review and confirm 
          relationships between these tables to maintain referential integrity in your synthetic data.
          {analysisData._metadata?.suggested_relationships?.length > 0 && (
            <> SDV has automatically detected {analysisData._metadata.suggested_relationships.length} potential relationships for your review.</>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default DataOverview;