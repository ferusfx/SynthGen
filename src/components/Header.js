import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { DataObject as DataIcon } from '@mui/icons-material';

const Header = () => {
  return (
    <AppBar position="static" sx={{ 
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <Toolbar>
        <DataIcon sx={{ mr: 2, color: 'white' }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white' }}>
          SynthGen - Synthetic Data Generator
        </Typography>
        <Box sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
          Powered by SDV Library
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;