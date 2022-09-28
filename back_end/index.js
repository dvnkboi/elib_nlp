const { app, socketServer } = require('./src/app');
const { setupMongo } = require('./src/utils/mongo');

console.log('booting up', new Date());

socketServer.listen(3001, async () => {
  await setupMongo();
});

app.listen(3000, () => {
  console.log('app listening on port', 3000);
});