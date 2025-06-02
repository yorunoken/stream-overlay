# Nightscout Glucose Monitor

A real-time blood glucose display for streamers with diabetes who use Nightscout for glucose monitoring.

## Prerequisites

-   [Bun](https://bun.sh) runtime installed
-   A working Nightscout instance
-   Your Nightscout URL

## Setup

1. Update your `.env.local` file in the project root with:

```env
PORT=4000
NIGHTSCOUT_URL="https://your-nightscout-instance.com"
```

Replace `https://your-nightscout-instance.com` with your actual Nightscout URL.

## Using the Glucose Monitor

1. Start the server by running the main application:

```bash
bun start
```

2. Access the Glucose Monitor overlay at:
   `http://localhost:4000/nightscout/web/glucose/`

3. Add this URL as a browser source in your streaming software (OBS, Streamlabs, etc.)

## Features

-   Real-time glucose value display with trending arrow
-   Color indicators for high, low, in-range values
-   Shows time since last reading
-   Automatic reconnection if connection lost
-   Semi-transparent background that works well as an overlay

## API Endpoints

-   GET `/nightscout/api/get-glucose` - Returns the latest glucose readings
-   GET `/nightscout/webhook` - SSE endpoint for real-time glucose updates

## Troubleshooting

If you encounter any issues:

1. Make sure your Nightscout URL is correctly set in the `.env.local` file
2. Check that your Nightscout instance is online and accessible
3. Verify that your Nightscout API is working by visiting `your-nightscout-url/api/v1/entries.json?count=1`
4. Check the browser console for any connection errors
