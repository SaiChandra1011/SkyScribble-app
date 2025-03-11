import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const cleanupAndRestart = async () => {
  console.log('Cleaning up port 5000 and restarting server...');
  
  try {
    // On Windows, find and kill process on port 5000
    if (process.platform === 'win32') {
      console.log('Identifying process on port 5000...');
      const { stdout: findResult } = await execPromise('netstat -ano | findstr :5000');
      console.log('Port status:', findResult);
      
      // Extract PID(s)
      const lines = findResult.split('\n').filter(line => line.includes(':5000'));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[4];
          if (pid && /^\d+$/.test(pid)) {
            console.log(`Killing process with PID: ${pid}`);
            await execPromise(`taskkill /F /PID ${pid}`);
          }
        }
      }
    } else {
      // For Unix systems
      console.log('Killing process on port 5000...');
      await execPromise('kill $(lsof -t -i:5000) 2>/dev/null || true');
    }
    
    console.log('Starting server...');
    execPromise('node server.js')
      .then(({ stdout }) => {
        console.log('Server output:', stdout);
      })
      .catch((error) => {
        console.error('Server error:', error);
      });
      
    console.log('Server started in background.');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    // If cleanup fails, try starting the server anyway
    console.log('Attempting to start server directly...');
    execPromise('node server.js')
      .then(({ stdout }) => {
        console.log('Server output:', stdout);
      })
      .catch((error) => {
        console.error('Server error:', error);
      });
  }
};

cleanupAndRestart(); 