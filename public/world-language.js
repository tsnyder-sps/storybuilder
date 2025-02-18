// Get all buttons
const narrativeAppLaunch = document.getElementById('narrativeCTA');
const conjugatorAppLaunch = document.getElementById('conjugatorCTA');
const grammarCheckAppLaunch = document.getElementById('grammarCheckCTA');

// Add event listeners to buttons

// Launch narrative app
narrativeAppLaunch.addEventListener('click', function() {
  window.location.href = "/narrative.html";
  console.log('Button clicked!');
});

// Launch conjugator app
conjugatorAppLaunch.addEventListener('click', function() {
  window.location.href = "/verb-tense.html";
  console.log('Button clicked!');
});

// Launch grammar check app
grammarCheckAppLaunch.addEventListener('click', function() {
  window.location.href = "/grammar-check.html";
  console.log('Button clicked!');
});