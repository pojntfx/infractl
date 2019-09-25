const Cater = require("./cater");
const fs = require("fs");
const Cryptographer = require("./cryptographer");

module.exports = class {
  async createBackupSetup(
    source,
    destination,
    { endpoint, bucket, accessKey, secretKey, encryptionPassword }
  ) {
    const cater = new Cater();
    const originalBackuper = await cater.getFileContent(source, false, false);
    const cryptographer = new Cryptographer();
    const backuperWithSetup = originalBackuper
      .replace(/BACKUP_S3_ENDPOINT/g, endpoint)
      .replace(/BACKUP_S3_BUCKET/g, bucket)
      .replace(
        /BACKUP_S3_ACCESS_KEY/g,
        await cryptographer.getBase64(accessKey)
      )
      .replace(
        /BACKUP_S3_SECRET_KEY/g,
        await cryptographer.getBase64(secretKey)
      )
      .replace(
        /BACKUP_ENCRYPTION_PASSWORD/g,
        await cryptographer.getBase64(encryptionPassword)
      );
    return await new Promise(resolve =>
      fs.writeFile(destination, backuperWithSetup, () => resolve(destination))
    );
  }
};
