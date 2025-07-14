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
        resolve({ success: false, error: 'CSV load timed out after 15 seconds' });
      }, 15000);

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

  async generateSyntheticData(files, relationships = [], numRows = null, progressCallback = null) {
    return new Promise((resolve, reject) => {
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

# Setup metadata with relationships
relationships = ${JSON.stringify(relationships)}
processor.setup_metadata(relationships)

# Generate synthetic data
try:
    result = processor.generate_synthetic_data(${numRows || 'None'})
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
`;

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.log('Synthetic data generation timed out');
        resolve({ success: false, error: 'Synthetic data generation timed out after 60 seconds' });
      }, 60000);

      const execFile = util.promisify(cp.execFile);

      console.log('Running synthetic data generation with execFile...');
      
      execFile(this.pythonExecutable, ['-c', script])
        .then(({ stdout, stderr }) => {
          clearTimeout(timeout);
          console.log('Synthetic data generation completed');
          
          if (stderr) {
            console.warn('Python stderr:', stderr);
          }
          
          try {
            const data = JSON.parse(stdout);
            resolve(data);
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
            console.error('Python output:', stdout);
            resolve({ success: false, error: `Failed to parse generation results: ${parseErr.message}` });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
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
    synthetic_data_json = '''${JSON.stringify(syntheticData).replace(/'/g, "\\'")}'''
    synthetic_data_dict = json_module.loads(synthetic_data_json)
    result = processor.evaluate_quality_with_data(synthetic_data_dict)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
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
      resolve({ ready: false, error: 'Package check timed out after 15 seconds' });
    }, 15000);

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
}

module.exports = PythonBridge;