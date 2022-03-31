require("dotenv").config();
require("module-alias/register");

const path = require("path");
const { initializeMongoose } = require("@src/database/mongoose");
const { BotClient } = require("@src/structures");

global.__appRoot = path.resolve(__dirname);

// initialisation de Straw
const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");
process.on("unhandledRejection", (err) => client.logger.error(`Unhandled exception`, err));
(async () => {

  // initialisation de la base de données
  await initializeMongoose();

  // Lancement du tableau de bord
  if (client.config.DASHBOARD.enabled) {
    client.logger.log("Lancement du tableau de bord");
    try {
      const { launch } = require("@root/dashboard/app");
      await launch(client);
    } catch (ex) {
      client.logger.error("Echec du lancement du tableau de bord", ex);
    }
  }

	// Lancement de Straw
  await client.login(process.env.BOT_TOKEN);
})();


const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello Express app!')
});

app.listen(process.env.PORT || 5000), () => {
  console.log('server started');
});
