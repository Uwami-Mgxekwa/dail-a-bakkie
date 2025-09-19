// Chat Module
const Chat = (function() {
    // Private variables
    let socket = null;
    let currentChatId = null;
    let isTyping = false;
    let typingTimeout = null;
    let unreadCount = 0;
    let messageQueue = [];
    let isConnected = false;

    // DOM Elements
    let chatContainer;
    let messagesContainer;
    let chatInput;
    let sendButton;
    let chatToggleBtn;
    let chatBadge;
    let typingIndicator;

    // Initialize the chat
    function init() {
        // Create chat UI if it doesn't exist
        if (!document.getElementById('chat-container')) {
            createChatUI();
        }

        // Get DOM elements
        chatContainer = document.getElementById('chat-container');
        messagesContainer = document.getElementById('chat-messages');
        chatInput = document.getElementById('chat-input');
        sendButton = document.getElementById('chat-send-btn');
        chatToggleBtn = document.getElementById('chat-toggle-btn');
        chatBadge = document.querySelector('.chat-toggle-badge');
        typingIndicator = document.getElementById('typing-indicator');

        // Add event listeners
        setupEventListeners();
        
        // Connect to WebSocket server
        connectWebSocket();
    }

    // Create chat UI elements
    function createChatUI() {
        const chatHTML = `
            <!-- Chat Toggle Button -->
            <button id="chat-toggle-btn" class="chat-toggle-btn">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="chat-toggle-badge" style="display: none;">0</span>
            </button>

            <!-- Chat Container -->
            <div id="chat-container" class="chat-container">
                <div class="chat-header">
                    <h3>Chat with Driver</h3>
                    <div class="chat-header-actions">
                        <button id="chat-minimize-btn" title="Minimize">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        <button id="chat-close-btn" title="Close">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div id="chat-messages" class="chat-messages">
                    <div id="typing-indicator" class="typing-indicator" style="display: none;">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <textarea 
                            id="chat-input" 
                            class="chat-input" 
                            placeholder="Type a message..." 
                            rows="1"
                        ></textarea>
                        <button id="chat-send-btn" class="chat-send-btn" disabled>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Append chat to body
        const chatWrapper = document.createElement('div');
        chatWrapper.id = 'chat-wrapper';
        chatWrapper.innerHTML = chatHTML;
        document.body.appendChild(chatWrapper);
    }

    // Set up event listeners
    function setupEventListeners() {
        // Toggle chat
        chatToggleBtn.addEventListener('click', toggleChat);
        
        // Send message on button click
        sendButton.addEventListener('click', sendMessage);
        
        // Send message on Enter key (but allow Shift+Enter for new line)
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
            
            // Handle typing indicator
            if (!isTyping) {
                isTyping = true;
                sendTypingStatus(true);
            }
            
            // Reset typing indicator after a delay
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                isTyping = false;
                sendTypingStatus(false);
            }, 1000);
        });
        
        // Auto-resize textarea
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            
            // Enable/disable send button based on input
            sendButton.disabled = this.value.trim() === '';
        });
        
        // Close button
        document.getElementById('chat-close-btn').addEventListener('click', closeChat);
        
        // Minimize button
        document.getElementById('chat-minimize-btn').addEventListener('click', toggleChat);
    }

    // Connect to WebSocket server
    function connectWebSocket() {
        // In a real app, you would connect to your WebSocket server here
        // For now, we'll simulate a connection
        console.log('Connecting to chat server...');
        isConnected = true;
        
        // Simulate successful connection
        setTimeout(() => {
            console.log('Connected to chat server');
            // Process any queued messages
            processMessageQueue();
        }, 500);
    }

    // Send a message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add message to UI immediately for better UX
        addMessage('outgoing', message);
        
        // In a real app, you would send this to the WebSocket server
        const messageData = {
            type: 'message',
            content: message,
            timestamp: new Date().toISOString(),
            chatId: currentChatId || 'default-chat-id',
            sender: 'user' // or 'driver' depending on the context
        };
        
        // Simulate sending message
        console.log('Sending message:', messageData);
        
        // In a real app, you would do: socket.send(JSON.stringify(messageData));
        
        // For demo purposes, simulate a response after a short delay
        if (Math.random() > 0.3) { // 70% chance of getting a response
            setTimeout(() => {
                const responses = [
                    'Got it, I\'ll be there soon!',
                    'Thanks for the update!',
                    'I\'m on my way!',
                    'Can you please provide more details?',
                    'I\'ll be there in about 10 minutes.'
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                receiveMessage('driver', randomResponse);
            }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
        }
        
        // Clear input and reset height
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendButton.disabled = true;
    }

    // Receive a message
    function receiveMessage(sender, content) {
        // If chat is not open, increment unread count
        if (!chatContainer.classList.contains('visible')) {
            incrementUnreadCount();
        }
        
        // Add message to UI
        addMessage(sender === 'user' ? 'outgoing' : 'incoming', content);
    }

    // Add a message to the chat UI
    function addMessage(type, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${content.replace(/\n/g, '<br>')}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Toggle chat visibility
    function toggleChat() {
        if (!chatContainer) return;
        
        const isVisible = chatContainer.classList.contains('visible');
        
        if (isVisible) {
            chatContainer.classList.remove('visible');
            chatContainer.style.display = 'none';
        } else {
            chatContainer.style.display = 'flex';
            chatContainer.classList.add('visible');
            // Reset unread count when chat is opened
            resetUnreadCount();
            // Focus input
            setTimeout(() => {
                if (chatInput) chatInput.focus();
            }, 100);
        }
        
        console.log('Chat toggled:', !isVisible ? 'opened' : 'closed');
    }

    // Close chat
    function closeChat() {
        if (chatContainer) {
            chatContainer.classList.remove('visible');
            chatContainer.style.display = 'none';
        }
        console.log('Chat closed');
    }

    // Update unread message count
    function incrementUnreadCount() {
        unreadCount++;
        updateUnreadBadge();
    }

    function resetUnreadCount() {
        unreadCount = 0;
        updateUnreadBadge();
    }

    function updateUnreadBadge() {
        if (unreadCount > 0) {
            chatBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            chatBadge.style.display = 'flex';
        } else {
            chatBadge.style.display = 'none';
        }
    }

    // Send typing status
    function sendTypingStatus(isTyping) {
        if (!isConnected) return;
        
        const typingData = {
            type: 'typing',
            isTyping: isTyping,
            chatId: currentChatId || 'default-chat-id'
        };
        
        // In a real app, you would send this to the WebSocket server
        console.log('Typing status:', typingData);
        // socket.send(JSON.stringify(typingData));
    }

    // Show typing indicator for the other user
    function showTypingIndicator(show) {
        typingIndicator.style.display = show ? 'flex' : 'none';
        if (show) {
            // Scroll to bottom to show typing indicator
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Process any queued messages
    function processMessageQueue() {
        while (messageQueue.length > 0) {
            const { sender, content } = messageQueue.shift();
            receiveMessage(sender, content);
        }
    }

    // Public API
    return {
        init: init,
        sendMessage: sendMessage,
        receiveMessage: receiveMessage,
        showTypingIndicator: showTypingIndicator,
        setChatId: function(chatId) {
            currentChatId = chatId;
            // In a real app, you would join the chat room here
            console.log('Joined chat room:', chatId);
        },
        // Add more public methods as needed
    };
})();

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Chat.init();
});
