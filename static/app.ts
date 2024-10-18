async function submitText(): Promise<void> {
  const userInput = (document.getElementById("userInput") as HTMLInputElement)
    .value;

  try {
    const response = await fetch("/edit-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: userInput }),
    });
    const data = await response.json();
    console.log(data);
    (
      document.getElementById(
        "telegram-profile-search-result"
      ) as HTMLParagraphElement
    ).innerHTML = data.textResult;
  } catch (error) {
    console.error("Erro:", error);
  }
}

async function submitTelegramLink(): Promise<void> {
  const linkInput = (document.getElementById("linkInput") as HTMLInputElement)
    .value;

  const response = await fetch("/search-telegram-message-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: linkInput }),
  });
    const data = await response.json();
    console.debug(data);
  (
    document.getElementById(
      "telegram-message-downloader-status"
    ) as HTMLParagraphElement
  ).innerHTML = data.textResult;

  //   console.debug(data);

  // document.getElementById('linkInput').addEventListener('keypress', async (event) => {
  //     if (event.key === 'Enter') {
  //         const link = event.target.value;
  //         const { fromChat, messageId } = await parseLink(link);

  //         document.getElementById('chatEntityInput').value = fromChat;
  //         document.getElementById('messageIdInput').value = messageId;
  //     }
  // });

  // document.getElementById('submitButton').addEventListener('click', () => {
  //     const link = document.getElementById('linkInput').value;
  //     const chatEntity = document.getElementById('chatEntityInput').value;
  //     const messageId = document.getElementById('messageIdInput').value;

  //     // Aqui você pode adicionar a lógica para enviar os dados
  //     console.log('Dados enviados:', { link, chatEntity, messageId });
  // });
}
