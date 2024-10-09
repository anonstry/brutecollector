import * as fs from "fs";
import * as readline from "readline";
import { Api, TelegramClient } from "telegram";
// import { CustomFile } from "telegram/client/uploads";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { StringSession } from "telegram/sessions";
// const { events } = require("telegram");

const parseUrl = require("parse-url");
const config = require("config");

const apiId = config.get("TELEGRAM_API_ID");
const apiHash = config.get("TELEGRAM_API_HASH");
const stringSession = new StringSession(config.get("TELEGRAM_SESSION_STRING"));
// console.log(config.util.getEnv("TEST"));

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getMessage(
  client: TelegramClient,
  fromChatId: number,
  messageId: number
) {
  const messages = await client.getMessages(fromChatId, {
    ids: messageId,
  });
  const message = messages[0];
  // console.log();
  return message;
}

async function saveMedia(client: TelegramClient, message: Api.Message) {
  // Talvez possa ser melhorado com um arquivo temporário
  // console.log(message.file);
  // console.log(message.file.title);
  // console.log(message.media);
  // const buffer = (await client.downloadMedia(message.media, {})) as Buffer;
  const downloadedFile = await client.downloadMedia(message.media, {
    outputFile: "/tmp/",
  });
  console.info("Message media was downloaded");
  // console.info(buffer);
  // const filename: string = `document-from-${message.senderId}`;
  await client.sendFile("me", {
    file: downloadedFile,
    // file: new CustomFile(filename, Buffer.byteLength(buffer), "", buffer),
    caption: message.rawText,
    formattingEntities: message.entities,
  });
  fs.unlinkSync(downloadedFile);
}

async function parseLink(string: string) {
  console.log(string);
  // privateChatLink = /^.*c\/{}/i
  const parsedLink = parseUrl(string);
  if (parsedLink.pathname.startsWith("/c/")) {
    const location = parsedLink.pathname.replace("/c/", "-100");
    const fromChat = Number(location.split("/")[0]);
    const messageId = Number(location.split("/")[1]);
    return { fromChat: fromChat, messageId: messageId };
  } else {
    const location = parsedLink.pathname.replace("/", "", 1); // Replace the first ocorrency
    console.log(location);
    const fromChat = location.split("/")[0];
    const messageId = Number(location.split("/")[1]);
    return { fromChat: fromChat, messageId: messageId };
  }
}

async function mediaDownloader(event: NewMessageEvent) {
  const downloadMediaCommand =
    /(\.|\!)?(hmm|eita|baixando|carregando|download)/i; // Download media from reply
  const parseLinkCommand = /((\.|\!)?(collect|save))/i; // Download media from link
  const message = event.message;
  if (
    event.isPrivate &&
    event.message.media &&
    event.message.media["ttlSeconds"]
  ) {
    console.info("Event triggered: New expirable media arrived");
    await saveMedia(event.client, event.message);
  } else if (
    message.replyTo &&
    message.out &&
    message.rawText.match(downloadMediaCommand)
  ) {
    console.info("Event triggered: Media manual download");
    const downloadableMessage = await getMessage(
      event.client,
      message.chatId.valueOf(),
      message.replyToMsgId.valueOf()
    );
    if (downloadableMessage.media) {
      await saveMedia(event.client, downloadableMessage);
      await message.delete(); // Delete the command after
    } else {
      console.error("There is no media to download on that message");
    }
  } else if (message.rawText.match(parseLinkCommand)) {
    console.log("Message from link");
    const link = message.rawText.split(" ", 2)[1];
    const parsedLink = await parseLink(link);
    console.log(parsedLink);
    const fromChat = parsedLink["fromChat"];
    const messageId = parsedLink["messageId"];
    console.log(parsedLink);
    await saveMedia(
      event.client,
      await getMessage(event.client, fromChat, messageId)
    );
  }
}

async function startTelegramClient() {
  console.log("Loading interactive example...");
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
}

(async () => {
  startTelegramClient();
})();
