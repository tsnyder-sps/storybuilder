// Get all buttons
const openwebuiLaunch = document.getElementById("openwebuiCTA");
const customChatBotLaunch = document.getElementById("customChatBotCTA");

// Add event listeners to buttons

// Launch openwebui
openwebuiLaunch.addEventListener("click", () => {
  const url = "https://chat.scarboroughschools.org/";
  window.open(url, "new_window");
  console.log("Button clicked!");
});

// Launch custom chatbot
customChatBotLaunch.addEventListener("click", function () {
  window.location.href = "/chatbot.html";
  console.log("Button clicked!");
});
