import express from "express";
import path from "path";

import { getTelegramClient } from "./static/clientManager";
import {
  getActiveUserStories,
  getMessage,
  parseLink,
  parseLinkResponse,
  saveMedia,
} from "./static/telegramMethods";
import config from "config";
// import { sleep } from "telegram/Helpers";

const app = express();
const port = 3000;

app.use(express.json());

app.use(express.static("public"));

app.use("/static", express.static(path.join(__dirname, "dist/static")));
app.use("/static/css", express.static("static/css"));

app.post("/edit-text", async (request, response) => {
  const { username } = request.body; // Obter o token da requisição
  const client = await getTelegramClient();
  try {
    const entity = await client.getEntity(username);
    const entityTelegramId = entity.id;
    response.json({
      textResult: `Telegram ${username} ID is <strong>${entityTelegramId}</strong>`,
    });
  } catch (error) {
    response
      .status(500)
      .json({ textResult: `Could not retrieve ${username} Telegram ID` });
  }
});

app.post("/download_media_from_url", async (request, response) => {
  const { text: telegramMessageLink } = request.body;
  console.log("Received request to download: ", telegramMessageLink)

  const client = await getTelegramClient();
  
  let parsedLink: parseLinkResponse;

  try {
    parsedLink = await parseLink(telegramMessageLink);
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ textResult: "Could not parse the provided link" });
    return;
  }

  const fromChat = parsedLink.fromChat;
  const messageId = parsedLink.messageId;
  
  await saveMedia(client, await getMessage(client, fromChat, messageId));
  response.json({
    textResult: "Message(s) from link was successfully donwnloaded",
  });
});

app.listen(port, () => {
  // (async () => {
  //   const client = await getTelegramClient();
  //   await getActiveUserStories(client, "@Candymoonofc2");
  // })();
  console.log("Connecting to telegram...")
  getTelegramClient().then(() => {
    console.log(`App listening on port ${port}`);
  }).catch(err => {
    console.log("Error connecting to telegram:", err)
  })
});
