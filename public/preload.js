const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  getGeneratedFiles: () => ipcRenderer.invoke('get-generated-files'),
  createZipFromFiles: (files, outputPath) => ipcRenderer.invoke('create-zip-from-files', files, outputPath),
  saveZipFile: (zipBlob, outputPath) => ipcRenderer.invoke('save-zip-file', zipBlob, outputPath),
  
  // Python operations
  pythonCheckSetup: () => ipcRenderer.invoke('python-check-setup'),
  pythonAnalyzeData: (files) => ipcRenderer.invoke('python-analyze-data', files),
  pythonGenerateSynthetic: (files, relationships, numRows, algorithm) => 
    ipcRenderer.invoke('python-generate-synthetic', files, relationships, numRows, algorithm),
  pythonEvaluateQuality: (files, syntheticData) => 
    ipcRenderer.invoke('python-evaluate-quality', files, syntheticData),
  pythonGenerateColumnPlot: (files, syntheticData, columnName) => 
    ipcRenderer.invoke('python-generate-column-plot', files, syntheticData, columnName),
  pythonSaveEvaluationReport: (qualityData, filePath) => 
    ipcRenderer.invoke('python-save-evaluation-report', qualityData, filePath),
  
  // Progress monitoring
  startProgressPolling: (callback) => {
    ipcRenderer.on('generation-progress', (event, progressData) => {
      callback(progressData);
    });
  },
  stopProgressPolling: () => {
    ipcRenderer.removeAllListeners('generation-progress');
  },
  
  // Logging
  logToTerminal: (message) => ipcRenderer.invoke('log-to-terminal', message),
});