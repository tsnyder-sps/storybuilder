//first question: do I need all of the serverside stuff in a seperate js file?
const button = document.getElementById("submitter");

const userInput = document.getElementById("userInput");

const response = document.getElementById("response");

button.onclick = async function(){
    console.log("button is working");
    const inputValue = userInput.value;
    try{
        response.textContent = "Please wait ...";
        const aiContent = await fetch('http://localhost:3000/narrative/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputValue }),
    });

    if(!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
    }
    //Need other things here that I don't quite understand what they do
    //hello
    response.textContent = aiContent;

    }
    catch(error){
        console.error(error);
        response.textContent = "Error generating text.";
    }

    //what is the point of this?
    return false;
};