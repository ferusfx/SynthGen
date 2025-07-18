const path = require('path');
const cp = require('child_process');
const util = require('util');
const fs = require('fs');

class PythonBridge {
  constructor(pythonExecutable = 'python3') {
    this.pythonPath = path.join(__dirname, '../python');
    this.pythonExecutable = pythonExecutable;
    this.dataProcessor = null;
  }

  async loadCSV(filePath, tableName) {
    return new Promise((resolve, reject) => {
      const script = `
import sys
import json
sys.path.append('${this.pythonPath}')
from data_processor import DataProcessor

processor = DataProcessor()
result = processor.load_csv('${filePath}', '${tableName}')
print(json.dumps(result))
`;

      const execFile = util.promisify(cp.execFile);
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'CSV load timed out after 30 seconds' });
      }, 30000);

      execFile(this.pythonExecutable, ['-c', script])
        .then(({ stdout, stderr }) => {
          clearTimeout(timeout);
          try {
            const data = JSON.parse(stdout);
            resolve(data);
          } catch (parseErr) {
            resolve({ success: false, error: `Failed to parse CSV load results: ${parseErr.message}` });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: `CSV load failed: ${error.message}` });
        });
    });
  }

  async analyzeData(files) {
    return new Promise((resolve, reject) => {
      // Debug: Log the files parameter
      console.log('analyzeData called with files:', files);
      
      // Validate files parameter
      if (!files || !Array.isArray(files) || files.length === 0) {
        resolve({ error: 'No files provided for analysis' });
        return;
      }
      
      // Check if files have the required path property
      for (let i = 0; i < files.length; i++) {
        if (!files[i] || !files[i].path) {
          resolve({ error: `File ${i} is missing path property` });
          return;
        }
      }
      
      const script = `
import sys
import json
sys.path.append('${this.pythonPath}')
from data_processor import DataProcessor

processor = DataProcessor()
results = {}

# Load all files
${files.map((file, index) => `
try:
    result = processor.load_csv('${file.path}', 'table_${index}')
    if not result['success']:
        results['error'] = result['error']
except Exception as e:
    results['error'] = str(e)
`).join('')}

# Analyze data if no errors
if 'error' not in results:
    try:
        analysis = processor.analyze_data()
        results = analysis
    except Exception as e:
        results = {'error': str(e)}

print(json.dumps(results))
`;

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log('Data analysis timed out');
        resolve({ error: 'Data analysis timed out after 30 seconds' });
      }, 30000);

      const execFile = util.promisify(cp.execFile);

      console.log('Running data analysis with execFile...');
      
      execFile(this.pythonExecutable, ['-c', script])
        .then(({ stdout, stderr }) => {
          clearTimeout(timeout);
          console.log('Data analysis completed successfully');
          
          if (stderr) {
            console.warn('Python stderr:', stderr);
          }
          
          try {
            const data = JSON.parse(stdout);
            resolve(data);
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
            console.error('Python output:', stdout);
            resolve({ error: `Failed to parse analysis results: ${parseErr.message}` });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('Data analysis execution failed:', error);
          resolve({ error: `Data analysis failed: ${error.message}` });
        });
    });
  }

  async generateSyntheticData(files, relationships = [], numRows = null, algorithm = 'GaussianCopula', progressCallback = null) {
    return new Promise((resolve, reject) => {
      // Debug: Log the files parameter
      console.log('generateSyntheticData called with files:', files);
      
      // Validate files parameter
      if (!files || !Array.isArray(files) || files.length === 0) {
        resolve({ success: false, error: 'No files provided for synthesis' });
        return;
      }
      
      // Check if files have the required path property
      for (let i = 0; i < files.length; i++) {
        if (!files[i] || !files[i].path) {
          resolve({ success: false, error: `File ${i} is missing path property` });
          return;
        }
      }
      
      const progressFile = path.join(__dirname, '..', 'temp', `progress_${Date.now()}.json`);
      let progressInterval;
      
      const script = `
import sys
import json
import os
sys.path.append('${this.pythonPath}')
from data_processor import DataProcessor

processor = DataProcessor()

# Progress file path
progress_file = '${progressFile.replace(/\\/g, '/')}'

# Progress callback function
def progress_callback(percent, message):
    try:
        os.makedirs(os.path.dirname(progress_file), exist_ok=True)
        with open(progress_file, 'w') as f:
            json.dump({'percent': percent, 'message': message}, f)
    except Exception as e:
        print(f"Progress callback error: {e}")

# Load all files
${files.map((file, index) => `
processor.load_csv('${file.path}', 'table_${index}')
`).join('')}

# Setup metadata with relationships
relationships = ${JSON.stringify(relationships).replace(/false/g, 'False').replace(/true/g, 'True').replace(/null/g, 'None')}
processor.setup_metadata(relationships)

# Generate synthetic data with progress callback
try:
    result = processor.generate_synthetic_data(${numRows || 'None'}, '${algorithm}', progress_callback)
    
    # Auto-save to test/generated folder for debugging
    if result['success']:
        import os
        os.makedirs('./test/generated', exist_ok=True)
        
        # Debug: Check the raw data before export
        for table_name, table_data in result['data'].items():
            print(f"Debug: Table {table_name} first row: {table_data[0]}")
            print(f"Debug: Table {table_name} is_round values: {[row.get('is_round', 'MISSING') for row in table_data[:5]]}")
        
        export_result = processor.export_synthetic_data_csv(result['data'], './test/generated')
        print(f"Debug: Auto-saved CSV files to ./test/generated")
        print(f"Debug: Export result: {export_result}")
    
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
finally:
    # Clean up progress file
    try:
        if os.path.exists(progress_file):
            os.remove(progress_file)
    except:
        pass
`;

      // Add timeout to prevent hanging (increased for CTGAN)
      const timeout = setTimeout(() => {
        console.log('Synthetic data generation timed out');
        clearInterval(progressInterval);
        try {
          if (fs.existsSync(progressFile)) {
            fs.unlinkSync(progressFile);
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        resolve({ success: false, error: 'Synthetic data generation timed out after 10 minutes' });
      }, 600000); // 10 minutes timeout

      const execFile = util.promisify(cp.execFile);

      console.log('Running synthetic data generation with execFile...');
      
      // Create a progress monitoring interval
      progressInterval = setInterval(() => {
        try {
          if (fs.existsSync(progressFile)) {
            const progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
            console.log(`Progress: ${progressData.percent}% - ${progressData.message}`);
            
            // Send progress to callback if provided
            if (progressCallback) {
              progressCallback(progressData);
            }
          }
        } catch (e) {
          // Ignore progress file read errors
        }
      }, 1000); // Check every second
      
      execFile(this.pythonExecutable, ['-c', script])
        .then(({ stdout, stderr }) => {
          clearTimeout(timeout);
          clearInterval(progressInterval);
          console.log('Synthetic data generation completed');
          
          if (stderr) {
            console.warn('Python stderr:', stderr);
          }
          
          try {
            // Filter out debug output lines and get only the JSON result
            const lines = stdout.trim().split('\n');
            let jsonResult = null;
            
            // Look for the last line that starts with { (our JSON result)
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('{')) {
                try {
                  jsonResult = JSON.parse(line);
                  break;
                } catch (e) {
                  // Continue looking for valid JSON
                  continue;
                }
              }
            }
            
            if (jsonResult) {
              resolve(jsonResult);
            } else {
              console.error('No valid JSON found in output:', stdout);
              resolve({ success: false, error: 'No valid JSON result found in generation output' });
            }
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
            console.error('Python output:', stdout);
            resolve({ success: false, error: `Failed to parse generation results: ${parseErr.message}` });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          clearInterval(progressInterval);
          console.error('Synthetic data generation failed:', error);
          resolve({ success: false, error: `Synthetic data generation failed: ${error.message}` });
        });
    });
  }

  async evaluateQuality(files, syntheticData) {
    return new Promise((resolve, reject) => {
      const script = `
import sys
import json
import pandas as pd
sys.path.append('${this.pythonPath}')
from data_processor import DataProcessor

processor = DataProcessor()

# Load original files
${files.map((file, index) => `
processor.load_csv('${file.path}', 'table_${index}')
`).join('')}

# Setup metadata
processor.setup_metadata()

# Convert synthetic data back to DataFrames and evaluate quality
try:
    import json as json_module
    import base64
    
    # Use base64 encoding to safely pass JSON data to avoid control character issues
    synthetic_data_b64 = "${Buffer.from(JSON.stringify(syntheticData)).toString('base64')}"
    synthetic_data_json = base64.b64decode(synthetic_data_b64).decode('utf-8')
    synthetic_data_dict = json_module.loads(synthetic_data_json)
    result = processor.evaluate_quality_with_data(synthetic_data_dict)
    print(json.dumps(result))
except Exception as e:
    error_msg = str(e).replace('\\n', ' ').replace('\\r', ' ')
    print(json.dumps({'success': False, 'error': error_msg}))
`;

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log('Quality evaluation timed out');
        resolve({ success: false, error: 'Quality evaluation timed out after 45 seconds' });
      }, 45000);

      const execFile = util.promisify(cp.execFile);

      console.log('Running quality evaluation with execFile...');
      
      execFile(this.pythonExecutable, ['-c', script])
        .then(({ stdout, stderr }) => {
          clearTimeout(timeout);
          console.log('Quality evaluation completed');
          
          if (stderr) {
            console.warn('Python stderr:', stderr);
          }
          
          try {
            // SDV outputs progress information, so we need to extract the JSON from the output
            const lines = stdout.trim().split('\n');
            let jsonResult = null;
            
            // Look for the last line that starts with { (our JSON result)
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('{')) {
                try {
                  jsonResult = JSON.parse(line);
                  break;
                } catch (e) {
                  // Continue looking for valid JSON
                  continue;
                }
              }
            }
            
            if (jsonResult) {
              resolve(jsonResult);
            } else {
              console.error('No valid JSON found in output:', stdout);
              resolve({ success: false, error: 'No valid JSON result found in evaluation output' });
            }
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
            console.error('Python output:', stdout);
            resolve({ success: false, error: `Failed to parse evaluation results: ${parseErr.message}` });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('Quality evaluation failed:', error);
          resolve({ success: false, error: `Quality evaluation failed: ${error.message}` });
        });
    });
  }

  async checkPythonSetup() {
    return new Promise((resolve, reject) => {
      console.log('Running Python setup check with bundled Python:', this.pythonExecutable);
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log('Python setup check timed out');
        resolve({ 
          ready: false, 
          error: `Python setup check timed out after 10 seconds. Python executable: ${this.pythonExecutable}` 
        });
      }, 10000);
      
      // Verify the Python executable exists and is executable
      if (!fs.existsSync(this.pythonExecutable)) {
        clearTimeout(timeout);
        resolve({
          ready: false,
          error: `Python executable does not exist at path: ${this.pythonExecutable}`
        });
        return;
      }
      
      console.log('Testing bundled Python access with child_process...');
      
      // Use child_process.execFile for reliable execution
      const execFile = util.promisify(cp.execFile);
      
      // Test basic Python execution
      execFile(this.pythonExecutable, ['-c', 'print("Python is working")'])
        .then(({ stdout, stderr }) => {
          clearTimeout(timeout);
          console.log('Python test successful:', stdout.trim());
          
          // Now check packages using child_process as well
          this.checkPythonPackagesWithExecFile(resolve);
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('Python test failed:', error);
          resolve({
            ready: false,
            error: `Python execution failed: ${error.message}`
          });
        });
    });
  }

  checkPythonPackagesWithExecFile(resolve) {
    console.log(`Checking Python packages with execFile...`);
    
    const execFile = util.promisify(cp.execFile);
    
    const script = `
import sys
print("Python version:", sys.version)

packages = {}
try:
    import sdv
    packages['sdv'] = sdv.__version__
    print("SDV version:", sdv.__version__)
except ImportError as e:
    packages['sdv'] = None
    print("SDV not installed:", str(e))

try:
    import pandas
    packages['pandas'] = pandas.__version__
    print("Pandas version:", pandas.__version__)
except ImportError as e:
    packages['pandas'] = None
    print("Pandas not installed:", str(e))

try:
    import numpy
    packages['numpy'] = numpy.__version__
    print("Numpy version:", numpy.__version__)
except ImportError as e:
    packages['numpy'] = None
    print("Numpy not installed:", str(e))

print("Package check complete")
`;

    const timeout = setTimeout(() => {
      console.log('Package check with execFile timed out');
      resolve({ ready: false, error: 'Package check timed out after 30 seconds' });
    }, 30000);

    execFile(this.pythonExecutable, ['-c', script])
      .then(({ stdout, stderr }) => {
        clearTimeout(timeout);
        console.log('Package check output:', stdout);
        
        const output = stdout;
        const hasSDV = output.includes('SDV version:') && !output.includes('SDV not installed');
        const hasPandas = output.includes('Pandas version:') && !output.includes('Pandas not installed');
        const hasNumpy = output.includes('Numpy version:') && !output.includes('Numpy not installed');
        
        const missingPackages = [];
        if (!hasSDV) missingPackages.push('sdv');
        if (!hasPandas) missingPackages.push('pandas');
        if (!hasNumpy) missingPackages.push('numpy');
        
        resolve({ 
          ready: hasSDV && hasPandas && hasNumpy,
          message: output,
          pythonCommand: this.pythonExecutable,
          missingPackages: missingPackages,
          details: { hasSDV, hasPandas, hasNumpy }
        });
      })
      .catch((error) => {
        clearTimeout(timeout);
        console.error('Package check error:', error);
        resolve({ ready: false, error: `Package check failed: ${error.message}` });
      });
  }

  checkPythonPackages(pythonCmd, resolve) {
    // This method is deprecated, redirect to execFile method
    console.log(`Redirecting deprecated checkPythonPackages to checkPythonPackagesWithExecFile...`);
    this.checkPythonPackagesWithExecFile(resolve);
  }

  async saveEvaluationReport(qualityData, filePath) {
    return new Promise((resolve, reject) => {
      const script = `
import sys
import json
import base64
sys.path.append('${this.pythonPath}')
from data_processor import DataProcessor

processor = DataProcessor()

# Decode and parse quality data
try:
    quality_data_b64 = "${Buffer.from(JSON.stringify(qualityData)).toString('base64')}"
    quality_data_json = base64.b64decode(quality_data_b64).decode('utf-8')
    quality_data_dict = json.loads(quality_data_json)
    
    result = processor.save_evaluation_report(quality_data_dict, '${filePath}')
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
`;

      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Save operation timed out after 30 seconds' });
      }, 30000);

      const execFile = util.promisify(cp.execFile);
      
      execFile(this.pythonExecutable, ['-c', script])
        .then(({ stdout, stderr }) => {
          clearTimeout(timeout);
          
          if (stderr) {
            console.warn('Python stderr:', stderr);
          }
          
          try {
            const lines = stdout.trim().split('\n');
            let jsonResult = null;
            
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('{')) {
                try {
                  jsonResult = JSON.parse(line);
                  break;
                } catch (e) {
                  continue;
                }
              }
            }
            
            if (jsonResult) {
              resolve(jsonResult);
            } else {
              resolve({ success: false, error: 'No valid JSON result found in save output' });
            }
          } catch (parseErr) {
            resolve({ success: false, error: `Failed to parse save results: ${parseErr.message}` });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: `Save operation failed: ${error.message}` });
        });
    });
  }

  async generateColumnPlotData(files, syntheticData, columnName) {
    return new Promise((resolve, reject) => {
      // Debug: Log the parameters
      console.log('generateColumnPlotData called with:', { files: files.length, columnName });
      
      // Validate parameters
      if (!files || !Array.isArray(files) || files.length === 0) {
        resolve({ success: false, error: 'No files provided for plot generation' });
        return;
      }
      
      if (!columnName) {
        resolve({ success: false, error: 'No column name provided for plot generation' });
        return;
      }
      
      const script = `
import sys
import json
sys.path.append('${this.pythonPath}')
from data_processor import DataProcessor

processor = DataProcessor()

# Load all files
${files.map((file, index) => `
processor.load_csv('${file.path}', 'table_${index}')
`).join('')}

# Setup metadata
processor.setup_metadata()

# Generate plot data
try:
    import json as json_module
    import base64
    # Use base64 encoding to safely pass JSON data
    synthetic_data_b64 = '${Buffer.from(JSON.stringify(syntheticData)).toString('base64')}'
    synthetic_data_json = base64.b64decode(synthetic_data_b64).decode('utf-8')
    synthetic_data_dict = json_module.loads(synthetic_data_json)
    result = processor.generate_column_plot_data(synthetic_data_dict, '${columnName}')
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
`;

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log('Column plot generation timed out');
        resolve({ success: false, error: 'Column plot generation timed out after 2 minutes' });
      }, 120000); // 2 minutes

      const execFile = util.promisify(cp.execFile);
      
      execFile(this.pythonExecutable, ['-c', script])
        .then(({ stdout, stderr }) => {
          clearTimeout(timeout);
          console.log('Column plot generation completed successfully');
          
          if (stderr) {
            console.warn('Python stderr:', stderr);
          }
          
          try {
            // Filter out debug output lines and get only the JSON result
            const lines = stdout.trim().split('\n');
            let jsonResult = null;
            
            // Look for the last line that starts with { (our JSON result)
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();
              if (line.startsWith('{')) {
                try {
                  jsonResult = JSON.parse(line);
                  break;
                } catch (e) {
                  // Continue looking for valid JSON
                  continue;
                }
              }
            }
            
            if (jsonResult) {
              resolve(jsonResult);
            } else {
              console.error('No valid JSON found in output:', stdout);
              resolve({ success: false, error: 'No valid JSON result found in plot generation output' });
            }
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
            console.error('Python output:', stdout);
            resolve({ success: false, error: `Failed to parse plot generation results: ${parseErr.message}` });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('Column plot generation failed:', error);
          resolve({ success: false, error: `Column plot generation failed: ${error.message}` });
        });
    });
  }
}

module.exports = PythonBridge;