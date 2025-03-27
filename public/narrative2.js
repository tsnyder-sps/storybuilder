//response storage vars
var narrativeResponse = "";
var quizResponse = "";
//startup
document.getElementById("aiResponseBackground").value = ""; //default fields to empty
document.getElementById("tense").value = "";
document.getElementById("vocab").value = "";
document.getElementById("options").value = "";
document.getElementById("paragraphCount").value = 5; //default field counts
document.getElementById("questionCount").value = 10;
document.getElementById("questionOptionCount").value = 4;
//user selection vars
var languageSelect = document.getElementById("languageSelect").value;
const generateButton = document.getElementById("generateButton");
const vocabInput = document.getElementById("vocab");
const aiResponse = document.getElementById("aiResponse");
const quizGenerationButton = document.getElementById("quizGenerateButton");
//allow user to select what info is displayed
function loadNarrative() {
  if (narrativeResponse != "") {
    //make sure narrative exists
    document.getElementById("aiResponse").innerHTML = narrativeResponse;
  } else {
    document.getElementById("aiResponse").innerHTML =
      "There is no narrative to display.<br>" +
      "Please use fill in the text fields on the left and select a language in which to generate a narrative.";
  }
}
function loadQuiz() {
  if (quizResponse != "") {
    //make sure quiz exists
    document.getElementById("aiResponse").innerHTML = quizResponse;
  } else {
    document.getElementById("aiResponse").innerHTML =
      "There is no quiz to display.<br>" +
      "Please use the buttons on the left to generate a quiz.";
  }
}
////////////////////////////////generate quiz
quizGenerationButton.addEventListener("click", async (event) => {
  event.preventDefault();
  //grab user inputs
  languageSelect = document.getElementById("languageSelect").value;
  const numQuestions = document.getElementById("questionCount").value;
  const numOptions = document.getElementById("questionOptionCount").value;
  // Construct the prompt considering user inputs about language,verbs,vocab,etc
  if (numQuestions < 1) {
    //check for invalid mandatory fields
    aiResponse.innerHTML = "The number of questions must be at least 1.";
    return;
  } else if (numOptions == "") {
    aiResponse.innerHTML =
      "The number of options per question must be at least 2.";
    return;
  } else if (narrativeResponse == "") {
    aiResponse.innerHTML =
      "You must first generate a narrative before you can generate a quiz.";
    return;
  }
  var fullPrompt = `Generate a multiple choice quiz in ${languageSelect} with ${numQuestions} questions that each have ${numOptions} answer choices that is about the following narrative: ${narrativeResponse}.`;
  fullPrompt =
    fullPrompt +
    ". Use sequential letters of the roman alphabet to denote answer options. Place the HTML tag <br> before the letter denoting each answer option. Use sequential numbers to denote the questions. Place an answer key after the quiz.";
  console.log("sent out this prompt: " + fullPrompt);

  try {
    aiResponse.innerHTML = "Generating quiz...";
    const response = await fetch("/narrative/quiz", {
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
    aiResponse.innerHTML = html;
    quizResponse = html; //store quiz
    console.log("Server responded", html);
  } catch (error) {
    console.error(error);
    aiResponse.innerHTML = "Error generating text.";
  }

  return false;
});
//////////////////////////////////end generate quiz
////////////////////////////////generate narrative
generateButton.addEventListener("click", async (event) => {
  narrativeResponse = "";
  event.preventDefault();
  //grab user inputs
  languageSelect = document.getElementById("languageSelect").value;
  const vocab = vocabInput.value;
  const tense = document.getElementById("tense").value;
  const additionalInfo = document.getElementById("options").value;
  const numParagraphs = document.getElementById("paragraphCount").value;

  // Construct the prompt considering user inputs about language,verbs,vocab,etc
  var fullPrompt = "";
  if (vocab == "") {
    //check for blank mandatory fields
    aiResponse.innerHTML = "The target vocab box cannot be blank.";
    return;
  } else if (tense == "") {
    aiResponse.innerHTML = "The target verb conjugations box cannot be blank.";
    return;
  }
  var fullPrompt = `Write me a creative narrative in ${languageSelect} that features the following vocabulary words: ${vocab}. The narrative may only use the following verb tenses: ${tense}. The narrative must be only ${numParagraphs} paragraphs long.`;
  if (additionalInfo != "") {
    //user gave extra info
    fullPrompt =
      fullPrompt +
      " Here are some additional instructions for the narrative: " +
      additionalInfo;
  }
  fullPrompt = fullPrompt + ". Return only the narrative.";
  console.log("sent out this prompt: " + fullPrompt);

  try {
    aiResponse.innerHTML = "Generating narrative...";
    const response = await fetch("/narrative/generate", {
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
    aiResponse.innerHTML = html;
    narrativeResponse = html; //store narrative
    console.log("Server responded", html);
  } catch (error) {
    console.error(error);
    aiResponse.innerHTML = "Error generating text.";
  }

  return false;
});
///////////////////////////////////end generate narrative
