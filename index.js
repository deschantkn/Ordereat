/**
 * Entry point for Pizza API
 *
 */

// Dependencies
const server = require('./lib/server');
const cli = require('./lib/cli');

const app = {};

app.init = () => {
  // Initialise http server
  server.init();

  // Start the CLI, make sure it starts last
  setTimeout(() => cli.init(), 100);
};

app.init();
