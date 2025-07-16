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
  pythonGenerateSynthetic: (files, relationships, numRows) => 
    ipcRenderer.invoke('python-generate-synthetic', files, relationships, numRows),
  pythonEvaluateQuality: (files, syntheticData) => 
    ipcRenderer.invoke('python-evaluate-quality', files, syntheticData),
  pythonGenerateColumnPlot: (files, syntheticData, columnName) => 
    ipcRenderer.invoke('python-generate-column-plot', files, syntheticData, columnName),
});