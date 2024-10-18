import * as readline from "readline";
import { TelegramClient } from "telegram";
import { NewMessage } from "telegram/events";
import { StringSession } from "telegram/sessions";

import { mediaDownloader } from "./telegramMethods";

import config from "config";

const apiId: number = config.get("TELEGRAM_API_ID");
const apiHash: string = config.get("TELEGRAM_API_HASH");

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clients: { [StringSession: string]: TelegramClient } = {}; // Cache de clientes por token

export async function startTelegramClient(sessionString: string) {
  sessionString = sessionString.trim()
  const stringSession = new StringSession(sessionString)

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

  if (sessionString === "") {
    console.log(`Your session string is: ${client.session.save()}`)
  }

  await client.connect();
  console.log("You should now be connected.");
  client.addEventHandler(mediaDownloader, new NewMessage({}));
  return client;
}

export async function getTelegramClient(sessionString?: string): Promise<TelegramClient> {
  if (sessionString == undefined) {
    if (config.has('TELEGRAM_SESSION_STRING')) {
      sessionString = config.get("TELEGRAM_SESSION_STRING") as string
    } else {
      sessionString = ""
    }
  }

  if (sessionString === "") {
    console.log("Warning: TELEGRAM_SESSION_STRING not set, log in and update the value in config/default.json to the token received")
  }

  if (!clients[sessionString]) {
    const client = await startTelegramClient(sessionString);
    clients[sessionString] = client;
  }
  
  return clients[sessionString];
}
