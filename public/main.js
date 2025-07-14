const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const PythonBridge = require('./pythonBridge');

function findPython() {
  const possibilities = [
    // In packaged app
    path.join(process.resourcesPath, "python", "bin", "python3.10"),
    // In development - try multiple possible paths
    path.join(__dirname, "..", "python", "bin", "python3.10"),
    path.join(process.cwd(), "python", "bin", "python3.10"),
    // Absolute path for development mode
    path.resolve(__dirname, "..", "python", "bin", "python3.10")
  ];
  
  console.log("Searching for Python executable...");
  for (const pythonPath of possibilities) {
    console.log("Checking path:", pythonPath);
    if (fs.existsSync(pythonPath)) {
      console.log("Found Python at:", pythonPath);
      return pythonPath;
    }
  }
  
  console.error("Could not find python3.10, checked paths:", possibilities);
  console.error("Current working directory:", process.cwd());
  console.error("__dirname:", __dirname);
  
  // Return null instead of quitting the app
  return null;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = process.env.ELECTRON_IS_DEV;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
    // Enable dev tools in production too for debugging
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] }
    ]
  });
  
  if (result.canceled) return null;
  
  // Get file stats including size
  const filesWithStats = result.filePaths.map(filePath => {
    try {
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size
      };
    } catch (error) {
      console.error(`Error getting stats for ${filePath}:`, error);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: 0
      };
    }
  });
  
  return filesWithStats;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (result.canceled) return null;
  
  const folderPath = result.filePaths[0];
  const csvFiles = fs.readdirSync(folderPath)
    .filter(file => file.toLowerCase().endsWith('.csv'))
    .map(file => {
      const filePath = path.join(folderPath, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          path: filePath,
          name: file,
          size: stats.size
        };
      } catch (error) {
        console.error(`Error getting stats for ${filePath}:`, error);
        return {
          path: filePath,
          name: file,
          size: 0
        };
      }
    });
  
  return csvFiles;
});

// Initialize Python bridge with bundled Python
const pythonPath = findPython();
let pythonBridge = null;

if (pythonPath) {
  pythonBridge = new PythonBridge(pythonPath);
  console.log("Python bridge initialized successfully with:", pythonPath);
} else {
  console.error("Python bridge could not be initialized - no Python executable found");
}

// Python operation handlers
ipcMain.handle('python-check-setup', async () => {
  try {
    console.log('Checking Python setup...');
    
    if (!pythonBridge) {
      const searchedPaths = [
        path.join(process.resourcesPath, "python", "bin", "python3.10"),
        path.join(__dirname, "..", "python", "bin", "python3.10"),
        path.join(process.cwd(), "python", "bin", "python3.10"),
        "/Users/macol/Documents/repos/SynthGen/python/bin/python3.10"
      ];
      return { 
        ready: false, 
        error: `Python executable not found. Searched paths:\n${searchedPaths.join('\n')}\n\nCurrent directory: ${process.cwd()}\nPublic directory: ${__dirname}` 
      };
    }
    
    const result = await pythonBridge.checkPythonSetup();
    console.log('Python setup result:', result);
    return result;
  } catch (error) {
    console.error('Python setup error:', error);
    return { ready: false, error: error.message };
  }
});

ipcMain.handle('python-analyze-data', async (event, files) => {
  try {
    if (!pythonBridge) {
      return { error: 'Python bridge not initialized' };
    }
    return await pythonBridge.analyzeData(files);
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('python-generate-synthetic', async (event, files, relationships, numRows) => {
  try {
    if (!pythonBridge) {
      return { success: false, error: 'Python bridge not initialized' };
    }
    return await pythonBridge.generateSyntheticData(files, relationships, numRows);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('python-evaluate-quality', async (event, files, syntheticData) => {
  try {
    if (!pythonBridge) {
      return { success: false, error: 'Python bridge not initialized' };
    }
    return await pythonBridge.evaluateQuality(files, syntheticData);
  } catch (error) {
    return { success: false, error: error.message };
  }
});