/**
 * Create and export configuration variables
 * 
 */

// Container for all the environments
const environments = {
  // Staging (default) environment
  staging: {
    httpPort: 3000,
    httpsPort: 3001,
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
    httpPort: 5000,
    httpsPort: 5001,
    envName: 'production',
    hashingSecret: 'thisIsASecret',
    maxChecks: 5,
    twilio: {
      accountSid: '',
      authToken: '',
      fromPhone: ''
    },
  }
};

// Determine which environment was passed as command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
