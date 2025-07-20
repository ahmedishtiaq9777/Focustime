const config = {
  user: 'testuser3',
  password: '21019909',
  server: 'DESKTOP-TOIM3U1', // e.g., 'localhost' or '127.0.0.1'
  database: 'Focustime',
  options: {
    encrypt: true, // Use true for Azure
    trustServerCertificate: true // Change to false if using a valid cert
  }
};
module.exports=config;
