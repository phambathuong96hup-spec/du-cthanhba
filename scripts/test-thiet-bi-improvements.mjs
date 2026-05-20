import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('Quản lý trang thiết bị/src/App.tsx', 'utf8');
const dashboard = fs.readFileSync('Quản lý trang thiết bị/src/pages/Dashboard.tsx', 'utf8');
const repair = fs.readFileSync('Quản lý trang thiết bị/src/pages/RepairRequest.tsx', 'utf8');
const login = fs.readFileSync('Quản lý trang thiết bị/src/pages/Login.tsx', 'utf8');

assert.match(
  app,
  /<Route path="devices" element=\{<PrivateRoute><Devices \/><\/PrivateRoute>\}/,
  'device list route should require authentication',
);

assert.match(
  app,
  /<Route path="devices\/:id" element=\{<PrivateRoute><DeviceDetails \/><\/PrivateRoute>\}/,
  'device detail route should require authentication',
);

assert.equal(
  dashboard.includes('devices.slice(0, 5).map'),
  false,
  'dashboard repair table should not render arbitrary device rows',
);

assert.match(
  dashboard,
  /activeRepairs\.slice\(0,\s*5\)\.map/,
  'dashboard repair table should render active repair rows',
);

assert.equal(
  dashboard.includes("labels.push('Khác')") || dashboard.includes('labels.push("Khác")'),
  false,
  'department distribution chart should not collapse real departments into Khác',
);

assert.equal(
  repair.includes('selectedImage'),
  false,
  'repair form should not expose an image attachment flow that is not submitted to the backend',
);

assert.equal(
  login.includes('login-options'),
  false,
  'login page should not render inactive remember-pin or forgot-pin controls',
);

console.log('thiet-bi improvement checks passed');
