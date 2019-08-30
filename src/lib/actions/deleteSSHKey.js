module.exports = ({ id, cloud }) =>
  cloud
    .deleteSSHKey(id)
    .then(() => console.log(`SSH key ${id} successfully deleted.`));
