# Ordereat
A no node_modules or npm REST API with a pure CSS, HTML and JS web app. Built as a requirement for the [Pirple Nodejs Masterclass](https://pirple.thinkific.com/courses/the-nodejs-master-class)

#### Required Environment Variables
```bash
STRIPE_TEST_SECRET=sk_test_<stripe_test_secret>
MAILGUN_SANDBOX_DOMAIN=sandbox<mailgun_domain>
MAILGUN_SANDBOX_ADDRESS=<something>@<mailgun_domain>
MAILGUN_API_KEY=<mailgun_api_private_key>
```

#### How to start the server
1. Fill in all required environment variables
2. Ensure the `carts`, `tokens`, and `users` folders are present in the `.data` directory

3. Run the following command
    ```bash
    STRIPE_TEST_SECRET= \
    MAILGUN_SANDBOX_DOMAIN= \
    MAILGUN_SANDBOX_ADDRESS= \
    MAILGUN_API_KEY= \
    node index.js
    ```
#### Accessing the frontend
Wep app is available at root of whatever port your server is running on
