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
      '': this.controllers.index.bind(this.controllers),
      'account/create': this.controllers.createAccount.bind(this.controllers),
      'account/login': this.controllers.createSession.bind(this.controllers),
      'account/menu': this.controllers.viewMenu.bind(this.controllers),
      'account/cart': this.controllers.viewCart.bind(this.controllers),
      'cart/order': this.controllers.makeOrder.bind(this.controllers),
      'api/users': this.controllers.users.bind(this.controllers),
      'api/login': this.controllers.login.bind(this.controllers),
      'api/logout': this.controllers.logout.bind(this.controllers),
      'api/menu': this.controllers.menu.bind(this.controllers),
      'api/cart': this.controllers.cart.bind(this.controllers),
      'api/order': this.controllers.order.bind(this.controllers),
      public: this.controllers.public.bind(this.controllers),
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
        let chosenHandler =
          typeof this.router[trimmedPath] !== 'undefined'
            ? this.router[trimmedPath]
            : this.controllers.notFound;

        // If the request is within the public directory use to the public handler instead
        chosenHandler = trimmedPath.includes('public/') ? this.controllers.public.bind(this.controllers) : chosenHandler;
  
        // Construct the data object to send to the handler
        const data = {
          trimmedPath,
          query,
          method,
          payload: this.helpers.parseJsonToObj(buffer),
          headers
        };
  
        // Route the request to chosen handler
        chosenHandler(data, (statusCode, payload, contentType) => {
          // Determine the type of response (fallback to JSON)
          contentType = typeof contentType === 'string' ? contentType : 'json';

          // Use statusCode or default to 200
          statusCode = typeof statusCode === 'number' ? statusCode : 200;

          // Return content-specific respose parts
          let payloadString = '';
          switch (contentType) {
            case 'json':
              res.setHeader('Content-Type', 'application/json');
              payload = typeof payload === 'object' ? payload : {};
              payloadString = JSON.stringify(payload);
              break;

            case 'html':
              res.setHeader('Content-Type', 'text/html');
              payloadString = typeof payload === 'string' ? payload : '';
              break;

            case 'favicon':
              res.setHeader('Content-Type', 'image/x-icon');
              payloadString = typeof payload !== 'undefined' ? payload : '';
              break;

            case 'plain':
              res.setHeader('Content-Type', 'text/plain');
              payloadString = typeof payload !== 'undefined' ? payload : '';
              break;

            case 'css':
              res.setHeader('Content-Type', 'text/css');
              payloadString = typeof payload !== 'undefined' ? payload : '';
              break;

            case 'png':
              res.setHeader('Content-Type', 'image/png');
              payloadString = typeof payload !== 'undefined' ? payload : '';
              break;

            case 'jpg':
              res.setHeader('Content-Type', 'image/jpeg');
              payloadString = typeof payload !== 'undefined' ? payload : '';
              break;

            default:
              break;
          }
  
          // Return response
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
