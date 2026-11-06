/**
 * One-time Google OAuth helper.
 *
 *   1. Add http://localhost:53682/callback as an authorised redirect URI
 *      to a "Web application" OAuth client in Google Cloud Console.
 *   2. Put GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.
 *   3. npm run google:auth
 *   4. Copy the printed GOOGLE_REFRESH_TOKEN into .env.
 *
 * The refresh token is printed locally and never sent anywhere else.
 */

import { createServer } from "node:http";
import { exec } from "node:child_process";
import { randomBytes } from "node:crypto";

const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const port = 53682;
const redirectUri = `http://localhost:${port}/callback`;
const scope = "https://www.googleapis.com/auth/calendar";

if (!clientId || !clientSecret) {
  console.error(
    "\nMissing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.\n" +
      "Add them to .env, then run: npm run google:auth\n"
  );
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scope);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");
authUrl.searchParams.set("state", state);

const openBrowser = (url) => {
  const command =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;

  exec(command, () => {
    /* The URL is printed as well. */
  });
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", redirectUri);

  if (url.pathname !== "/callback") {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found.");
    return;
  }

  const fail = (status, message) => {
    response.writeHead(status, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(message);
    server.close();
  };

  const error = url.searchParams.get("error");

  if (error) {
    fail(400, `Authorization failed: ${error}`);
    return;
  }

  if (url.searchParams.get("state") !== state) {
    fail(400, "State mismatch. Please run the script again.");
    return;
  }

  const code = url.searchParams.get("code");

  if (!code) {
    fail(400, "No authorization code returned.");
    return;
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.refresh_token) {
      fail(
        500,
        `Token exchange failed: ${JSON.stringify(tokens)}\n\n` +
          "If no refresh_token came back, remove the app's access at " +
          "https://myaccount.google.com/permissions and run the script again."
      );
      return;
    }

    response.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end(
      "Google Calendar connected. Return to the terminal for the refresh token."
    );

    console.log("\nAdd this line to .env:\n");
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log(
      "Then restart the dev server. Keep this token secret — it grants " +
        "access to your calendar.\n"
    );

    setTimeout(() => server.close(), 250);
  } catch (exchangeError) {
    fail(500, `Token exchange failed: ${String(exchangeError)}`);
  }
});

server.listen(port, () => {
  console.log("\nGoogle Calendar OAuth setup");
  console.log(`Redirect URI: ${redirectUri}`);
  console.log("\nOpen this URL if the browser does not open:\n");
  console.log(authUrl.toString());
  console.log("");
  openBrowser(authUrl.toString());
});
