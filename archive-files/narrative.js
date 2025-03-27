const generateButton = document.getElementById("generateButton");
const vocabInput = document.getElementById("vocab");
const languageSelectInput = document.getElementById("language-select");
const tenseInput = document.getElementById("tense");
const aiResponse = document.getElementById("airesponse");

generateButton.addEventListener("click", async (e) => {
  console.log("Button clicked!");
  e.preventDefault();

  const vocab = vocabInput.value;
  const languageSelect = languageSelectInput.value;
  const tense = tenseInput.value;

  // Construct the prompt considering language selection and vocab words
  const fullPrompt = `Write me a creative narrative in ${languageSelect} that features the following vocabulary words: ${vocab} and focusing on the following verb tenses: ${tense}`;
  try {
    aiResponse.textContent = "Generating story...";
    const response = await fetch(
      "/narrative_old/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      }
    );

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    const markdown = data.completion;
    const html = marked.parse(markdown);
    aiResponse.innerHTML = html;
    console.log("Server responded", html);
  } catch (error) {
    console.error(error);
    aiResponse.innerHTML = "Error generating text.";
  }

  return false;
});
