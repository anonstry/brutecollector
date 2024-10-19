async function submitText(): Promise<void> {
  const userInput = (document.getElementById("usernameInput") as HTMLInputElement).value;

  try {
    const response = await fetch("/edit-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: userInput }),
    });

    const data = await response.json();
    console.log(data);

    let element = document.getElementById("telegram-profile-search-result")
    if (element !== null) {
      element.innerHTML = data.textResult;
    }
  } catch (error) {
    console.error("Erro:", error);
  }
}

async function submitTelegramLink(): Promise<void> {
  const linkInput = (document.getElementById("linkInput") as HTMLInputElement).value;

  const response = await fetch("/download_media_from_url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: linkInput }),
  });

  const data = await response.json();
  console.debug(data);

  let element = document.getElementById("telegram-message-downloader-status")
  if (element !== null) {
    element.innerHTML = data.textResult;
  }
}
