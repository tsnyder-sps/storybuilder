const form = document.getElementById('cbdoctorform');
const aiResponse = document.getElementById('airesponse');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formDataImage = new FormData(form);
  try {
    aiResponse.textContent = "Analyzing images..."; 

    const response = await fetch('http://localhost:3000/chromebook-doctor', {
      method: 'POST',
      body: formDataImage,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error (${response.status}): ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const markdown = data.completion;

    const html = marked.parse(markdown);

    aiResponse.innerHTML = html;
    console.log('Server responded ', html);

  } catch (error) {
    console.error(error);
    aiResponse.innerHTML = `Error: ${error.message}`;
  }

});