// netlify/functions/chat.js

/**
 * EchoBot Backend - Netlify Function for Chat Interactions
 *
 * This Node.js backend is implemented as a single Netlify Function
 * using Express.js and the 'serverless-http' package.
 * It serves as the "incredibly simple" core of the EchoBot,
 * designed to demonstrate robust full-stack integration and deployment
 * on Netlify without 404 errors.
 *
 * The function receives a user message via a POST request,
 * echoes it back prefixed with "Echo: ", and handles basic
 * request validation and error responses.
 */

// Import necessary modules
const express = require('express');
const serverless = require('serverless-http');

// Initialize an Express application
const app = express();

// Middleware to parse JSON request bodies.
// This allows us to access the request body as a JavaScript object (req.body).
// Essential for receiving the 'message' from the frontend.
app.use(express.json());

// CORS (Cross-Origin Resource Sharing) Middleware
// This is crucial for allowing the frontend (which will likely be served from
// a different origin/port than the Netlify Function) to make requests
// without being blocked by browser security policies.
// The plan specifies allowing all origins for simplicity in this foundational project.
app.use((req, res, next) => {
    // Set the Access-Control-Allow-Origin header to '*' to allow requests from any origin.
    // In a production environment, for enhanced security, you would typically replace '*'
    // with your specific frontend domain(s) (e.g., "https://your-frontend-domain.netlify.app").
    res.header("Access-Control-Allow-Origin", "*");

    // Set the allowed HTTP methods for cross-origin requests.
    // 'POST' is used for sending messages. 'OPTIONS' is required for browser preflight requests.
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

    // Set the allowed headers that can be sent with the request.
    // 'Content-Type' is essential for sending JSON request bodies.
    res.header("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight requests (HTTP OPTIONS method).
    // Browsers send an OPTIONS request before the actual POST/PUT/DELETE request
    // to check if the server allows the cross-origin request.
    // A 204 No Content response is the standard for a successful preflight.
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    // Proceed to the next middleware or route handler in the Express chain.
    next();
});

/**
 * API Endpoint: POST /
 *
 * This endpoint is designed to handle incoming chat messages from the frontend.
 * It expects a JSON request body containing a 'message' field.
 * The bot's functionality is minimal: it simply echoes back the received message,
 * prefixed with "Echo: ".
 *
 * Note on Routing (`app.post('/')`):
 * The frontend will call `/api/chat`. Due to the `netlify.toml` redirect rule
 * (`from = "/api/*" to = "/.netlify/functions/:splat"`), a request to `/api/chat`
 * is internally rewritten by Netlify to invoke the `chat.js` function located at
 * `/.netlify/functions/chat`.
 * The `serverless-http` library then strips this base path (`/.netlify/functions/chat`),
 * meaning the Express application inside `chat.js` receives the remaining path, which is `/`.
 * Therefore, the route for this endpoint within Express is simply `/`.
 */
app.post('/', (req, res) => {
    // Log the incoming request body for debugging purposes.
    // This helps in verifying what data the function receives.
    console.log('Received request body:', req.body);

    // 1. Request Validation:
    // Extract the 'message' property from the parsed request body.
    const { message } = req.body;

    // Validate the 'message' parameter as per the technical plan:
    // - Must exist (`!message`)
    // - Must be a string (`typeof message !== 'string'`)
    // - Must not be an empty string after trimming whitespace (`message.trim().length === 0`)
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        // If validation fails, return a 400 Bad Request error.
        // This response includes a specific error message as a JSON object.
        console.error('Validation Error: Message parameter is missing or invalid.');
        return res.status(400).json({ error: "Message parameter is missing or invalid." });
    }

    // 2. Core Logic: Construct the bot's echoed response.
    // As per the technical plan, the bot's response is the user's message
    // prepended with "Echo: ".
    const botMessage = `Echo: ${message}`;

    // Log the bot's constructed response for debugging purposes.
    console.log('Sending bot message:', botMessage);

    // 3. Return Success Response:
    // Send a 200 OK HTTP status code.
    // The response body is a JSON object containing the 'botMessage'.
    res.status(200).json({ botMessage });
});

// Error Handling Middleware:
// This is a catch-all middleware for any unhandled errors that occur
// during the processing of requests within the Express application.
// It ensures that even unexpected issues result in a graceful 500 Internal Server Error response.
app.use((err, req, res, next) => {
    // Log the error stack to the console. This is crucial for debugging
    // unexpected issues in a serverless environment.
    // In a production setup, you might integrate with a dedicated logging service.
    console.error('An unexpected error occurred:', err.stack);

    // Return a 500 Internal Server Error with a generic error message.
    // This prevents sensitive error details from being exposed to the client.
    res.status(500).json({ error: "An unexpected error occurred." });
});

// Export the Express app wrapped by `serverless-http`.
// This is the standard and recommended way to expose an Express application
// as a Netlify Function. `serverless-http` acts as an adapter, translating
// the Netlify Function's `event` and `context` objects into standard
// Node.js `req` and `res` objects that Express understands, and then
// translates Express's response back into the Netlify Function's expected format.
exports.handler = serverless(app);