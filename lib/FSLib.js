/**
 * Storing and edit data in the file system
 * 
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

class FSLib {
  constructor(fs, path, helpers) {
    this.fs = fs;
    this.path = path;
    this.helpers = helpers;
    this.baseDir = path.join(__dirname, '/../.data');
  }

  create (dir, file, data, callback) {
    // Open the file for writing
    this.fs.open(`${this.baseDir}/${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);
  
        // Write to file and close it
        this.fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            this.fs.close(fileDescriptor, (err) => {
              if(!err) {
                callback(false);
              } else {
                callback('Error closing new file');
              }
            });
          } else {
            callback('Error writing to new file');
          }
        });
      } else {
        callback('Could not create new file, it may alread exist');
      }
    });
  }

  // Read data fron a file
  read (dir, file, callback) {
    this.fs.readFile(`${this.baseDir}/${dir}/${file}.json`, 'utf8', (err, data) => {
      if (!err && data) {
        const parsedData = this.helpers.parseJsonToObj(data);
        callback(false, parsedData);
      } else {
        callback(err, data);
      }
    });
  };

  // Update data inside a file
  update (dir, file, data, callback) {
    // Open the file for writing
    this.fs.open(`${this.baseDir}/${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);

        // Truncate the file
        this.fs.truncate(fileDescriptor, (err) => {
          if (!err) {
            // Write to the file and close it
            this.fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                this.fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback('Error closing the file');
                  }
                });
              } else {
                callback('Error writing to existing file');
              }
            });
          } else {
            callback('Error truncating file');
          }
        });
      } else {
        callback('Could not open the file for updating, it may not exist yet');
      }
    });
  };

  // Delete a file
  delete (dir, file, callback) {
    // Unlink the file
    this.fs.unlink(`${this.baseDir}/${dir}/${file}.json`, (err) => {
      if (!err) {
        callback(false);
      } else {
        callback('Error deleting file');
      }
    });
  };

  // List all the items in a directory
  list (dir, callback) {
    this.fs.readdir(`${this.baseDir}/${dir}/`, (err, data)=> {
      if (!err && data && data.length > 0) {
        const trimmedFilenames = [];
        data.forEach((fileName) => {
          trimmedFilenames.push(fileName.replace('.json', ''));
        });
        callback(false, trimmedFilenames);
      } else {
        callback(err, data);
      }
    });
  };

}

const fsLib = new FSLib(fs, path, helpers);
module.exports = fsLib;
