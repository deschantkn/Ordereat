/**
 * PizzAPI server
 *
 */

// Dependencies
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const controllers = require('./controllers');
const helpers = require('./helpers');
const config = require('./config');

// Server logic
class Server {
  constructor(config, http, fs, path, url, StringDecoder, controllers, helpers) {
    this.http = http;
    this.url = url;
    this.config = config;
    this.fs = fs;
    this.path = path;
    this.decoder = new StringDecoder('utf8');
    this.controllers = controllers;
    this.helpers = helpers;
  }

  init() {
    this.router = {
      users: this.controllers.users.bind(this.controllers),
      login: this.controllers.login.bind(this.controllers),
      logout: this.controllers.logout.bind(this.controllers),
      menu: this.controllers.menu.bind(this.controllers),
      cart: this.controllers.cart.bind(this.controllers),
      order: this.controllers.order.bind(this.controllers)
    };

    this.httpServer = this.http.createServer((req, res) => {
      // Get the URL and parse it
      const parsedURL = this.url.parse(req.url, true);
  
      // Get the path
      const path = parsedURL.pathname;
      const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
      // Get the query string as an object
      const query = parsedURL.query;
  
      // Get the HTTP method
      const method = req.method.toLowerCase();
  
      // Get the headers as an object
      const headers = req.headers;
  
      // Get the payload, if any
      let buffer = '';
      req.on('data', data => (buffer += this.decoder.write(data)));
      req.on('end', () => {
        buffer += this.decoder.end();
  
        // Choose the handler this request should go to. Default to notFound
        const chosenHandler =
          typeof this.router[trimmedPath] !== 'undefined'
            ? this.router[trimmedPath]
            : this.controllers.notFound;
  
        // Construct the data object to send to the handler
        const data = {
          trimmedPath,
          query,
          method,
          payload: this.helpers.parseJsonToObj(buffer),
          headers
        };
  
        // Route the request to chosen handler
        chosenHandler(data, (statusCode, payload) => {
          // Use statusCode or default to 200
          statusCode = typeof statusCode === 'number' ? statusCode : 200;
  
          // Use payload or default to empty object
          payload = typeof payload === 'object' ? payload : {};
  
          const payloadString = JSON.stringify(payload);
  
          // Return response
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(statusCode);
          res.end(payloadString);
  
          // Log the request path
          if (statusCode === 200 || statusCode === 201) {
            console.log(
              '\x1b[32m%s\x1b[0m',
              `${method.toUpperCase()} - /${trimmedPath} ${statusCode}`
            ); // Log in green
          } else {
            console.log(
              '\x1b[31m%s\x1b[0m',
              `${method.toUpperCase()} - /${trimmedPath} ${statusCode}`
            ); // Log in red
          }
        });
      });
    });

    this.httpServer.listen(this.config.httpPort, () => console.log('\x1b[34m%s\x1b[0m', `HTTP server listening on port ${this.config.httpPort} in ${this.config.envName} mode`));
  }
}

const server = new Server(config, http, fs, path, url, StringDecoder, controllers, helpers);

module.exports = server;
