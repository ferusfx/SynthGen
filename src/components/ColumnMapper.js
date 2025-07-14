import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  AccountTree as TreeIcon,
  Link as LinkIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ColumnMapper = ({ dataOverview, onMappingsComplete }) => {
  const [selectedColumns, setSelectedColumns] = useState({});
  const [relationships, setRelationships] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    parentTable: '',
    parentColumn: '',
    childTable: '',
    childColumn: ''
  });

  const tables = Object.keys(dataOverview || {}).filter(key => key !== '_metadata');
  const suggestedRelationships = dataOverview?._metadata?.suggested_relationships || [];

  // Auto-populate relationships from suggestions on component mount
  React.useEffect(() => {
    if (suggestedRelationships.length > 0 && relationships.length === 0) {
      const autoRelationships = suggestedRelationships
        .filter(rel => rel.confidence > 0.7) // Only high-confidence suggestions
        .slice(0, 3) // Max 3 auto-suggestions
        .map((rel, index) => ({
          id: Date.now() + index,
          parent_table: rel.parent_table,
          parent_key: rel.parent_key,
          child_table: rel.child_table,
          child_key: rel.child_key,
          auto_suggested: true,
          confidence: rel.confidence
        }));
      
      if (autoRelationships.length > 0) {
        setRelationships(autoRelationships);
      }
    }
  }, [suggestedRelationships, relationships.length]);

  const handleColumnSelect = useCallback((tableName, columnName) => {
    setSelectedColumns(prev => ({
      ...prev,
      [tableName]: prev[tableName] === columnName ? null : columnName
    }));
  }, []);

  const handleAddRelationship = useCallback(() => {
    setDialogOpen(true);
    setNewRelationship({
      parentTable: '',
      parentColumn: '',
      childTable: '',
      childColumn: ''
    });
  }, []);

  const handleSaveRelationship = useCallback(() => {
    if (newRelationship.parentTable && newRelationship.parentColumn && 
        newRelationship.childTable && newRelationship.childColumn) {
      
      setRelationships(prev => [...prev, {
        id: Date.now(),
        parent_table: newRelationship.parentTable,
        parent_key: newRelationship.parentColumn,
        child_table: newRelationship.childTable,
        child_key: newRelationship.childColumn
      }]);
      
      setDialogOpen(false);
    }
  }, [newRelationship]);

  const handleRemoveRelationship = useCallback((id) => {
    setRelationships(prev => prev.filter(rel => rel.id !== id));
  }, []);

  const handleProceed = useCallback(() => {
    onMappingsComplete(relationships);
  }, [relationships, onMappingsComplete]);

  const getColumnType = (tableName, columnName) => {
    return dataOverview[tableName]?.dtypes[columnName] || 'unknown';
  };

  const getColumnStats = (tableName, columnName) => {
    const table = dataOverview[tableName];
    if (!table) return {};
    
    return {
      unique: table.unique_counts[columnName],
      nulls: table.null_counts[columnName],
      total: table.shape[0]
    };
  };

  const renderColumnList = (tableName, tableData) => (
    <Card key={tableName} sx={{ height: 'fit-content' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TreeIcon color="primary" />
            <Typography variant="h6">{tableName}</Typography>
            <Chip 
              label={`${tableData.shape[0]} rows`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <List dense>
          {tableData.columns.map((column) => {
            const stats = getColumnStats(tableName, column);
            const isSelected = selectedColumns[tableName] === column;
            
            return (
              <ListItem key={column} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleColumnSelect(tableName, column)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                          {column}
                        </Typography>
                        <Chip
                          label={getColumnType(tableName, column)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: isSelected ? 'inherit' : 'text.secondary' }}>
                        {stats.unique} unique • {stats.nulls} nulls
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );

  if (!dataOverview || tables.length < 2) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Single Table Detected
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
          Column mapping is only needed for multiple tables. You can proceed directly to data generation.
        </Typography>
        <Button
          variant="contained"
          onClick={() => onMappingsComplete([])}
          sx={{ px: 4, py: 1.5 }}
        >
          Proceed to Data Generation
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Define Table Relationships
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
        Select columns that represent relationships between your tables. This helps maintain
        referential integrity in the synthetic data generation process.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>How it works:</strong> Define parent-child relationships between tables by mapping
        foreign key columns. For example, if Table A has a "user_id" column that references 
        Table B's "id" column, create a relationship to preserve this connection in synthetic data.
      </Alert>

      {suggestedRelationships.length > 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Auto-Detection Results:</strong> SDV found {suggestedRelationships.length} potential relationships.
            {relationships.filter(rel => rel.auto_suggested).length > 0 && (
              <> {relationships.filter(rel => rel.auto_suggested).length} high-confidence relationships have been automatically added below.</>
            )}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Review and modify these suggestions as needed, or add additional relationships manually.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {tables.map((tableName) => (
          <Grid item xs={12} md={6} lg={4} key={tableName}>
            {renderColumnList(tableName, dataOverview[tableName])}
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Defined Relationships ({relationships.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRelationship}
          >
            Add Relationship
          </Button>
        </Box>

        {relationships.length === 0 ? (
          <Alert severity="warning">
            No relationships defined. Tables will be treated as independent datasets.
            Consider adding relationships if your tables share common identifiers.
          </Alert>
        ) : (
          <List>
            {relationships.map((rel, index) => (
              <ListItem key={rel.id} divider={index < relationships.length - 1}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Chip label={rel.parent_table} color="primary" size="small" />
                      <Typography variant="body2">{rel.parent_key}</Typography>
                      <LinkIcon sx={{ color: '#666' }} />
                      <Chip label={rel.child_table} color="secondary" size="small" />
                      <Typography variant="body2">{rel.child_key}</Typography>
                      {rel.auto_suggested && (
                        <Chip 
                          label={`Auto (${(rel.confidence * 100).toFixed(0)}%)`} 
                          color="success" 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={`Parent table "${rel.parent_table}" → Child table "${rel.child_table}"${rel.auto_suggested ? ' (Auto-detected)' : ''}`}
                />
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveRelationship(rel.id)}
                >
                  Remove
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleAddRelationship}
          disabled={tables.length < 2}
        >
          Add More Relationships
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleProceed}
          sx={{ px: 4, py: 1.5 }}
        >
          Proceed to Data Generation
        </Button>
      </Box>

      {/* Add Relationship Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Table Relationship</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Parent Table</InputLabel>
              <Select
                value={newRelationship.parentTable}
                onChange={(e) => setNewRelationship(prev => ({
                  ...prev,
                  parentTable: e.target.value,
                  parentColumn: ''
                }))}
              >
                {tables.map(table => (
                  <MenuItem key={table} value={table}>{table}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {newRelationship.parentTable && (
              <FormControl fullWidth>
                <InputLabel>Parent Column (Primary Key)</InputLabel>
                <Select
                  value={newRelationship.parentColumn}
                  onChange={(e) => setNewRelationship(prev => ({
                    ...prev,
                    parentColumn: e.target.value
                  }))}
                >
                  {dataOverview[newRelationship.parentTable]?.columns.map(column => (
                    <MenuItem key={column} value={column}>{column}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Divider>
              <Chip label="Links to" size="small" />
            </Divider>

            <FormControl fullWidth>
              <InputLabel>Child Table</InputLabel>
              <Select
                value={newRelationship.childTable}
                onChange={(e) => setNewRelationship(prev => ({
                  ...prev,
                  childTable: e.target.value,
                  childColumn: ''
                }))}
              >
                {tables.filter(table => table !== newRelationship.parentTable).map(table => (
                  <MenuItem key={table} value={table}>{table}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {newRelationship.childTable && (
              <FormControl fullWidth>
                <InputLabel>Child Column (Foreign Key)</InputLabel>
                <Select
                  value={newRelationship.childColumn}
                  onChange={(e) => setNewRelationship(prev => ({
                    ...prev,
                    childColumn: e.target.value
                  }))}
                >
                  {dataOverview[newRelationship.childTable]?.columns.map(column => (
                    <MenuItem key={column} value={column}>{column}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveRelationship}
            variant="contained"
            disabled={!newRelationship.parentTable || !newRelationship.parentColumn || 
                     !newRelationship.childTable || !newRelationship.childColumn}
          >
            Add Relationship
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ColumnMapper;