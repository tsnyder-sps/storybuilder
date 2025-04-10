const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const aiResponseContainer = document.getElementById("ai-response-container");
const aiResponseContainer2 = document.getElementById("ai-response-container2");
const messageInput = document.getElementById("message-input");
const messageInput2 = document.getElementById("message-input2");
const sendButton = document.getElementById("send-button");
const sendButton2 = document.getElementById("send-button2");
const currentLangSelect = document.getElementById("languageSelect");
const currentLang = currentLangSelect.value;

let conversationId = null;
let conversationId2 = null;

// Function to show a page based on the passed 'pageId' argument
function showPage(pageId) {
  // Get all pages
  const pages = document.querySelectorAll(".page");
  // Hide all pages
  pages.forEach((page) => page.classList.remove("active"));
  // Use if statements to check which page to display
  if (pageId === "conjugation-help") {
    document.getElementById("conjugation-help").classList.add("active");
  } else if (pageId === "conjugation-practice") {
    document.getElementById("conjugation-practice").classList.add("active");
  }
}

// Load or create conversation ID to persist over page reloads
async function initializeConversation() {
  conversationId = sessionStorage.getItem("conversationId");
  if (!conversationId) {
    conversationId = generateConversationId();
    sessionStorage.setItem("conversationId", conversationId);
  }
  // Load existing messages
  await loadConversation();
}

async function initializeConversation2() {
  conversationId2 = sessionStorage.getItem("conversationId2");
  if (!conversationId2) {
    conversationId2 = generateConversationId2();
    sessionStorage.setItem("conversationId2", conversationId2);
  }
  // Load existing messages
  await loadConversation2();
}

function generateConversationId() {
  return "conv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

function generateConversationId2() {
  return "conv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

async function loadConversation() {
  try {
    const response = await fetch(`/conversation/${conversationId}`);
    const messages = await response.json();
    aiResponseContainer.innerHTML = ""; // Clear existing messages
    messages.forEach((msg) => {
      addMessage(msg.content, msg.role === "user" ? "user" : "ai");
    });
  } catch (error) {
    console.error("Error loading conversation: ", error);
  }
}

async function loadConversation2() {
  try {
    const response2 = await fetch(`/conversation/${conversationId2}`);
    const messages2 = await response2.json();
    aiResponseContainer2.innerHTML = ""; // Clear existing messages
    messages2.forEach((msg) => {
      addMessage2(msg.content, msg.role === "user" ? "user" : "ai");
    });
  } catch (error) {
    console.error("Error loading conversation: ", error);
  }
}

async function clearChat() {
  try {
    await fetch(`/conversation/${conversationId}`, {
      method: "DELETE",
    });
    conversationId = generateConversationId();
    sessionStorage.setItem("conversationId", conversationId);
    aiResponseContainer.innerHTML = "";
  } catch (error) {
    console.error("Error clearing chat: ", error);
  }
}

async function clearChat2() {
  try {
    await fetch(`/conversation/${conversationId2}`, {
      method: "DELETE",
    });
    conversationId2 = generateConversationId();
    sessionStorage.setItem("conversationId2", conversationId2);
    aiResponseContainer2.innerHTML = "";
  } catch (error) {
    console.error("Error clearing chat: ", error);
  }
}

function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  messageDiv.textContent = text;
  aiResponseContainer.appendChild(messageDiv);
  aiResponseContainer.scrollTop = aiResponseContainer.scrollHeight;
}

function addMessage2(text, sender) {
  const messageDiv2 = document.createElement("div");
  messageDiv2.className = `message ${sender}-message`;
  messageDiv2.textContent = text;
  aiResponseContainer2.appendChild(messageDiv2);
  aiResponseContainer2.scrollTop = aiResponseContainer2.scrollHeight;
}

sendButton.addEventListener("click", async (event) => {
  console.log("Button clicked!");
  event.preventDefault();
  const vocab = messageInput.value.trim();
  const currentLang = currentLangSelect.value;

  // Construct the prompt
  var userPrompt = `Generate a full conjugation table for all tenses (present, past, future, conditional, subjunctive) including indicative and imperative moods for the following ${currentLang} vocab word: ${vocab}.  Return the conjugations in a table format with pronouns and corresponding verb forms.  If no conjugations are found, return 'Conjugations not found for this word.'`;

  if (!vocab) {
    addMessage("Please enter a vocabulary word.", "ai");
    return;
  }
  if (!currentLang) {
    addMessage("Please select a language.", "ai");
    return;
  }

  // Disable input and button while processing
  messageInput.disabled = true;
  sendButton.disabled = true;
  messageInput.focus(); // Keep focus on the input

  // Add user message to chat
  addMessage(`Vocab words: ${vocab}`, "user");
  messageInput.value = "";

  try {
    // Create a new message div for AI response with a streaming cursor
    aiMessageDiv = document.createElement("div");
    aiMessageDiv.className = "message ai-message";
    cursor = document.createElement("span");
    cursor.className = "cursor";
    aiMessageDiv.appendChild(cursor);
    aiResponseContainer.appendChild(aiMessageDiv);

    const eventSource = new EventSource(
      `/verb/chat/stream?message=${encodeURIComponent(
        userPrompt
      )}&converstionId=${conversationId}`
    );

    let fullResponse = "";
    let scrollNeeded = false; // Flag to track if we need to scroll down

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSource.close();
        cursor.remove();
      } else {
        // Sanitize the incoming chunk using DOMPurify
        const sanitizedChunk = DOMPurify.sanitize(event.data);
        fullResponse += marked.parse(sanitizedChunk);
        aiMessageDiv.innerHTML = fullResponse;
        aiMessageDiv.appendChild(cursor);
        scrollNeeded = true; // Set the flag
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      addMessage(
        "An error occurred while communicating with the backend.",
        "ai"
      );
      eventSource.close();
      cursor.remove();
      messageInput.disabled = false; // Re-enable input
      sendButton.disabled = false;
    };

    aiResponseContainer.addEventListener("scroll", () => {
      scrollNeeded = false; // Reset the flag on scroll
    });
  } catch (error) {
    console.error("Error initiating EventSource:", error);
    addMessage("Failed to connect to the backend.", "ai");
  } finally {
    // Ensure input is re-enabled
    messageInput.disabled = false;
    sendButton.disabled = false;
  }

  // Scroll to the bottom if needed
  if (
    scrollNeeded &&
    aiResponseContainer.scrollHeight > aiResponseContainer.clientHeight
  ) {
    aiResponseContainer.scrollTop = aiResponseContainer.scrollHeight;
  }
});

//Allow sending message with Enter key
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput2.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage2();
  }
});

// Initialize conversdation when page loads
initializeConversation();
initializeConversation2();
