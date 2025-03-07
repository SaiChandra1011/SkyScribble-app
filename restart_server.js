import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const restartServer = async () => {
  console.log('🔄 Restarting server...');
  
  try {
    // For Windows
    if (process.platform === 'win32') {
      console.log('Killing processes on port 5000...');
      await execAsync('powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"');
      console.log('Killing nodemon processes...');
      await execAsync('powershell -Command "Get-Process | Where-Object {$_.Name -eq \'node\' -and $_.CommandLine -like \'*nodemon*\'} | Stop-Process -Force -ErrorAction SilentlyContinue"');
    } else {
      // For Linux/Mac
      console.log('Killing processes on port 5000...');
      await execAsync('lsof -ti:5000 | xargs kill -9 || true');
    }

    console.log('All conflicting processes killed');
    console.log('Starting server...');
    
    // Start server in a new process
    const child = exec('npm run dev:server');
    
    child.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });
    
    console.log('✅ Server restart process completed!');
    console.log('Check server logs for successful startup.');
    
  } catch (error) {
    console.error('Error during restart:', error);
  }
};

restartServer(); 