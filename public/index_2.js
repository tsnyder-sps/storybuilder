// Get all buttons
const aiChatButton = document.getElementById('aiChatOpen');
const authTestButton = document.getElementById('authtest');
const languageButton = document.getElementById('worldLanguageExplore');
const scienceButton = document.getElementById('scienceExplore');
const itutilsButton = document.getElementById('itLearnMore');

// Add event listeners to buttons

authTestButton.addEventListener('click', async() => {
  const prompt = 'What is 1 + 1?'
  try {
    const response = await fetch('http://localhost:3000/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    responseDiv.textContent = data.completion;
    console.log('Server responded', data.completion)
  } catch (error) {
    console.error(error);
    responseDiv.textContent = 'Error generating text.';
  }
});

// Open AI Chat window
aiChatButton.addEventListener('click', () => {
  const url = "https://chat.scarboroughschools.org/";
  window.open(url, "new_window");
  console.log('Button clicked!');
  });

// World language section
  languageButton.addEventListener('click', function() {
    window.location.href = "/world-language.html";
    console.log('Button clicked!');
  });

// Science section
  scienceButton.addEventListener('click', function() {
    window.location.href = "/science.html";
    console.log('Button clicked!');
  });

  // IT Utils section
  itutilsButton.addEventListener('click', function() {
    window.location.href = "/it-utils.html";
    console.log('Button clicked!');
  });