import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import FileSelector from './components/FileSelector';
import DataOverview from './components/DataOverview';
// import MetadataReview from './components/MetadataReview';
import ColumnMapper from './components/ColumnMapper';
import SynthesisPanel from './components/SynthesisPanel';
import Evaluation from './components/Evaluation';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [dataOverview, setDataOverview] = useState(null);
  const [columnMappings, setColumnMappings] = useState([]);
  const [synthesisResult, setSynthesisResult] = useState(null);
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    { title: 'Select input data', description: 'Choose data source for synthesis' },
    { title: 'Data Overview', description: 'Review data structure and types' },
    { title: 'Map Relationships', description: 'Define column relationships across tables' },
    { title: 'Generate Data', description: 'Create synthetic datasets' },
    { title: 'Evaluation', description: 'Review synthesis quality and privacy scores' }
  ];

  const handleFilesSelected = useCallback((selectedFiles) => {
    // Debug: Log files being set in App
    console.log('App handleFilesSelected called with selectedFiles:', selectedFiles);
    setFiles(selectedFiles);
    setCurrentStep(1);
  }, []);

  const handleDataAnalyzed = useCallback((overview) => {
    setDataOverview(overview);
    // Stay on Data Overview step to show analysis results
    setCurrentStep(1);
  }, []);

  const handleDataOverviewComplete = useCallback((analysisData) => {
    // Ensure dataOverview is set if analysisData is provided
    if (analysisData && !dataOverview) {
      setDataOverview(analysisData);
    }
    
    if (files.length > 1) {
      setCurrentStep(2); // Go to relationships mapping
    } else {
      setCurrentStep(3); // Skip to Generate Data for single file
    }
  }, [files.length, dataOverview]);

  const handleMappingsComplete = useCallback((mappings) => {
    setColumnMappings(mappings);
    setCurrentStep(3);
  }, []);

  const handleSynthesisComplete = useCallback((result) => {
    setSynthesisResult(result);
    setCurrentStep(4);
  }, []);

  const handleEvaluationComplete = useCallback((report) => {
    setEvaluationReport(report);
  }, []);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FileSelector
            onFilesSelected={handleFilesSelected}
            isProcessing={isProcessing}
          />
        );
      case 1:
        return (
          <DataOverview
            files={files}
            onDataAnalyzed={handleDataAnalyzed}
            onComplete={handleDataOverviewComplete}
            setIsProcessing={setIsProcessing}
          />
        );
      case 2:
        return (
          <ColumnMapper
            dataOverview={dataOverview}
            files={files}
            onMappingsComplete={handleMappingsComplete}
          />
        );
      case 3:
        return (
          <SynthesisPanel
            files={files}
            dataOverview={dataOverview}
            columnMappings={columnMappings}
            onSynthesisComplete={handleSynthesisComplete}
            setIsProcessing={setIsProcessing}
          />
        );
      case 4:
        return (
          <Evaluation
            synthesisResult={synthesisResult}
            onEvaluationComplete={handleEvaluationComplete}
            files={files}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
        <Header />
        <div className="main-content">
          <Sidebar 
            steps={steps} 
            currentStep={currentStep} 
            onStepClick={setCurrentStep}
            isProcessing={isProcessing}
          />
          <div className="content-area">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;