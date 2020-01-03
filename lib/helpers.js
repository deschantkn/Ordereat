/**
 * Helpers for various tasks
 * 
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');

// Container for all the helpers
const helpers = {
  // Create a SHA256 hash
  hash: (str) => {
    if (typeof str === 'string' && str.length > 0) {
      const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
      return hash;
    } else {
      return false;
    }
  },

  // Parse a JSON string to an object in all cases, without throwing
  parseJsonToObj: (str) => {
    try {
      const obj = JSON.parse(str);
      return obj;
    } catch (err) {
      return {};
    }
  },

  // Create a string of random alphanumeric characters of a given length
  createRandomString: (strLength) => {
    strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
      // Define all possible characters that could go into a string
      const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

      // Start the final string;
      let str = '';
      for (i = 1; i <= strLength; i++) {
        // Get a random character
        const randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
        //Append to the final string
        str += randomChar;
      }

      return str;
    } else {
      return false;
    }
  },

  // Make a stripe payment
  stripe: (amount, callback) => {
    // Validata parameters
    amount = typeof amount === 'number' && amount > 0 ? amount : false;

    const postData = querystring.stringify({
      amount,
      currency: 'rwf'
    });

    if (amount) {
      // Configure request details
      const requestDetails = {
        protocol: 'https:',
        hostname: 'api.stripe.com',
        method: 'POST',
        path: `/v1/payment_intents`,
        auth: `${config.stripe.testSecret}:`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      // Instantiate request object
      const req = https.request(requestDetails, (res) => {
        let responseString = '';
        res.on('data', (chunk) => responseString += chunk);

        res.on('end', () => {
          // Grab the status of the sent request
          const status = res.statusCode;

          // callback successfuly
          if (status === 200 || status === 201) {
            callback(false, helpers.parseJsonToObj(responseString));
          } else {
            callback(`Status code returned was ${status}`);
          }
        });
      });

      // Bind to the error event so it doesn't get thrown
      req.on('error', (e) => {
        callback(e);
      });

      // Add the payload to the request
      req.write(postData);

      // End the request
      req.end();
    } else {
      callback('Invalid or missing parameters');
    }
  },

  // Send receipt
  mailgun: (recipient, subject, mailBody, callback) => {
    const emailRegex = RegExp("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", "i", "g");
    recipient = typeof recipient === 'string' && emailRegex.test(recipient.trim()) ? recipient.trim() : false;
    subject = typeof subject === 'string' && subject.trim().length > 0 ? subject.trim() : false;
    mailBody = (typeof mailBody !== 'null' || typeof mailBody !== 'undefined') ? mailBody : false;

    if (recipient && subject && mailBody) {
      const payload = {
        from: config.mailgun.testAddress,
        to: recipient,
        subject: subject,
        text: mailBody
      };
      const stringPayload = querystring.stringify(payload);

      const requestDetails = {
        protocol: 'https:',
        hostname: 'api.mailgun.net',
        method: 'POST',
        path: `/v3/${config.mailgun.testDomain}/messages`,
        auth: `api:${config.mailgun.apiKey}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(stringPayload)
        },
      };

      const req = https.request(requestDetails, (res) => {
        let responseString = '';
        res.on('data', (chunk) => responseString += chunk);
        res.on('end', () => {
          const status = res.statusCode;
          if (status === 200 || status === 201) {
            callback(false, responseString);
          } else {
            callback(`Status code returned was ${status}`);
          }
        });
      });

      req.write(stringPayload);
      req.end();
    } else {
      callback('Invalid or missing parameters');
    }
  }
};

module.exports = helpers;
