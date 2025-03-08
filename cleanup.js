import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const cleanup = async () => {
  console.log('🧹 Starting cleanup process...');
  
  try {
    // Kill all Node.js processes
    console.log('Killing all Node.js processes...');
    try {
      if (process.platform === 'win32') {
        await execAsync('taskkill /F /IM node.exe');
      } else {
        await execAsync('killall -9 node || true');
      }
      console.log('✅ All Node.js processes terminated');
    } catch (error) {
      console.log('No Node.js processes found to terminate');
    }
    
    // Wait a moment to ensure all processes are fully terminated
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start the server
    console.log('Starting server on port 5000...');
    const server = exec('npm run server');
    
    server.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      
      // When server is ready, start the frontend
      if (data.includes('Server running on port 5000')) {
        console.log('Starting frontend application...');
        const frontend = exec('npm run dev');
        
        frontend.stdout.on('data', (frontendData) => {
          console.log(`Frontend: ${frontendData}`);
        });
        
        frontend.stderr.on('data', (frontendError) => {
          console.error(`Frontend Error: ${frontendError}`);
        });
      }
    });
    
    server.stderr.on('data', (error) => {
      console.error(`Server Error: ${error}`);
    });
    
    console.log('✅ Cleanup and restart process initiated');
    console.log('Check logs for successful startup');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

cleanup(); 