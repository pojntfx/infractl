// Wait until a job has finished
module.exports = (client, functionToCall) =>
  client.apis.batch.v1
    .namespaces("default")
    .job("longhorn-uninstall")
    .get()
    .then(job => job.body.status.succeeded === 1)
    .then(extracted =>
      extracted
        ? functionToCall()
        : setTimeout(() => withFinishedJob(client, functionToCall), 1000)
    );