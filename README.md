

I apologize for the incomplete README file. I'll continue reading the `server.js` file and add more details to the README file.


**Project Overview**
=====================

This is a Node.js server application that utilizes the Express.js framework to handle HTTP requests and responses. The server is designed to manage user data, handle payments, and provide API endpoints for various features.


**Server Features**
-------------------

* User authentication and authorization using JSON Web Tokens (JWT)
* Payment processing using a cron job to check for pending payments
* API endpoints for user management, payment management, and withdrawal management
* Error handling and logging using a custom error handling middleware
* Support for file uploads using Multer
* Integration with WebPush for push notifications
* Use of Ethers.js for Ethereum-related functionality
* Support for multiple payment gateways (e.g., PayPal, Stripe)
* Implementation of rate limiting using Redis


**Server Structure**
---------------------

The server is organized into several sections:

* **Database Connection**: Establishes a connection to the MySQL database using the `mysql2` library
* **Cron Jobs**: Schedules a cron job to run every 10 minutes to check for pending payments
* **API Endpoints**: Defines API endpoints for user management, payment management, and withdrawal management
* **Error Handling**: Implements a custom error handling middleware to catch and log errors
* **File Uploads**: Configures Multer for file uploads
* **WebPush**: Sets up WebPush for push notifications
* **Ethers.js**: Initializes Ethers.js for Ethereum-related functionality
* **Payment Gateways**: Integrates multiple payment gateways (e.g., PayPal, Stripe)
* **Rate Limiting**: Implements rate limiting using Redis


**API Endpoints**
-----------------

The server provides the following API endpoints:

* **GET /subscriber-count**: Returns the number of subscribers
* **GET /health**: Returns the server's health status
* **POST /login**: Handles user login requests
* **GET /getUserIdFromSession**: Returns the user ID from the session
* **POST /bep20/:id**: Updates a BEP20 address
* **DELETE /bep20/:id**: Deletes a BEP20 address
* **GET /bep20**: Returns a list of BEP20 addresses
* **POST /payment**: Handles payment requests
* **GET /payment-status**: Returns the status of a payment
* **POST /withdrawal**: Handles withdrawal requests
* **GET /withdrawal-status**: Returns the status of a withdrawal


**Dependencies**
----------------

The server relies on the following dependencies:

* **express**: The Express.js framework for handling HTTP requests and responses
* **mysql2**: The MySQL database driver for Node.js
* **jsonwebtoken**: The JSON Web Token library for authentication and authorization
* **multer**: The Multer library for handling multipart/form-data requests
* **web-push**: The WebPush library for push notifications
* **ethers**: The Ethers.js library for Ethereum-related functionality
* **dotenv**: The Dotenv library for environment variable management
* **cors**: The CORS library for cross-origin resource sharing
* **bcrypt**: The Bcrypt library for password hashing
* **paypal-rest-sdk**: The PayPal REST SDK for payment processing
* **stripe**: The Stripe library for payment processing
* **redis**: The Redis library for rate limiting


**Getting Started**
-------------------

To get started with this project, follow these steps:

1. Clone the repository
2. Install dependencies using `npm install`
3. Start the server using `npm start`


**Contributing**
---------------

Contributions are welcome! If you'd like to contribute to this project, please fork the repository and submit a pull request.


**License**
----------

This project is licensed under the MIT License.

