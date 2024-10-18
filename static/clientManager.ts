import * as readline from "readline";
import { TelegramClient } from "telegram";
import { NewMessage } from "telegram/events";
import { StringSession } from "telegram/sessions";

import { mediaDownloader } from "./telegramMethods";

const config = require("config");

const apiId = config.get("TELEGRAM_API_ID");
const apiHash = config.get("TELEGRAM_API_HASH");

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clients: { [StringSession: string]: TelegramClient } = {}; // Cache de clientes por token

export async function startTelegramClient(stringSession) {
  console.log("Loading interactive example...");
  1;
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () =>
      new Promise((resolve) =>
        terminal.question("Please enter your number: ", resolve)
      ),
    password: async () =>
      new Promise((resolve) =>
        terminal.question("Please enter your password: ", resolve)
      ),
    phoneCode: async () =>
      new Promise((resolve) =>
        terminal.question("Please enter the code you received: ", resolve)
      ),
    onError: (err) => console.log(err),
  });
  await client.connect();
  console.log("You should now be connected.");
  client.addEventHandler(mediaDownloader, new NewMessage({}));
  return client;
}

export async function getTelegramClient(
  stringSession: string = config.get("TELEGRAM_SESSION_STRING")
): Promise<TelegramClient> {
  if (!clients[stringSession]) {
    console.log(`Iniciando novo cliente para o token: ${stringSession}`);
    const client = await startTelegramClient(new StringSession(stringSession));
    clients[stringSession] = client;
  }
  return clients[stringSession];
}
