import * as fs from "fs";
import * as os from "os";

import { Api, TelegramClient } from "telegram";
import { NewMessageEvent } from "telegram/events";
import { CustomFile } from "telegram/client/uploads";
import { generateRandomBigInt } from "telegram/Helpers";
import { Stats, statSync } from "node:fs";

import mime from "mime-types";
import path from "path";
// import parseUrl from "parse-url";
import ffmpeg from "fluent-ffmpeg";
import { getAttributes } from "telegram/Utils";

const parseUrl = require("parse-url");

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
  const messages = await client.getMessages(albumMessage.chatId, {
    ids: Array.from(range(albumMessage.id - 10, albumMessage.id + 10)),
  });
  const filteredMessages = messages.filter(
    (message) =>
      message &&
      message.media &&
      message.groupedId &&
      message.groupedId.valueOf() == albumMessage.groupedId.valueOf()
  );
  return filteredMessages;
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
  // console.log();
  return firstMessage;
}

async function saveAlbumMedia(
  client: TelegramClient,
  messages: Array<Api.Message>
) {
  const media = [];
  const downloadedFiles = [];
  for (const message of messages) {
    const downloadedFile = (await client.downloadMedia(message.media, {
      outputFile: os.tmpdir(),
    })) as string;
    downloadedFiles.push(downloadedFile);
    //   const uploadedDonwloadedFile = await client.uploadFile({
    //     file: new CustomFile(
    //       path.parse(downloadedFile).name,
    //       statSync(downloadedFile).size,
    //       downloadedFile
    //     ),
    //     workers: 4,
    //   });
    //   const inputMediaUploadedDocument: Api.TypeInputMedia =
    //     new Api.InputMediaUploadedDocument({
    //       file: uploadedDonwloadedFile,
    //       mimeType: mime.lookup(path.parse(downloadedFile).ext),
    //       attributes: []
    //     });
    //   const inputSingleMedia = new Api.InputSingleMedia({
    //     media: inputMediaUploadedDocument,
    //     message: message.message || "",
    //     randomId: generateRandomBigInt(),
    //   });
    //   // console.log(inputSingleMedia.media); // True
    //   media.push(inputSingleMedia); //
    // }
    // await client.sendFile("me", { file: media });
    // await client.invoke(
    //   new Api.messages.SendMultiMedia({
    //     // silent: true,
    //     // background: true,
    //     // clearDraft: true,
    //     peer: "me",
    //     multiMedia: media,
    //   })
    // );

    // const uploadedDonwloadedFile = await client.uploadFile({
    //   file: new CustomFile(
    //     path.parse(firstDownloadedFile).name,
    //     statSync(firstDownloadedFile).size,
    //     firstDownloadedFile
    //   ),
    //   workers: 1,
    // });
    // const inputMediaUploadedDocument: Api.TypeInputMedia = new Api.InputMediaUploadedDocument({
    //   file: uploadedDonwloadedFile,
    //   mimeType: mime.lookup(path.parse(firstDownloadedFile).ext),
    //   attributes: [],
    // });
    // console.log(inputMediaUploadedDocument);
    // const inputSingleMedia = new Api.InputSingleMedia({message: "", media: inputMediaUploadedDocument})
    // await client.invoke(new Api.messages.SendMultiMedia({
    //   silent: true,
    //   background: true,
    //   clearDraft: true,
    //   peer: "me",
    //   multiMedia: [inputSingleMedia, inputSingleMedia]
    // }))
    // const inputDocument = new Api.InputMediaDocument(2)
    // const inputFiles = new Api.InputSingleMedia()
    // Api.
    // console.log("Message album downloaded sucessfully");\|
  }
    const newMessages = client.sendFile("me", {
      file: downloadedFiles,
      // thumb: downloadedFiles.map(
      //   (downloadedFile) => generateFileThumbnail(downloadedFile) as)
      // ),
      caption: messages.map((message) => message.rawText),
      formattingEntities: messages.map((message) => message.getEntitiesText()),
    });
    try {
      await client.editMessage(newMessages[0].chatId, {
        message: newMessages[0].id,
        text: messages[0].rawText,
        formattingEntities: messages[0].entities,
      });
    } catch {
      console.debug("Message not modified");
    }
    // for (const downloadedFile of downloadedFiles) {
    //   fs.unlinkSync(downloadedFile);
    // }
    console.log("Sent!");
}

export async function saveMedia(client: TelegramClient, message: Api.Message) {
  // const downloadedGallery = saveAlbumMedia(client, [message]);
  // return; // Depois mover isso para outro lugar
  if (message.groupedId) {
    const gallery = await getGallery(client, message);
    const downloadedGallery = saveAlbumMedia(client, gallery);
    return; // Depois mover isso para outro lugar
  }
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

export async function parseLink(string: string) {
  console.log(string);
  // privateChatLink = /^.*c\/{}/i
  // Remove singlez
  // fromChatEntity, fromTopic, messageId
  const parsedLink = parseUrl(string);
  if (parsedLink.pathname.startsWith("/c/")) {
    const location = parsedLink.pathname.replace("/c/", "-100");
    const fromChat = Number(location.split("/")[0]);
    const messageId = Number(location.split("/")[1]);
    return { fromChat: fromChat, messageId: messageId };
  } else {
    const location = parsedLink.pathname.replace("/", "", 1); // Replace the first ocorrency
    const fromChat: number | string = location.split("/")[0];
    const messageId = Number(location.split("/")[1]);
    return { fromChat: fromChat, messageId: messageId };
  }
}

export async function mediaDownloader(event: NewMessageEvent) {
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
    await client.sendFile("me", {
      file: downloadedStoryFile,
      caption: story["caption"],
    });
  }
}
