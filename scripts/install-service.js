const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'GPT Task Runner',
  description: 'GPT-powered task runner and automation service with dashboard',
  script: path.join(__dirname, '../dist/service.js'),
  nodeOptions: ['--max_old_space_size=4096'],
  env: {
    name: 'NODE_ENV',
    value: 'production',
  },
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function () {
  console.log('GPT Task Runner service installed successfully!');
  console.log('Starting the service...');
  svc.start();
});

svc.on('start', function () {
  console.log('GPT Task Runner service started successfully!');
  console.log('Dashboard will be available at: http://localhost:3000');
  console.log(
    'Service logs can be viewed in Windows Event Viewer under "Applications and Services Logs"'
  );
});

svc.on('error', function (err) {
  console.error('Service error:', err);
});

// Install the service
console.log('Installing GPT Task Runner service...');
console.log('This may require administrator privileges.');
svc.install();
