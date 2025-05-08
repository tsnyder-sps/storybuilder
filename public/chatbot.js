const chatContainer = document.getElementById('response');
        const messageInput = document.getElementById('userInput');
        const sendButton = document.getElementById('submitter');
        let conversationId = null;
        
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

        function generateConversationId() {
            return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        async function loadConversation() {
            try {
                const response = await fetch(`/conversation/${conversationId}`);
                const messages = await response.json();
                chatContainer.innerHTML = ''; // Clear existing messages
                messages.forEach(msg => {
                    addMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
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
                chatContainer.innerHTML = '';
            } catch (error) {
                console.error('Error clearing chat:', error);
            }
        }
        
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            // Disable input and button while processing
            messageInput.disabled = true;
            sendButton.disabled = true;

            // Add user message to chat
            addMessage(message, 'user');
            messageInput.value = '';

            try {
                // Create a new message div for AI response with streaming cursor
                const aiMessageDiv = document.createElement('div');
                aiMessageDiv.className = 'message ai-message';
                const cursor = document.createElement('span');
                cursor.className = 'cursor';
                aiMessageDiv.appendChild(cursor);
                chatContainer.appendChild(aiMessageDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
                // Set up server sent event connection
                const eventSource = new EventSource(
                    `/chat/stream?message=${encodeURIComponent(message)}&conversationId=${conversationId}`
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
                        chatContainer.scrollTop = chatContainer.scrollHeight;
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

        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Allow sending message with Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Initialize conversation when page loads
        initializeConversation();