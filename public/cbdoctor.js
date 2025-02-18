const form = document.getElementById('cbdoctorform');
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const formDataImage = new FormData(form);
  fetch('/chromebook-doctor', {
    method: 'POST',
    body: formDataImage,
  })
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));
});