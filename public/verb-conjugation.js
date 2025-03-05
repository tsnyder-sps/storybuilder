// Function to show a page based on the passed 'pageId' argument
        function showPage(pageId) {
            // Get all pages
            const pages = document.querySelectorAll('.page');
            
            // Hide all pages
            pages.forEach(page => page.classList.remove('active'));

            // Use if statements to check which page to display
            if (pageId === 'home') {
                document.getElementById('home').classList.add('active');
            } else if (pageId === 'conjugation-help') {
                document.getElementById('conjugation-help').classList.add('active');
            } 
            
            else if (pageId === 'conjugation-practice') {
                document.getElementById('conjugation-practice').classList.add('active');
            }
        }

        const aiResponseContainer = document.getElementById('ai-response-container');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const aiResponseContainer2 = document.getElementById('ai-response-container2');
        const messageInput2 = document.getElementById('message-input2');
        const sendButton2 = document.getElementById('send-button2');
        let conversationId = null;
        let conversationId2 = null;
   
        //start of new code
        sendButton.addEventListener('click', async (event) => {
        console.log('Button clicked!');
        event.preventDefault();
        const vocab = messageInput.value;

        // Construct the prompt considering language selection and vocab words
        const fullPrompt = `Write me a full list of all the verb conjugations of the following french vocab word: ${vocab}. Do not give any additional context words, just give the conjugations of this word along with the associated pronouns. There should be no english words in this response. DO NOT GIVE ANY ENGLISH WORDS HERE.`;
        try {
            aiResponseContainer.textContent = "Generating conjugations...";
            const response = await fetch('http://localhost:3000/verb/chat/stream', {
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
            const markdown = data.completion;
            const html = marked.parse(markdown);
            aiResponseContainer.innerHTML = html;
            console.log('Server responded', html)
        } catch (error) {
            console.error(error);
            aiResponseContainer.innerHTML = 'Error generating text.';
        }


        return false;
        });
        sendButton2.addEventListener('click', async (event) => {
        console.log('Button clicked!');
        event.preventDefault();
        const vocab2 = messageInput2.value;
        const fullPrompt2 = `${vocab2}`;
        try {
            aiResponseContainer2.textContent = "Generating conjugations...";
            const response2 = await fetch('http://localhost:3000/verb/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: fullPrompt2 }),
            });


            if (!response2.ok) {
            throw new Error(`Server error: ${response2.statusText}`);
            }


            const data2 = await response2.json();
            const markdown2 = data2.completion;
            const html2 = marked.parse(markdown2);
            aiResponseContainer2.innerHTML = html2;
            console.log('Server responded', html2)
        } catch (error) {
            console.error(error);
            aiResponseContainer2.innerHTML = 'Error generating text.';
        }


        return false;
        });

        //end of new code

        // Load or create conversation ID to persist over page reloads
        async function initializeConversation() {
            conversationId = sessionStorage.getItem('conversationId');
            if (!conversationId) {
                conversationId = generateConversationId();
                sessionStorage.setItem('conversationId', conversationId);
            }
            // Load existing messages
            await loadConversation();
        }
        async function initializeConversation2() {
            //potential error thing below with conversationId2 from sessionStorage
            conversationId2 = sessionStorage.getItem('conversationId2');
            if (!conversationId2) {
                conversationId2 = generateConversationId2();
                sessionStorage.setItem('conversationId2', conversationId2);
            }
            // Load existing messages
            await loadConversation2();
        }

        function generateConversationId() {
            return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        function generateConversationId2() {
            return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        async function loadConversation() {
            try {
                const response = await fetch(`/conversation/${conversationId}`);
                const messages = await response.json();
                aiResponseContainer.innerHTML = ''; // Clear existing messages
                messages.forEach(msg => {
                    addMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
                });
            } catch (error) {
                console.error('Error loading conversation:', error);
            }
        }
        async function loadConversation2() {
            try {
                const response2 = await fetch(`/conversation/${conversationId2}`);
                const messages2 = await response2.json();
                aiResponseContainer2.innerHTML = ''; // Clear existing messages
                messages2.forEach(msg => {
                    addMessage2(msg.content, msg.role === 'user' ? 'user' : 'ai');
                });
            } catch (error) {
                console.error('Error loading conversation:', error);
            }
        }

        async function clearChat() {
            try {
                await fetch(`/conversation/${conversationId}`, {
                    method: 'DELETE'
                });
                conversationId = generateConversationId();
                sessionStorage.setItem('conversationId', conversationId);
                aiResponseContainer.innerHTML = '';
            } catch (error) {
                console.error('Error clearing chat:', error);
            }
        }
        async function clearChat2() {
            try {
                await fetch(`/conversation/${conversationId2}`, {
                    method: 'DELETE'
                });
                conversationId2 = generateConversationId2();
                sessionStorage.setItem('conversationId2', conversationId2);
                aiResponseContainer2.innerHTML = '';
            } catch (error) {
                console.error('Error clearing chat:', error);
            }
        }
        
        //Beginning of second code involving response

        async function sendMessage() {
            const message = messageInput.value.trim();

            //start of new code
            const fullPrompt = `Write me a full list of all the verb conjugations of the following french vocab word: ${message}. Do not give any additional context words, just give the conjugations of this word along with the associated pronouns. There should be no english words in this response. DO NOT GIVE ANY ENGLISH WORDS HERE.`;
            //end of new code

            if (!message) return;

            // Disable input and button while processing
            messageInput.disabled = true;
            sendButton.disabled = true;

            // Add user message to chat

            //changed message to fullPrompt
            addMessage(message, 'user');
            messageInput.value = '';

            try {
                // Create a new message div for AI response with streaming cursor
                const aiMessageDiv = document.createElement('div');
                aiMessageDiv.className = 'message ai-message';
                const cursor = document.createElement('span');
                cursor.className = 'cursor';
                aiMessageDiv.appendChild(cursor);
                aiResponseContainer.appendChild(aiMessageDiv);
                aiResponseContainer.scrollTop = aiResponseContainer.scrollHeight;

                // Set up server sent event connection
                const eventSource = new EventSource(
                    //changed message to fullPrompt
                    `/chat/stream?message=${encodeURIComponent(fullPrompt)}&conversationId=${conversationId}`
                );
                let fullResponse = '';

                eventSource.onmessage = (event) => {
                    if (event.data === '[DONE]') {
                        eventSource.close();
                        cursor.remove();
                    } else {
                        const chunk = event.data;
                        fullResponse += chunk;
                        aiMessageDiv.textContent = fullResponse;
                        aiMessageDiv.appendChild(cursor);
                        aiResponseContainer.scrollTop = aiResponseContainer.scrollHeight;
                    }
                };

                eventSource.onerror = (error) => {
                    console.error('SSE Error:', error);
                    eventSource.close();
                    cursor.remove();
                    if (!fullResponse) {
                        aiMessageDiv.textContent = 'Sorry, there was an error processing your request.';
                    }
                };
            } catch (error) {
                console.error('Error:', error);
                addMessage('Sorry, there was an error processing your request.', 'ai');
            }

            // Re-enable input and button
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }
        async function sendMessage2() {
            const message2 = messageInput2.value.trim();

            //start of new code
            const fullPrompt2 = `${message2}`;
            //end of new code

            if (!message2) return;

            // Disable input and button while processing
            messageInput2.disabled = true;
            sendButton2.disabled = true;

            // Add user message to chat

            //changed message to fullPrompt
            addMessage2(message2, 'user');
            messageInput2.value = '';

            try {
                // Create a new message div for AI response with streaming cursor
                const aiMessageDiv2 = document.createElement('div');
                aiMessageDiv2.className = 'message ai-message';
                const cursor2 = document.createElement('span');
                cursor2.className = 'cursor';
                aiMessageDiv2.appendChild(cursor2);
                aiResponseContainer2.appendChild(aiMessageDiv2);
                aiResponseContainer2.scrollTop = aiResponseContainer2.scrollHeight;

                // Set up server sent event connection
                const eventSource2 = new EventSource(
                    //changed message to fullPrompt
                    `/chat/stream?message=${encodeURIComponent(fullPrompt2)}&conversationId2=${conversationId2}`
                );
                let fullResponse2 = '';

                eventSource2.onmessage = (event) => {
                    if (event.data === '[DONE]') {
                        eventSource2.close();
                        cursor2.remove();
                    } else {
                        const chunk2 = event.data;
                        fullResponse2 += chunk2;
                        aiMessageDiv2.textContent = fullResponse2;
                        aiMessageDiv2.appendChild(cursor2);
                        aiResponseContainer2.scrollTop = aiResponseContainer2.scrollHeight;
                    }
                };

                eventSource2.onerror = (error) => {
                    console.error('SSE Error:', error);
                    eventSource2.close();
                    cursor2.remove();
                    if (!fullResponse2) {
                        aiMessageDiv2.textContent = 'Sorry, there was an error processing your request.';
                    }
                };
            } catch (error) {
                console.error('Error:', error);
                addMessage2('Sorry, there was an error processing your request.', 'ai');
            }

            // Re-enable input and button
            messageInput2.disabled = false;
            sendButton2.disabled = false;
            messageInput2.focus();
        }
        //End of second code involving response

        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            messageDiv.textContent = text;
            aiResponseContainer.appendChild(messageDiv);
            aiResponseContainer.scrollTop = aiResponseContainer.scrollHeight;
        }
        function addMessage2(text, sender) {
            const messageDiv2 = document.createElement('div');
            messageDiv2.className = `message ${sender}-message`;
            messageDiv2.textContent = text;
            aiResponseContainer2.appendChild(messageDiv2);
            aiResponseContainer2.scrollTop = aiResponseContainer2.scrollHeight;
        }

        // Allow sending message with Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        messageInput2.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage2();
            }
        });

        // Initialize conversation when page loads
        initializeConversation();
        initializeConversation2();