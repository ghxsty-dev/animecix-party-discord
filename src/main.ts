import { DiscordSDK } from "@discord/embedded-app-sdk";
import { initApp } from "./app.js";

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || "";

let discordSdk: DiscordSDK | null = null;
let auth: any = null;

async function initDiscord() {
  try {
    discordSdk = new DiscordSDK(DISCORD_CLIENT_ID);
    await discordSdk.ready();

    auth = await discordSdk.commands.authorize({
      client_id: DISCORD_CLIENT_ID,
      response_type: "code",
      state: "",
      prompt: "none",
    });

    const tokenRes = await fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: auth.code }),
    });
    const { access_token } = await tokenRes.json();

    await discordSdk.commands.authenticate({ access_token });

    console.log("Discord SDK hazır");
    return { discordSdk, auth };
  } catch (err) {
    console.error("Discord SDK hatası:", err);
    return null;
  }
}

async function main() {
  const loadingEl = document.getElementById("loading")!;

  const discordResult = await initDiscord();

  loadingEl.remove();

  initApp(discordSdk, auth);
}

main();
