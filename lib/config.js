/**
 * Create and export configuration variables
 * 
 */

// Container for all the environments
const environments = {
  // Staging (default) environment
  staging: {
    httpPort: 3000,
    envName: 'staging',
    hashingSecret: 'thisIsASecret',
    maxChecks: 5,
    stripe: {
      testSecret: process.env.STRIPE_TEST_SECRET
    },
    mailgun: {
      testDomain: process.env.MAILGUN_SANDBOX_DOMAIN,
      testAddress: process.env.MAILGUN_SANDBOX_ADDRESS,
      apiKey: process.env.MAILGUN_API_KEY
    },
    templateGlobals : {
      appName: 'Ordereat!',
      companyName: 'Awesome, Inc.',
      yearCreated: '2020',
      baseUrl: 'http://localhost:3000/'
    }
  },
  // Production environment
  production: {
    httpsPort: process.env.PORT || 5000,
    envName: 'production',
    hashingSecret: process.env.HASHING_SECRET,
    maxChecks: 5,
    stripe: {
      testSecret: process.env.STRIPE_TEST_SECRET
    },
    mailgun: {
      testDomain: process.env.MAILGUN_SANDBOX_DOMAIN,
      testAddress: process.env.MAILGUN_SANDBOX_ADDRESS,
      apiKey: process.env.MAILGUN_API_KEY
    },
    templateGlobals : {
      appName: 'Ordereat!',
      companyName: 'Awesome, Inc.',
      yearCreated: '2020',
      baseUrl: 'https://node-ordereat.herokuapp.com/'
    }
  }
};

// Determine which environment was passed as command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';
console.log('===>', process.env, currentEnvironment);
// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
