const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'GPT Task Runner',
  script: path.join(__dirname, '../dist/service.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('GPT Task Runner service uninstalled successfully!');
  console.log('The service exists: ', svc.exists);
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

// Uninstall the service
console.log('Uninstalling GPT Task Runner service...');
console.log('This may require administrator privileges.');
svc.uninstall();
