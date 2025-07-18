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

const DataOverview = ({ files, onDataAnalyzed, onComplete, setIsProcessing }) => {
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
      // Debug: Log the files parameter
      console.log('DataOverview analyzeFiles called with files:', files);
      
      // Check if files are valid
      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new Error('No files selected for analysis');
      }
      
      // Check if files have the required path property
      for (let i = 0; i < files.length; i++) {
        if (!files[i] || !files[i].path) {
          throw new Error(`File ${i} is missing path property`);
        }
      }

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
    return sampleData.slice(0, 5); // Show first 5 rows
  };

  const renderMetadataSummary = (metadataSummary) => {
    if (!metadataSummary) return null;

    const getSDTypeColor = (sdtype) => {
      switch (sdtype) {
        case 'categorical': return 'info';
        case 'numerical': return 'success';
        case 'boolean': return 'warning';
        case 'datetime': return 'secondary';
        case 'id': return 'error';
        default: return 'default';
      }
    };

    const getSDTypeIcon = (sdtype) => {
      switch (sdtype) {
        case 'categorical': return '🏷️';
        case 'numerical': return '🔢';
        case 'boolean': return '✅';
        case 'datetime': return '📅';
        case 'id': return '🔑';
        default: return '❓';
      }
    };

    return (
      <Box>
        {/* Column Types Overview */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Column Types Detected by SDV
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(metadataSummary.column_types || {}).map(([sdtype, columns]) => (
              <Chip
                key={sdtype}
                label={`${getSDTypeIcon(sdtype)} ${sdtype} (${columns.length})`}
                color={getSDTypeColor(sdtype)}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Paper>

        {/* Detailed Column Information */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Column</strong></TableCell>
                <TableCell><strong>SDV Type</strong></TableCell>
                <TableCell><strong>Pandas Type</strong></TableCell>
                <TableCell align="right"><strong>Unique</strong></TableCell>
                <TableCell align="right"><strong>Nulls</strong></TableCell>
                <TableCell><strong>Sample Values</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(metadataSummary.column_details || {}).map(([columnName, details]) => (
                <TableRow key={columnName}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {details.is_primary_key && <Chip label="PK" size="small" color="error" />}
                      {columnName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${getSDTypeIcon(details.sdtype)} ${details.sdtype}`}
                      size="small"
                      color={getSDTypeColor(details.sdtype)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={details.pandas_dtype}
                      size="small"
                      color={getDataTypeColor(details.pandas_dtype)}
                    />
                  </TableCell>
                  <TableCell align="right">{details.unique_values}</TableCell>
                  <TableCell align="right">
                    {details.null_count > 0 ? (
                      <Chip label={details.null_count} size="small" color="warning" />
                    ) : (
                      <Chip label="0" size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {details.sample_values?.slice(0, 3).join(', ')}
                      {details.sample_values?.length > 3 && '...'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Data Quality Summary */}
        {metadataSummary.data_quality && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: '#f0f8ff' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Data Quality Assessment
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip 
                label={`${metadataSummary.total_rows} rows`} 
                size="small" 
                color="primary"
                variant="outlined"
              />
              <Chip 
                label={`${metadataSummary.total_columns} columns`} 
                size="small" 
                color="primary"
                variant="outlined"
              />
              <Chip 
                label={`${metadataSummary.data_quality.duplicate_rows} duplicates`} 
                size="small" 
                color={metadataSummary.data_quality.duplicate_rows > 0 ? "warning" : "success"}
                variant="outlined"
              />
            </Box>
          </Paper>
        )}

        {/* Validation Results */}
        {metadataSummary.metadata_validation && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: metadataSummary.metadata_validation.valid ? '#f0f8f0' : '#fff0f0' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Metadata Validation
            </Typography>
            <Chip 
              label={metadataSummary.metadata_validation.valid ? "Valid" : "Issues Found"}
              size="small"
              color={metadataSummary.metadata_validation.valid ? "success" : "error"}
            />
            {metadataSummary.metadata_validation.issues?.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {metadataSummary.metadata_validation.issues.map((issue, index) => (
                  <Alert key={index} severity="error" sx={{ mt: 1 }}>
                    {issue}
                  </Alert>
                ))}
              </Box>
            )}
            {metadataSummary.metadata_validation.warnings?.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {metadataSummary.metadata_validation.warnings.map((warning, index) => (
                  <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                    {warning}
                  </Alert>
                ))}
              </Box>
            )}
          </Paper>
        )}
      </Box>
    );
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

      {Object.entries(analysisData).filter(([key]) => key !== '_metadata' && key !== '_cleaning').map(([tableName, tableData], index) => (
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

            {/* Metadata Summary Section */}
            {analysisData._metadata && analysisData._metadata.metadata_summary && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  SDV Metadata Detection Summary
                </Typography>
                {renderMetadataSummary(analysisData._metadata.metadata_summary)}
              </Box>
            )}

            {tableData.sample_data && tableData.sample_data.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Data Preview (First 5 Rows)
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 60, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
                          #
                        </TableCell>
                        {tableData.columns.map((column) => (
                          <TableCell key={column} sx={{ minWidth: 120, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
                            {column}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formatSampleData(tableData.sample_data).slice(0, 5).map((row, rowIndex) => (
                        <TableRow key={rowIndex} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fafafa' } }}>
                          <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 'bold', color: '#666' }}>
                            {rowIndex + 1}
                          </TableCell>
                          {tableData.columns.map((column) => (
                            <TableCell key={column} sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {(() => {
                                const value = row[column];
                                if (value === null || value === undefined) return 'null';
                                if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
                                const strValue = String(value);
                                return strValue.length > 30 ? strValue.substring(0, 30) + '...' : strValue;
                              })()}
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
            <Typography variant="h5">{Object.keys(analysisData).filter(key => key !== '_metadata' && key !== '_cleaning').length}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Total Columns</Typography>
            <Typography variant="h5">
              {Object.entries(analysisData)
                .filter(([key]) => key !== '_metadata' && key !== '_cleaning')
                .reduce((sum, [, table]) => sum + (table.columns?.length || 0), 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Total Rows</Typography>
            <Typography variant="h5">
              {Object.entries(analysisData)
                .filter(([key]) => key !== '_metadata' && key !== '_cleaning')
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

      {/* Data Cleaning Results */}
      {analysisData._cleaning && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Data Cleaning Results
          </Typography>
          {analysisData._cleaning.success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Data cleaning completed successfully!</strong>
              </Typography>
              {analysisData._cleaning.operations_performed.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Operations performed:</strong>
                  </Typography>
                  {analysisData._cleaning.operations_performed.map((operation, index) => (
                    <Typography key={index} variant="caption" sx={{ display: 'block', ml: 2 }}>
                      • {operation}
                    </Typography>
                  ))}
                </Box>
              )}
              {analysisData._cleaning.warnings.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Warnings:</strong>
                  </Typography>
                  {analysisData._cleaning.warnings.map((warning, index) => (
                    <Typography key={index} variant="caption" sx={{ display: 'block', ml: 2, color: 'warning.main' }}>
                      • {warning}
                    </Typography>
                  ))}
                </Box>
              )}
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Data cleaning encountered issues:</strong> {analysisData._cleaning.error}
              </Typography>
            </Alert>
          )}
        </Box>
      )}

      {Object.keys(analysisData).filter(key => key !== '_metadata' && key !== '_cleaning').length > 1 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <strong>Multiple tables detected!</strong> In the next step, you'll be able to review and confirm 
          relationships between these tables to maintain referential integrity in your synthetic data.
          {analysisData._metadata?.suggested_relationships?.length > 0 && (
            <> SDV has automatically detected {analysisData._metadata.suggested_relationships.length} potential relationships for your review.</>
          )}
        </Alert>
      )}

      {/* Continue Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => onComplete(analysisData)}
          sx={{ px: 4 }}
        >
          Continue to Next Step
        </Button>
      </Box>
    </Box>
  );
};

export default DataOverview;