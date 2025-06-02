# Spotify Now Playing Display

A real-time display showing your currently playing Spotify track with album art, song title, artist, and progress bar.

## Prerequisites

-   [Bun](https://bun.sh) runtime installed
-   Spotify Premium account
-   Spotify Developer App credentials

## Setup

1. Install Bun if you haven't already:

```bash
curl -fsSL https://bun.sh/install | bash
```

2. Create a Spotify Developer Application:

    - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
    - Click "Create an App"
    - Fill in the app name and description
    - Once created, note down your Client ID and Client Secret
    - Click "Edit Settings"
    - Add `http://localhost:4000/spotify/callback` to the Redirect URIs
    - Save changes

3. Update your `.env.local` file in the project root with:

```env
PORT=4000
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://localhost:4000/spotify/callback
```

## Using the Spotify Module

1. Start the server by running the main application:

```bash
bun start
```

2. Visit `http://localhost:4000/spotify/login` in your browser to authenticate with Spotify

3. Access the Now Playing overlay at:
   `http://localhost:4000/spotify/style1/`

4. The overlay will show your current Spotify playback with real-time updates

## API Endpoints

-   GET `/spotify/login` - Initiates Spotify authentication flow
-   GET `/spotify/callback` - OAuth callback endpoint for Spotify
-   GET `/spotify/api/currently-playing` - Returns current playing track data
-   GET `/spotify/api/album-art?url=...` - Proxies album artwork

## Troubleshooting

If you encounter any issues:

1. Make sure your Spotify account is Premium (required for API access)
2. Verify your Client ID and Secret are correct in `.env.local`
3. Ensure your redirect URI matches exactly in both your .env file and Spotify Dashboard
4. Check that you're actively playing something on Spotify
5. Delete `.spotify-token` file and try logging in again if authentication fails
