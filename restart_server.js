import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const restartServer = async () => {
  console.log('🔄 Restarting server...');
  
  try {
    // For Windows
    if (process.platform === 'win32') {
      console.log('Killing processes on port 5000...');
      try {
        await execAsync('powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"');
        console.log('Successfully killed process on port 5000');
      } catch (error) {
        console.log('No process running on port 5000');
      }
      
      console.log('Killing nodemon processes...');
      try {
        await execAsync('powershell -Command "Get-Process | Where-Object {$_.Name -eq \'node\' -and $_.CommandLine -like \'*nodemon*\'} | Stop-Process -Force -ErrorAction SilentlyContinue"');
        console.log('Successfully killed nodemon processes');
      } catch (error) {
        console.log('No nodemon processes running');
      }
    } else {
      // For Linux/Mac
      console.log('Killing processes on port 5000...');
      await execAsync('lsof -ti:5000 | xargs kill -9 || true');
    }

    // Start the server
    console.log('Starting server...');
    await execAsync('npm run server');
    
  } catch (error) {
    console.error('Error during server restart:', error);
  }
};

restartServer(); 