const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Innovatehub API Generator for production...');

try {
  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync('node_modules')) {
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Build the React application
  console.log('Building React application...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
