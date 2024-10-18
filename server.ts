import express from "express";
import path from "path";

import { getTelegramClient } from "./static/clientManager";
import {
  getActiveUserStories,
  getMessage,
  parseLink,
  saveMedia,
} from "./static/telegramMethods";
// import { sleep } from "telegram/Helpers";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/public", express.static("public"));

app.use("/static", express.static(path.join(__dirname, "dist/static")));
app.use("/static/css", express.static("static/css"));

app.get("/", (request, response) => {
  const indexPage = path.join(__dirname, "public/index.html");
  response.sendFile(indexPage); // Serve o HTML inicial da pasta public
});

app.post("/edit-text", async (request, response) => {
  const { text: username } = request.body; // Obter o token da requisição
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

app.post("/search-telegram-message-link", async (request, response) => {
  const client = await getTelegramClient();
  const { text: telegramMessageLink } = request.body;
  let parsedLink;
  try {
    parsedLink = await parseLink(telegramMessageLink);
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ textResult: "Could not parse the provided link" });
  }
  const fromChat = parsedLink["fromChat"];
  const messageId = parsedLink["messageId"];
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
  getTelegramClient();
  console.log(`App listening on port ${port}`);
});
