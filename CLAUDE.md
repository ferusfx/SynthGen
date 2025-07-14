# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SynthGen is an Electron-based desktop application for generating synthetic data using the SDV (Synthetic Data Vault) library. The application provides a user-friendly interface for:

- Selecting multiple CSV files or entire folders
- Analyzing data structure and types
- Mapping relationships between tables
- Generating high-quality synthetic data
- Evaluating synthetic data quality and privacy

## Development Commands

- `npm start` - Build and start the Electron application (production mode)
- `npm run electron-dev` - Start in development mode (runs React dev server + Electron)
- `npm run build` - Build React app for production
- `npm install` - Install dependencies
- `npm run setup-python` - Setup Python environment with SDV library
- `npm test` - Run tests

## Quick Start
1. `npm install` - Install Node.js dependencies
2. `npm run setup-python` - Install Python dependencies
3. `npm start` - Launch the application

## Project Structure

- `public/main.js` - Main Electron process that creates and manages application windows
- `public/index.html` - HTML entry point for React application
- `src/` - React application source code
  - `App.js` - Main React component with step navigation
  - `components/` - UI components for each step of the process
  - `utils/pythonBridge.js` - Communication layer with Python scripts
- `python/` - Python scripts for data processing and SDV integration
  - `data_processor.py` - Main data processing and synthesis logic
  - `setup.py` - Python environment setup script
- `package.json` - Node.js project configuration

## Architecture

**Main Process (`public/main.js`)**:
- Creates BrowserWindow instances
- Handles application lifecycle events
- Manages file dialogs and system integration
- Provides IPC handlers for file operations

**Renderer Process (React App)**:
- Step-based UI for guiding users through the synthetic data generation process
- Material-UI components for modern, responsive interface
- Communication with Python backend via python-shell

**Python Backend**:
- SDV library integration for synthetic data generation
- Data analysis and quality assessment
- Support for single-table and multi-table synthesis

## Development Setup

1. Ensure Node.js and Python 3 are installed
2. Run `npm install` to install all Node.js dependencies
3. Run `npm run setup-python` to install Python dependencies (SDV, pandas, etc.)
4. For development: `npm run electron-dev` (automatically handles React + Electron)
5. For production: `npm start` (automatically builds then runs Electron)

## Usage Workflow

1. **File Selection**: Choose CSV files or browse entire folders
2. **Data Analysis**: Review data structure, types, and sample data  
3. **Relationship Mapping**: Define foreign key relationships between tables (multi-table only)
4. **Data Generation**: Configure parameters and generate synthetic data with progress tracking
5. **Quality Assessment**: Review quality scores, privacy metrics, and download results

## Security Note

Current configuration has `nodeIntegration: true` and `contextIsolation: false` for simplicity. For production applications, consider enabling context isolation and disabling node integration for better security.