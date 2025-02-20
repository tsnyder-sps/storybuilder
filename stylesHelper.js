const userInput = document.getElementById("userInput");

function resize(){
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
    console.log("Height changed");
}

userInput.addEventListener('input', resize);