# Buy Me a Coffee Donation Alerts

Real-time donation alerts and tracking system for Buy Me a Coffee supporters.

## Features

-   Real-time donation notifications via Server-Sent Events (SSE)
-   Persistent storage of donation history
-   Donation alert overlay for streaming
-   Dashboard for monitoring and testing

## Setup

1. Create a Buy Me a Coffee account at [buymeacoffee.com](https://www.buymeacoffee.com/)

2. Set up webhook integration:

    - Go to your Buy Me a Coffee dashboard
    - Navigate to Settings → Webhooks
    - Add a new webhook with URL: `http://your-server-address:4000/bmac`
    - Select the event types: `Payment Created`
    - Save the webhook configuration

3. If using a local server, use a service like [ngrok](https://ngrok.com/) to expose your local server:
    ```bash
    ngrok http 4000
    ```
    Then use the generated URL as your webhook endpoint.

## Using the BMAC Module

1. Access the donation overlay at:
   `http://localhost:4000/bmac/style1/`

2. Access the dashboard at:
   `http://localhost:4000/bmac/panel/`

3. To test without real donations, you can send a test webhook payload to the `/bmac` endpoint

## API Endpoints

-   POST `/bmac` - Webhook receiver for donation events
-   GET `/bmac/donations` - Returns donation history
-   GET `/bmac/webhook` - SSE endpoint for real-time updates

## Donation Data Structure

The system stores donation data in `donations.json` in the following format:

```json
{
    "type": "payment.created",
    "data": {
        "amount": 5,
        "supporter_name": "Donor Name",
        "support_note": "Optional message",
        "coffee_count": 1,
        "created_at": 1612345678
        // Additional fields...
    }
}
```

All donations are stored persistently and accessible via the API.
