# Pizza API
A RESTful API without using external packages. No node_modules or npm.

#### Required Environment Variables
```bash
STRIPE_TEST_SECRET=sk_test_<stripe_test_secret>
MAILGUN_SANDBOX_DOMAIN=sandbox<mailgun_domain>
MAILGUN_SANDBOX_ADDRESS=<something>@<mailgun_domain>
MAILGUN_API_KEY=<mailgun_api_private_key>
```

#### How to start the server
```bash
STRIPE_TEST_SECRET= \
MAILGUN_SANDBOX_DOMAIN= \
MAILGUN_SANDBOX_ADDRESS= \
MAILGUN_API_KEY= \
node index.js
```