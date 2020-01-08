/**
 * CLI-related Tasks
 * 
 */

// Dependencies
const readline = require('readline');
const events = require('events');
const fsLib = require('./FSLib');
const helpers = require('./helpers');

class _events extends events {};
const e = new _events();

// Instantiate the CLI module object
const cli = {};
cli._interface = null;
cli.responders = {};

// Input handlers
e.on('man', (str) => cli.responders.help());
e.on('help', (str) => cli.responders.help());
e.on('exit', (str) => cli.responders.exit());
e.on('menu items', (str) => cli.responders.menuItems());
e.on('recent orders', (str) => cli.responders.recentOrders());
e.on('view order', (str) => cli.responders.viewOrder(str));
e.on('recent signups', (str) => cli.responders.recentSignups());
e.on('view user', (str) => cli.responders.viewUser(str));

// Exit
cli.responders.exit = () => process.exit(0);

cli.responders.help = () => {
  const commands = {
    'exit': 'Kill the CLI including the server',
    'man': 'Show this help page',
    'help': 'Just an alias for man',
    'menu items': 'Displays current menu items',
    'recent orders': 'View orders made in the last 24 hours',
    'view order --{orderId}': 'Show details for a specific order',
    'recent signups': 'View signups made in the last 24 hours',
    'view user --{userEmail}': 'Show details for a specifc user'
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command with its description, in white and yellow
  Object.entries(commands).forEach(entry => {
    const [key, value] = entry;
    let line = `\x1b[33m${key}\x1b[0m`;
    const padding = 60 - line.length;
    for (let i = 0; i < padding; i++) {
      line += ' ';
    }
    line += value;
    console.log(line);
    cli.verticalSpace();
  });

  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();
  cli._interface.prompt(true);
};

cli.responders.menuItems = () => {
  fsLib.read('menu', 'pizzas', (err, menuData) => {
    if (!err && menuData) {
      cli.verticalSpace();
      console.dir(menuData, { colors: true, depth: 3 });
      cli.verticalSpace();
      cli._interface.prompt(true);
    }
  });
};

cli.responders.recentOrders = () => {
  fsLib.list('orders', (err, orderIds) => {
    if (!err && orderIds && orderIds.length > 0) {
      cli.verticalSpace();
      orderIds.forEach(orderId => {
        fsLib.read('orders', orderId, (err, order) => {
          _24HAgo = Date.now() - (24 * 60 * 60 * 1000);
          if (order.dateCreated >= _24HAgo) {
            console.log(`ID: ${order.id} TOTAL: ${order.total} DATE: ${new Date(order.dateCreated)}`);
            cli.verticalSpace();
            cli._interface.prompt(true);
          }
        });
      });
    }
  });
};

cli.responders.viewOrder = (str) => {
  // Get the ID from the string
  const arr = str.split('--');
  const orderId = typeof arr[1] === 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;

  if (orderId) {
    fsLib.read('orders', orderId, (err, orderData) => {
      if (!err && orderData) {
        cli.verticalSpace();
        console.dir({ ...orderData, dateCreated: new Date(orderData.dateCreated) }, { colors: true });
        cli.verticalSpace();
        cli._interface.prompt(true);
      }
    });
  }
};

cli.responders.recentSignups = () => {
  fsLib.list('users', (err, userIds) => {
    if (!err && userIds && userIds.length > 0) {
      cli.verticalSpace();
      userIds.forEach(userId => {
        fsLib.read('users', userId, (err, user) => {
          _24HAgo = Date.now() - (24 * 60 * 60 * 1000);
          if (user.dateCreated >= _24HAgo) {
            console.log(`NAME: ${user.name} EMAIL: ${user.email}`);
            cli.verticalSpace();
            cli._interface.prompt(true);
          }
        });
      });
    }
  });
};

cli.responders.viewUser = (str) => {
  // Get the ID from the string
  const arr = str.split('--');
  const emailRegex = RegExp("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", "i", "g");
  const userEmail = typeof arr[1] === 'string' && emailRegex.test(arr[1].trim()) ? arr[1].trim() : false;

  if (userEmail) {
    fsLib.read('users', userEmail, (err, userData) => {
      if (!err && userData) {
        cli.verticalSpace();
        delete userData.hashedPassword;
        console.dir({ ...userData, dateCreated: new Date(userData.dateCreated) }, { colors: true });
        cli.verticalSpace();
        cli._interface.prompt(true);
      }
    });
  }
};

// Input processor
cli.processInput = (str) => {
  str = typeof str === 'string' && str.trim().length > 0 ? str.trim() : false;
  
  // Only process if user actually wrote something
  if (str) {
    // Mapping unique strings to allowed questions
    const uniqueInputs = [
      'man',
      'help',
      'exit',
      'menu items',
      'recent orders',
      'view order',
      'recent signups',
      'view user',
    ];

    // Go through the possible inputs and emit an event when a match is found
    let matchFound = false;
    let counter = 0;
    uniqueInputs.some((input) => {
      if (str.toLowerCase().includes(input)) {
        matchFound = true;

        // Emit an event matching the unique input, and include the full string given
        e.emit(input, str);
        return true;
      }
    });

    // If no match is found tell the user to try again
    if (!matchFound) console.log('Sorry, try again');
  }
};

cli.verticalSpace = (lines) => {
  lines = typeof lines === 'number' && lines > 0 ? lines : 1;
  for (let i = 0; i < lines; i++) {
    console.log('');
  }
};

cli.horizontalLine = () => {
  // Get the available screen size
  const width = process.stdout.columns;
  let line = '';
  for (let i = 0; i < width; i++) {
    line += '-';
  }
  console.log(line);
};

// Create centered text on the screen
cli.centered = (str) => {
  str = typeof str === 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  const width = process.stdout.columns;

  // Calculate the left padding there should be
  const leftPadding = Math.floor((width - str.length) / 2);

  // Put the left padded spaced before the string itself
  let line = '';
  for (let i = 0; i < leftPadding; i++) {
    line += ' ';
  }
  line += str;
  console.log(line);
};

cli.init = () => {
  // Send the start message to the console in dark blue
  console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');

  // Start the interface
  cli._interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  // Create an initial prompt
  cli._interface.prompt(true);

  // Handle each line of input seperately
  cli._interface.on('line', (str) => cli.processInput(str));

  // Re-initialize the prompt afterwards
  cli._interface.prompt(true);

  // If the user stops th cli, kill the associate process
  cli._interface.on('close', () => process.exit(0));
};

// Export the module
module.exports = cli;