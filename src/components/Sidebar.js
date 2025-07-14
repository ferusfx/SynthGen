import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
  TableChart as TableIcon,
  AccountTree as TreeIcon,
  AutoFixHigh as MagicIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';

const stepIcons = [FolderIcon, TableIcon, TreeIcon, MagicIcon, ReportIcon];

const Sidebar = ({ steps, currentStep, onStepClick, isProcessing }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: 320,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
          Generation Process
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
          Follow these steps to create synthetic data
        </Typography>
      </Box>
      
      <Stepper
        activeStep={currentStep}
        orientation="vertical"
        sx={{ p: 2, flex: 1 }}
      >
        {steps.map((step, index) => {
          const StepIcon = stepIcons[index];
          return (
            <Step key={index}>
              <StepLabel
                sx={{
                  cursor: !isProcessing && index <= currentStep ? 'pointer' : 'default',
                  '& .MuiStepLabel-label': {
                    fontWeight: index === currentStep ? 'bold' : 'normal'
                  }
                }}
                onClick={() => !isProcessing && index <= currentStep && onStepClick(index)}
                icon={<StepIcon />}
              >
                {step.title}
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
      
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)', mt: 'auto' }}>
        <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
          Value Proposition:
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem', mt: 1 }}>
          • Overcome data scarcity challenges{'\n'}
          • Protect sensitive data privacy{'\n'}
          • Accelerate AI model development{'\n'}
          • Enable innovative research
        </Typography>
      </Box>
    </Paper>
  );
};

export default Sidebar;