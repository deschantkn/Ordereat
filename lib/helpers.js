/**
 * Helpers for various tasks
 * 
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

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
  },

  // Get the string content of a template
  getTemplate: (templateName, data, callback) => {
    templateName = typeof templateName === 'string' && templateName.length > 0 ? templateName : false;
    data = typeof data == 'object' && data !== null ? data : {};

    if (templateName) {
      const templatesDir = path.join(__dirname, '/../templates');
      fs.readFile(`${templatesDir}/${templateName}.html`, 'utf8', (err, str) => {
        if (!err && str && str.length > 0) {
          const finalString = helpers.interpolate(str, data);
          callback(false, finalString);
        } else {
          callback(`Template ${templateName} could not be found`);
        }
      });
    } else {
      callback('Invalid template name provided');
    }
  },

  // Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
  addUniversalTemplates: (str, data, callback) => {
    str = typeof str === 'string' && str.length > 0 ? str : '';
    data = typeof data === 'object' && data !== null ? data : {};

    // Get the header
    helpers.getTemplate('_header', data, (err, headerString) => {
      if (!err && headerString) {
        // Get the footer
        helpers.getTemplate('_footer', data, (err, footerString) => {
          if (!err && headerString) {
            // Add them all together
            const fullString = headerString+str+footerString;
            callback(false, fullString);
          } else {
            callback('Could not find the footer template');
          }
        });
      } else {
        callback('Could not find the header template');
      }
    });
  },

  // Take a given string and data object, and find/replace all the keys within it
  interpolate: (str, data) => {
    str = typeof str == 'string' && str.length > 0 ? str : '';
    data = typeof data == 'object' && data !== null ? data : {};

    // Add the templateGlobals to the data object, prepending their key name with "global."
    for (const keyName in config.templateGlobals) {
      if (config.templateGlobals.hasOwnProperty(keyName)) {
        data['global.'+keyName] = config.templateGlobals[keyName]
      }
    }
    // For each key in the data object, insert its value into the string at the corresponding placeholder
    for (const key in data) {
      if (data.hasOwnProperty(key) && typeof(data[key] == 'string')) {
          var replace = data[key];
          var find = '{'+key+'}';
          str = str.replace(find,replace);
      }
    }
    return str;
  },

  getStaticAsset: (fileName, callback) => {
    fileName = typeof fileName == 'string' && fileName.length > 0 ? fileName : false;
    if (fileName) {
      const publicDir = path.join(__dirname, '/../public/');
      fs.readFile(publicDir+fileName, (err, data) => {
        if (!err && data) {
          callback(false, data);
        } else {
          callback('No file could be found');
        }
      });
    } else {
      callback('A valid file name was not specified');
    }
  },
};

module.exports = helpers;
