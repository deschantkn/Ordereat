# Ordereat
A no node_modules or npm REST API with a pure CSS, HTML and JS web app. Built as a requirement for the [Pirple Nodejs Masterclass](https://pirple.thinkific.com/courses/the-nodejs-master-class).

#### Project components
1. **REST API** built with internal Node.js modules only
2. Web App built with **HTML, CSS and JS**, no frameworks
3. An **event driven** CLI for admin tasks
4. **Stripe** integration to accept credit card payments
5. **Mailgun** integration to send receipts as emails

#### Required Environment Variables
```bash
STRIPE_TEST_SECRET=sk_test_<stripe_test_secret>
MAILGUN_SANDBOX_DOMAIN=sandbox<mailgun_domain>
MAILGUN_SANDBOX_ADDRESS=<something>@<mailgun_domain>
MAILGUN_API_KEY=<mailgun_api_private_key>
HASHING_SECRET=<token_hashing_string>
```

#### How to start the server
1. Fill in all required environment variables
2. Ensure the `carts`, `tokens`, `orders`, and `users` folders are present in the `.data` directory

3. Run the following command
    ```bash
    STRIPE_TEST_SECRET= \
    MAILGUN_SANDBOX_DOMAIN= \
    MAILGUN_SANDBOX_ADDRESS= \
    MAILGUN_API_KEY= \
    HASHING_SECRET= \
    node index.js
    ```
