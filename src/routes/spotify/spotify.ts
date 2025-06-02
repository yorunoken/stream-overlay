import type { SpotifyState } from "./types";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
}

export class Spotify {
    private static token: string | null = null;
    private static refreshToken: string | null = null;
    private static tokenExpiry: number = 0;
    private static TOKEN_FILE = join(process.cwd(), ".spotify-token");

    private static saveRefreshToken(token: string) {
        writeFileSync(this.TOKEN_FILE, token);
    }

    private static loadRefreshToken(): string | null {
        try {
            if (existsSync(this.TOKEN_FILE)) {
                return readFileSync(this.TOKEN_FILE, "utf-8");
            }
        } catch (error) {
            console.error("Error loading refresh token:", error);
        }
        return null;
    }

    static initialize() {
        const savedToken = this.loadRefreshToken();
        if (savedToken) {
            this.refreshToken = savedToken;
        }
    }

    static getAuthUrl(): string {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const redirectUri = process.env.REDIRECT_URI;
        const scope = ["user-read-currently-playing", "user-read-playback-state"].join(" ");

        const params = new URLSearchParams({
            response_type: "code",
            client_id: clientId!,
            scope: scope,
            redirect_uri: redirectUri!,
        });

        return `https://accounts.spotify.com/authorize?${params.toString()}`;
    }

    private static async getNewToken(code?: string): Promise<string> {
        try {
            const clientId = process.env.SPOTIFY_CLIENT_ID;
            const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
            const redirectUri = process.env.REDIRECT_URI;

            if (!clientId || !clientSecret) {
                throw new Error("Missing Spotify Credentials.");
            }

            const params = code
                ? {
                      grant_type: "authorization_code",
                      code: code,
                      redirect_uri: redirectUri,
                  }
                : {
                      grant_type: "refresh_token",
                      refresh_token: this.refreshToken!,
                  };

            const response = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
                },
                body: new URLSearchParams(params as any).toString(),
            });

            const data = (await response.json()) as SpotifyTokenResponse;

            this.token = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

            if (data.refresh_token) {
                this.refreshToken = data.refresh_token;
                this.saveRefreshToken(data.refresh_token);
            }

            return data.access_token;
        } catch (error) {
            if (!code) {
                this.refreshToken = null;
                if (existsSync(this.TOKEN_FILE)) {
                    unlinkSync(this.TOKEN_FILE);
                }
                throw new Error("Invalid refresh token. User needs to authenticate.");
            }
            throw error;
        }
    }

    static async getToken(code?: string): Promise<string> {
        if (code) {
            return await this.getNewToken(code);
        }

        if (!this.token || Date.now() >= this.tokenExpiry) {
            if (!this.refreshToken) {
                throw new Error("No refresh token available. User needs to authenticate.");
            }
            console.log("Refreshing token...");
            return await this.getNewToken();
        }

        return this.token;
    }

    static async getMePlaying() {
        const token = await this.getToken();

        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 204) {
            return null;
        }

        const data = (await response.json()) as SpotifyState;
        return data;
    }
}
