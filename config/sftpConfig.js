const Client = require('ssh2-sftp-client');
require('dotenv').config();

const sftp = new Client();

module.exports = async () => {
  await sftp.connect({
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD,
  });
  return sftp;
};