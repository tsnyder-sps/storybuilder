// Get all buttons
const gradeCamButton = document.getElementById('gradecamExplore');
const frqButton = document.getElementById('frqExplore');
const taButton = document.getElementById('taExplore');

// Add event listeners to buttons

// GradeCam section
  gradeCamButton.addEventListener('click', function() {
    window.location.href = "/gradecam.html";
    console.log('Button clicked!');
  });

// FRQ section
  frqButton.addEventListener('click', function() {
    window.location.href = "/frq.html";
    console.log('Button clicked!');
  });

  // TA(I) section
  taButton.addEventListener('click', function() {
    window.location.href = "/ta.html";
    console.log('Button clicked!');
  });