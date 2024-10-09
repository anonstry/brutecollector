import * as readline from "readline";
import * as fs from "fs";
import { Api, TelegramClient } from "telegram";
// import { CustomFile } from "telegram/client/uploads";
import { NewMessage, NewMessageEvent } from "telegram/events";
import { StringSession } from "telegram/sessions";
// const { events } = require("telegram");

const config = require("config");

const apiId = config.get("TELEGRAM_API_ID");
const apiHash = config.get("TELEGRAM_API_HASH");
const stringSession = new StringSession(config.get("TELEGRAM_SESSION_STRING"));

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

async function startClient() {
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
return client;
}

async function mediaDownloader(event: NewMessageEvent) {
  const command = /(\.|\!)?(hmm|eita|baixando|carregando|download)/i;
  const message = event.message;
  if (
    event.isPrivate &&
    event.message.media &&
    event.message.media["ttlSeconds"]
  ) {
    console.info("Event triggered: New expirable media arrived");
    await saveMedia(event.client, event.message);
  } else if (message.replyTo && message.out && message.rawText.match(command)) {
    console.info("Event triggered: Media manual download");
    const downloadableMessage = await getMessage(
      event.client,
      message.chatId.valueOf(),
      message.replyToMsgId.valueOf()
    );
    if (downloadableMessage.media) {
      saveMedia(event.client, downloadableMessage);
      await message.delete(); // Delete the command after
    } else {
      console.error("There is no media to download on that message");
    }
  }
}

(async () => {
  const client = await startClient();
  client.addEventHandler(mediaDownloader, new NewMessage({}));
})();
