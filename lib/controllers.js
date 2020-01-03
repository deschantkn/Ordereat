/**
 * PizzAPI request controllers
 * 
 */

// Dependencies
const helpers = require('./helpers');
const fsLib = require('./FSLib');

class Controllers {
  constructor(helpers, fsLib) {
    this.userMethods = ['post'];
    this.loginMethods = ['post'];
    this.logoutMethods = ['get'];
    this.menuMethods = ['get'];
    this.cartMethods = ['post'];
    this.orderMethods = ['post'];
    this.helpers = helpers;
    this.fsLib = fsLib;
    this.emailRegex = RegExp("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$", "i", "g");
  }

  /**
   * POST - /order
   * Required headers: token
   * Required data: email
   */
  order (data, cb) {
    if (this.orderMethods.includes(data.method)) {
      const { headers, payload } = data;

      // Verify token
      this.verifyToken(headers.token, payload.email, (isValid, tokenData) => {
        if (isValid && tokenData) {
          // Fetch user's cart and compute total
          this.fsLib.read('carts', tokenData.email, (err, cartData) => {
            if (!err && cartData) {
              this.computeCartTotal(cartData, (err, cartTotal, receipt) => {
                if (!err && cartTotal) {
                  // Initiate stripe payment
                  this.helpers.stripe(cartTotal, (err, stripeResponse) => {
                    if (!err && stripeResponse) {
                      // Send receipt email
                      this.helpers.mailgun(tokenData.email, 'Here is your pizza receipt', receipt, (err, mailgunResponse) => {
                        if (!err && data) {
                          cb(200, { stripeResponse, mailgunResponse: JSON.parse(mailgunResponse) });
                        } else {
                          console.log(err);
                          cb(500, { error: 'Could not send email to user' });
                        }
                      });
                    } else {
                      console.log(err);
                      cb(500, { error: 'Could not process your the payment' });
                    }
                  });
                } else {
                  cb(500, { error: 'Could not compute cart total' });
                }
              });
            } else {
              cb(500, { error: 'Could not read cart data' });
            }
          });
        } else {
          cb(403);
        }
      });
    } else {
      cb(405);
    }
  }

  /**
   * POST - /cart
   * Required headers: token
   * Required data: pizzaId
   */
  cart (data, cb) {
    if (this.cartMethods.includes(data.method)) {
     const { headers, payload } = data;

     // Verify token
     this.verifyToken(headers.token, payload.email, (isValid, tokenData) => {
       if (isValid) {
        this.findPizzaById(payload.pizzaId, (err, chosenPizza) => {
          if (!err && chosenPizza) {
            // Find user cart (create one if they don't have it)
            this.fsLib.read('carts', tokenData.email, (err, cartData) => {
              if (!err && cartData) {
                // Push pizza to cart and update
                cartData.push(...chosenPizza);
                this.fsLib.update('carts', tokenData.email, cartData, (err) => {
                  if (!err) {
                    cb(200);
                  } else {
                    console.log(err);
                    cb(500, { error: 'Could not update cart' });
                  }
                });
              } else {
                // Create cart
                this.fsLib.create('carts', tokenData.email, chosenPizza, (err) => {
                if (!err) {
                  cb(200);
                } else {
                  console.log(err);
                  cb(500, { error: 'Could not add pizza to cart' });
                }
              });
              }
            });
          } else {
            cb(500, { error: 'Could not find pizza' });
          }
        });
       } else {
        cb(403);
       }
     });
    } else {
      cb(405);
    }
  }

  /**
   * GET - /menu
   * Required headers: token
   * Required query params: email
   * Optional data: none
   */
  menu (data, cb) {
    if (this.menuMethods.includes(data.method)) {
      const { headers, query } = data;
      // Verify token
      this.verifyToken(headers.token, query.email, (isValid) => {
        if (isValid) {
          this.fsLib.read('menu', 'pizzas', (err, menuData) => {
            if (!err && menuData) {
              cb(200, menuData);
            } else {
              console.log(`Error reading menu item: ${menuItem}`);
            }
          });
        } else {
          cb(403, { error: 'Token expired or invalid. Cannot fetch menu items' });
        }
      });
    } else {
      cb(405);
    }
  }

  /**
   * GET - /logout
   * Required query params: email
   * Required headers: token
   * Optional data: none
   */
  logout (data, cb) {
    if (this.logoutMethods.includes(data.method)) {
      const { headers, query } = data;
      // Verify token
      this.verifyToken(headers.token, query.email, (isValid) => {
        if (isValid) {
          // delete token
          this.fsLib.delete('tokens', headers.token, (err) => {
            if (!err) {
              cb(200);
            } else {
              cb(500, { error: 'Could not delete token. Logout failed.' });
            }
          });
        } else {
          cb(403, { error: 'Token already expired or invalid' });
        }
      });
    } else {
      cb(405);
    }
  }

  /**
   * POST - /login
   * Required data: email, password
   * Optional data: none
   */
  login (data, cb) {
    if (this.loginMethods.includes(data.method)) {
      const { payload } = data;
      const email = typeof payload.email === 'string' && this.emailRegex.test(payload.email.trim()) ? payload.email.trim() : false;
      const password = typeof(payload.password) === 'string' && payload.password.trim().length > 0 ? payload.password.trim() : false;

      if (email && password) {
        // Lookup user with matching email
        this.fsLib.read('users', email, (err, userData) => {
          if (!err && userData) {
            // Has the sent password and compare to the password stored in the user object
            const hashedPassword = helpers.hash(password);
            if (hashedPassword === userData.hashedPassword) {
              // Create a new token with a random name. Set expiration date 1 hour in the future
              const tokenId = this.helpers.createRandomString(20);
              const expires = Date.now() + 1000 * 60 * 60;
              const tokenObj = {
                email,
                expires,
                id: tokenId
              };
  
              // Store the token
              this.fsLib.create('tokens', tokenId, tokenObj, (err) => {
                if (!err) {
                  cb(200, tokenObj);
                } else {
                  cb(500, { error: 'Could not create the new token' });
                }
              });
            } else {
              cb(400, { error: 'Password does not match the stored password' });
            }
          } else {
            cb(400, { error: 'Could not find the specified user' });
          }
        });
      } else {
        cb(400, { error: 'Missing required fields' });
      }
    } else {
      cb(405);
    }
  }

  verifyToken (id, email, cb) {
    // Lookup the token
    this.fsLib.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check that the token is for the given user and has no expired
        if (tokenData.email === email && tokenData.expires > Date.now()) {
          cb(true, tokenData);
        } else {
          cb(false);
        }
      } else {
        cb(false);
      }
    });
  }

  // find pizza by id
  findPizzaById (id, cb) {
    // Get all pizzas
    this.fsLib.read('menu', 'pizzas', (err, pizzas) => {
      if (!err && pizzas) {
        const pizzaMenu = pizzas.menu;
        const result = pizzaMenu.filter(pizza => pizza.id === id);
        cb(false, result);
      } else {
        cb(true);
      }
    });
  }

  computeCartTotal (cart, cb) {
    let receipt = 'Your order:\n';

    cart.map((item) => receipt += `\n${item.name}`);

    const total = cart.reduce((result, item) => result + item.price, 0);

    if (typeof total === 'number' && total > 0) {
      receipt += `\n\n TOTAL: ${total}`
      cb(false, total, receipt);
    } else {
      cb('Could not compute cart total');
    }
  }

  // Users
  users (data, cb) {
    if (this.userMethods.includes(data.method)) {
      switch(data.method) {
        case 'post':
          this._createUser(data, cb)
          break;
        default:
          break;
      }
    } else {
      cb(405);
    }
  }

  /**
   * POST - /users
   * Required data: name, email, address
   * Optional data: none
   */
  _createUser (data, cb) {
    const { payload } = data;
    const name = typeof payload.name === 'string' && payload.name.trim().length > 0 ? payload.name.trim() : false;
    const email = typeof payload.email === 'string' && this.emailRegex.test(payload.email.trim()) ? payload.email.trim() : false;
    const address = typeof payload.address === 'string' && payload.address.trim().length > 0 ? payload.address.trim() : false;
    const password = typeof(payload.password) === 'string' && payload.password.trim().length > 0 ? payload.password.trim() : false;

    if (name && email && address && password) {
      // Check if user exists
      this.fsLib.read('users', email, (err) => {
        if (err) {
          // Hash the password
          const hashedPassword = helpers.hash(password);

          if (hashedPassword) {
            const userObj = {
              name,
              email,
              address,
              hashedPassword
            };

            this.fsLib.create('users', email, userObj, (err) => {
              if (!err) {
                cb(201);
              } else {
                cb(500, { error: 'Could not create the new user' });
                console.log(err);
              }
            });
          } else {
            cb(500, { error: 'Could not hash the password' });
          }
        } else {
          cb(400, { error: 'User with that email arealdy exists' });
        }
      });
    } else {
      cb(400, { error: 'Missing or invalid fields' });
    }
  }

  notFound (data, cb) {
    cb(404);
  }
}

const controller = new Controllers(helpers, fsLib);

module.exports = controller;
