const getSftpClient = require('../config/sftpConfig');
const fs = require('fs');

const downloadFile = async (remotePath, localPath) => {
  const sftp = await getSftpClient();
  await sftp.fastGet(remotePath, localPath);
  await sftp.end();
};

module.exports = { downloadFile };
