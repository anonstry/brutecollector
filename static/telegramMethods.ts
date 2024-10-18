import os from "os";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import parseUrl from "parse-url";
import { Api, TelegramClient } from "telegram";
import { NewMessageEvent } from "telegram/events";

function* range(start: number, end: number, step = 1): Generator<number> {
  if (end === undefined) [end, start] = [start, 0];
  for (let n = start; n < end; n += step) yield n;
}

function generateFileThumbnail(filePath: string) {
  // npm install --save @types/parse-filepath
  // https://github.com/DefinitelyTyped/DefinitelyTyped
  const output: string = `thumbnail-${path.parse(filePath).name}.jpg`;
  if (filePath.endsWith(".jpg")) {
    return filePath;
  }
  ffmpeg(filePath)
    .screenshots({
      timestamps: [1], // Capture a thumbnail at 1 second into the video
      filename: output,
      folder: os.tmpdir(),
    })
    .on("end", () => {
      console.log("Thumbnail generated successfully.");
    })
    .on("error", (err) => {
      console.error("Error generating thumbnail:", err);
    });

  return output;
}

async function getGallery(client: TelegramClient, albumMessage: Api.Message) {
  let messages: Api.Message[] = [];
  for await (const message of client.iterMessages(albumMessage.chatId, {
    maxId: albumMessage.id + 9,
    minId: albumMessage.id - 9,
    reverse: true
  })) {
    if (
      message.groupedId !== null
      && message.groupedId !== undefined
      && albumMessage.groupedId !== null
      && albumMessage.groupedId !== undefined
      && message.groupedId.compare(albumMessage.groupedId) === 0) {
      messages.push(message)
    }
  }
  return messages;
}

export async function getMessage(
  client: TelegramClient,
  fromChatId: number,
  messageId: number
) {
  const messages = await client.getMessages(fromChatId, {
    ids: messageId,
  });

  const firstMessage = messages[0];
  return firstMessage;
}

async function saveAlbumMedia(
  client: TelegramClient,
  messages: Api.Message[]
) {
  const downloadedFiles: string[] = [];

  let caption: string | undefined;
  let entities: Api.TypeMessageEntity[] | undefined
  for (const message of messages) {
    if (message.media == undefined) {
      continue
    }
    
    console.log(`Downloading ${message.id}`)

    const outputFilepath = await client.downloadMedia(message.media, {
      outputFile: os.tmpdir(),
    })
    
    if (typeof outputFilepath == "string" && fs.existsSync(outputFilepath)) {
      downloadedFiles.push(outputFilepath);
    } else {
      console.log("Error", outputFilepath)
      return
    }

    if (message.message) {
      caption = message.message
    }

    if (message.entities) {
      entities = message.entities
    }
  }

  console.log(`Sending: ${downloadedFiles.join(", ")}`)

  await client.sendFile("me", {
    file: downloadedFiles,
    formattingEntities: entities,
    caption
  })
  
  console.log("Sent!");
  
  // cleanup
  for (const downloadedFile of downloadedFiles) {
    if (fs.existsSync(downloadedFile)) {
      await fsPromises.rm(downloadedFile);
    }
  }
}

export async function saveMedia(client: TelegramClient, message: Api.Message) {
  if (message.media == undefined) {
    console.error(`Message ${message.id} doesn't contain any media`);
    return;
  }

  if (message.groupedId !== null) {
    const gallery = await getGallery(client, message);
    await saveAlbumMedia(client, gallery);
    return; // Depois mover isso para outro lugar
  }

  // Talvez possa ser melhorado com um arquivo temporário
  // console.log(message.file);
  // console.log(message.file.title);
  // console.log(message.media);
  // const buffer = (await client.downloadMedia(message.media, {})) as Buffer;

  console.log("Downloading...")
  const downloadedFile = await client.downloadMedia(message.media, {
    outputFile: os.tmpdir()
  });

  console.info("Message media was downloaded");
  if (typeof downloadedFile == "string" && fs.existsSync(downloadedFile)) {
    // const filename: string = `document-from-${message.senderId}`;
    await client.sendFile("me", {
      file: downloadedFile,
      // file: new CustomFile(filename, Buffer.byteLength(buffer), "", buffer),
      caption: message.rawText,
      formattingEntities: message.entities,
    });

    await fsPromises.rm(downloadedFile);
  }
}

export type parseLinkResponse =  {
  fromChat: number;
  messageId: number;
}

export async function parseLink(string: string): Promise<parseLinkResponse> {
  // privateChatLink = /^.*c\/{}/i
  // Remove singlez
  // fromChatEntity, fromTopic, messageId
  const parsedLink = parseUrl(string);
  if (parsedLink.pathname.startsWith("/c/")) {
    const location = parsedLink.pathname.replace("/c/", "-100");
    const fromChat = parseInt(location.split("/")[0]);
    const messageId = parseInt(location.split("/")[1]);
    return { fromChat: fromChat, messageId: messageId };
  } else {
    const location = parsedLink.pathname.replace("/", ""); // Replace the first ocorrency
    const fromChat = parseInt(location.split("/")[0]);
    const messageId = parseInt(location.split("/")[1]);
    return { fromChat: fromChat, messageId: messageId };
  }
}

export async function mediaDownloader(event: NewMessageEvent) {
  if (event.client == undefined) {
    return
  }

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
    const chatId = message.chatId;
    const replyToMsgId = message.replyToMsgId;

    if (chatId == undefined || replyToMsgId == undefined) {
      return;
    }

    const downloadableMessage = await getMessage(
      event.client,
      chatId.valueOf(),
      replyToMsgId.valueOf()
    );

    if (downloadableMessage.media) {
      await saveMedia(event.client, downloadableMessage);
    } else {
      console.error("There is no media to download on that message");
    }

    await message.delete({ revoke: true });
    // } else if (message.out && message.rawText.match(parseLinkCommand)) {
    //   console.log("Message from link");
    // const link = message.rawText.split(" ", 2)[1];
    // const parsedLink = await parseLink(link);
    // const fromChat = parsedLink["fromChat"];
    // const messageId = parsedLink["messageId"];
    // await saveMedia(
    //   event.client,
    //   await getMessage(event.client, fromChat, messageId)
    // );
    // await message.delete({ revoke: true });
  }
}

async function getUserStory(client: TelegramClient, peerId, storyId) {
  const peerStory = await client.invoke(
    new Api.stories.GetStoriesByID({ peer: peerId, id: [storyId] })
  );
  console.log(peerStory);
}

export async function getActiveUserStories(client: TelegramClient, userEntity) {
  const peer = await client.getEntity(userEntity);
  const peerId = peer.id.valueOf();
  const activeStoriesSearchResult = await client.invoke(
    new Api.stories.GetPeerStories({ peer: peerId })
  );
  const activeStories = activeStoriesSearchResult.stories;
  for (const story of activeStories.stories) {
    // await getUserStory(client, peerId, story["id"]);
    const downloadedStoryFile = await client.downloadMedia(story["media"], {
      outputFile: os.tmpdir(),
    });
    
    if (typeof downloadedStoryFile == "string" && fs.existsSync(downloadedStoryFile)) {
      await client.sendFile("me", {
        file: downloadedStoryFile,
        caption: story["caption"],
      });
    }
  }
}
