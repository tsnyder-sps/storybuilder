const generateButton = document.getElementById('generateButton');
    const responseDiv = document.getElementById('response');
    const promptTextarea = document.getElementById('prompt');
    const tenseSelect = document.getElementById('tense');

    generateButton.addEventListener('click', async () => {
      const userPrompt = promptTextarea.value;
      const selectedTense = tenseSelect.value; // Get the selected tense

       // Construct the prompt with the tense included
       const fullPrompt = `Conjugate the following in the ${selectedTense} tense in Spanish: ${userPrompt}`;
       
       try {
        const response = await fetch('http://localhost:3000/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: fullPrompt }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        responseDiv.innerHTML = data.response; // Directly set the innerHTML
      } catch (error) {
        console.error(error);
        responseDiv.textContent = 'Error generating text.';
      }
    });