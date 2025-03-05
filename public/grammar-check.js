//startup defaults
document.getElementById("studentInputArea").value =
  "Enter your text here for analysis.";
document.getElementById("aiResponseArea").innerHTML =
  "The AI will underline errors in your writing here.";

//user selection vars
const aiResponseArea = document.getElementById("aiResponseArea");

////////////////////////////////analyze writing
studentInputUpload.addEventListener("click", async (event) => {
  event.preventDefault();
  //grab user inputs
  var currentLang = document.getElementById("languageSelect").value;
  var userText = document.getElementById("studentInputArea").value;

  var fullPrompt =
    "Assume the role of a high school " +
    currentLang +
    " teacher. Using only html tags, underline gramatical errors in the provided text. " +
    "Make sure to underline errors of verb conjugation, verb tense, subject-verb agreement, and adjective agreement. " +
    "After returning the underlined text, explain why each gramatical error was marked in english." +
    "Here is the attached text: " +
    userText;

  try {
    aiResponseArea.innerHTML = "Analyzing writing...";
    const response = await fetch("http://localhost:3000/writing/analzye", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: fullPrompt }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json(); //receive ai response
    const markdown = data.completion;
    const html = marked.parse(markdown); //format response
    aiResponseArea.innerHTML = html;
    console.log("Server responded", html);
  } catch (error) {
    console.error(error);
    aiResponseArea.innerHTML = "Error generating text.";
  }

  return false;
});
//////////////////////////////////end analyze writing
