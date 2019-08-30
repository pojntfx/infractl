module.exports = async ({ id, cloud }) =>
  cloud
    .deleteNode(id)
    .then(() => console.log(`Node ${id} successfully deleted.`));
