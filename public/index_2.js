// Get all buttons
const aiChatButton = document.getElementById("aiChatOpen");
const authTestButton = document.getElementById("authtest");
const languageButton = document.getElementById("worldLanguageExplore");
const scienceButton = document.getElementById("scienceExplore");
const itutilsButton = document.getElementById("itLearnMore");

// Test autorization
const authTestFunction = async () => {
  const prompt = "What is 1 + 1?";
  try {
    const response = await fetch("/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: prompt }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    responseDiv.textContent = "Authentication to the server is successful.";
    console.log("Server responded", data.completion);
  } catch (error) {
    console.error(error);
    responseDiv.textContent = "Error authenticating.";
  }
};

authTestFunction();

// Add event listeners to buttons

// Open AI Chat window
aiChatButton.addEventListener("click", () => {
  const url = "https://chat.scarboroughschools.org/";
  window.open(url, "new_window");
  console.log("Button clicked!");
});

// World language section
languageButton.addEventListener("click", function () {
  window.location.href = "/world-language.html";
  console.log("Button clicked!");
});

// Science section
scienceButton.addEventListener("click", function () {
  window.location.href = "/science.html";
  console.log("Button clicked!");
});

// IT Utils section
itutilsButton.addEventListener("click", function () {
  window.location.href = "/it-utils.html";
  console.log("Button clicked!");
});
