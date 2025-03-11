import { exec } from 'child_process';
import { platform } from 'os';

console.log('Restarting server...');

// Find processes using port 5000
const findCmd = platform() === 'win32' 
  ? `netstat -ano | findstr :5000` 
  : `lsof -i :5000 -t`;

exec(findCmd, (err, stdout) => {
  if (err) {
    console.error('Error finding server process:', err);
    return;
  }
  
  if (stdout) {
    console.log('Found processes using port 5000:');
    console.log(stdout);
    
    // Kill processes on Windows
    if (platform() === 'win32') {
      // Extract PIDs from netstat output
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 4) {
            const pid = parts[4];
            console.log(`Killing process with PID: ${pid}`);
            exec(`taskkill /F /PID ${pid}`, (killErr, killStdout) => {
              if (killErr) {
                console.error(`Failed to kill process ${pid}:`, killErr);
              } else {
                console.log(`Process ${pid} killed:`, killStdout);
              }
            });
          }
        }
      }
    } else {
      // Kill processes on Unix-like systems
      const pids = stdout.trim().split('\n');
      for (const pid of pids) {
        if (pid) {
          console.log(`Killing process with PID: ${pid}`);
          exec(`kill -9 ${pid}`, (killErr) => {
            if (killErr) {
              console.error(`Failed to kill process ${pid}:`, killErr);
            } else {
              console.log(`Process ${pid} killed`);
            }
          });
        }
      }
    }
  } else {
    console.log('No processes found using port 5000');
  }
  
  // Start the server
  setTimeout(() => {
    console.log('Starting server...');
    
    const serverProcess = exec('node server.js', (startErr, stdout, stderr) => {
      if (startErr) {
        console.error('Error starting server:', startErr);
      }
      if (stderr) {
        console.error('Server error output:', stderr);
      }
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data.trim()}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`Server error: ${data.trim()}`);
    });
    
    console.log('Server restart complete');
  }, 2000); // Wait 2 seconds before starting server
}); 