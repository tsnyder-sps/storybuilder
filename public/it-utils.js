// Get all buttons
const docButton = document.getElementById('docApp');

// Add event listeners to buttons

// Chromebook Doctor section
  docButton.addEventListener('click', function() {
    window.location.href = "/cbdoctor.html";
    console.log('Button clicked!');
  });