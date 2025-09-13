/**
 * Real-time Chat System for Dial a Bakkie
 * Handles messaging between customers and drivers during active trips
 */

class RealtimeChat {
    constructor() {
        this.chatContainer = null;
        this.messageInput = null;
        this.messagesContainer = null;
        this.currentTripId = null;
        this.currentUserId = null;
        this.userRole = null; // 'customer' or 'driver'
        this.isOpen = false;
        this.unreadCount = 0;
        
        this.init();
    }

    init() {
        this.createChatInterface();
        this.bindEvents();
        this.loadUserData();
    }

    loadUserData() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        this.currentUserId = userData.id;
        this.userRole = userData.role;
    }

    createChatInterface() {
        // Create chat container
        const chatHTML = `
            <div id="chatContainer" class="chat-container hidden">
                <div class="chat-header">
                    <div class="chat-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span id="chatPartnerName">Driver</span>
                    </div>
                    <div class="chat-actions">
                        <button class="chat-minimize" onclick="realtimeChat.minimizeChat()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                        <button class="chat-close" onclick="realtimeChat.closeChat()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-welcome">
                        <p>Chat started. You can now communicate with your ${this.userRole === 'customer' ? 'driver' : 'customer'}.</p>
                    </div>
                </div>
                <div class="chat-input-container">
                    <div class="quick-messages">
                        <button class="quick-msg-btn" onclick="realtimeChat.sendQuickMessage('On my way!')">On my way!</button>
                        <button class="quick-msg-btn" onclick="realtimeChat.sendQuickMessage('Running 5 mins late')">5 mins late</button>
                        <button class="quick-msg-btn" onclick="realtimeChat.sendQuickMessage('I\\'m here')">I'm here</button>
                    </div>
                    <div class="chat-input-wrapper">
                        <input type="text" id="chatMessageInput" placeholder="Type a message..." maxlength="500">
                        <button id="chatSendBtn" onclick="realtimeChat.sendMessage()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22,2 15,22 11,13 2,9"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Chat Toggle Button -->
            <button id="chatToggleBtn" class="chat-toggle-btn hidden" onclick="realtimeChat.toggleChat()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="chat-unread-badge hidden" id="chatUnreadBadge">0</span>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
        
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('chatMessageInput');
        this.messagesContainer = document.getElementById('chatMessages');
        this.toggleBtn = document.getElementById('chatToggleBtn');
        this.unreadBadge = document.getElementById('chatUnreadBadge');
    }

    bindEvents() {
        // Enter key to send message
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Auto-resize input
        if (this.messageInput) {
            this.messageInput.addEventListener('input', () => {
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
            });
        }
    }

    startChat(tripId, partnerName) {
        this.currentTripId = tripId;
        this.isOpen = true;
        
        // Update partner name
        const partnerNameEl = document.getElementById('chatPartnerName');
        if (partnerNameEl) {
            partnerNameEl.textContent = partnerName || (this.userRole === 'customer' ? 'Driver' : 'Customer');
        }

        // Show chat interface
        this.toggleBtn.classList.remove('hidden');
        this.openChat();
        
        // Load existing messages
        this.loadMessages();
        
        // Start polling for new messages (in real app, use WebSocket)
        this.startMessagePolling();
    }

    openChat() {
        this.chatContainer.classList.remove('hidden');
        this.chatContainer.classList.add('open');
        this.isOpen = true;
        this.clearUnreadCount();
        this.scrollToBottom();
        this.messageInput.focus();
    }

    closeChat() {
        this.chatContainer.classList.add('hidden');
        this.chatContainer.classList.remove('open');
        this.isOpen = false;
    }

    minimizeChat() {
        this.chatContainer.classList.add('hidden');
        this.chatContainer.classList.remove('open');
        this.isOpen = false;
    }

    toggleChat() {
        if (this.isOpen) {
            this.minimizeChat();
        } else {
            this.openChat();
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.currentTripId) return;

        this.addMessage({
            id: Date.now(),
            text: message,
            sender: this.userRole,
            timestamp: new Date(),
            isOwn: true
        });

        // Clear input
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        // In real app, send to server
        this.simulateResponse(message);
        
        this.scrollToBottom();
    }

    sendQuickMessage(message) {
        this.messageInput.value = message;
        this.sendMessage();
    }

    addMessage(messageData) {
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${messageData.isOwn ? 'own' : 'other'}`;
        
        const time = new Date(messageData.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageEl.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(messageData.text)}</p>
                <span class="message-time">${time}</span>
            </div>
        `;

        this.messagesContainer.appendChild(messageEl);
        
        // Update unread count if chat is closed
        if (!this.isOpen && !messageData.isOwn) {
            this.incrementUnreadCount();
        }
        
        this.scrollToBottom();
    }

    loadMessages() {
        // Simulate loading existing messages
        const existingMessages = this.getStoredMessages();
        existingMessages.forEach(msg => this.addMessage(msg));
    }

    getStoredMessages() {
        // In real app, fetch from server
        const stored = localStorage.getItem(`chat_${this.currentTripId}`);
        return stored ? JSON.parse(stored) : [];
    }

    storeMessage(messageData) {
        const messages = this.getStoredMessages();
        messages.push(messageData);
        localStorage.setItem(`chat_${this.currentTripId}`, JSON.stringify(messages));
    }

    simulateResponse(userMessage) {
        // Simulate partner response after delay
        setTimeout(() => {
            const responses = this.getContextualResponse(userMessage);
            const response = responses[Math.floor(Math.random() * responses.length)];
            
            this.addMessage({
                id: Date.now() + 1,
                text: response,
                sender: this.userRole === 'customer' ? 'driver' : 'customer',
                timestamp: new Date(),
                isOwn: false
            });
        }, 1000 + Math.random() * 2000);
    }

    getContextualResponse(message) {
        const msg = message.toLowerCase();
        
        if (msg.includes('where') || msg.includes('location')) {
            return ['I can see you on the map', 'Just around the corner', 'About 2 minutes away'];
        }
        
        if (msg.includes('late') || msg.includes('delay')) {
            return ['No problem, thanks for letting me know', 'Understood, I\'ll wait', 'Take your time'];
        }
        
        if (msg.includes('here') || msg.includes('arrived')) {
            return ['Great! I can see you', 'Perfect, coming to you now', 'On my way to you'];
        }
        
        if (msg.includes('thank') || msg.includes('thanks')) {
            return ['You\'re welcome!', 'Happy to help!', 'No problem at all'];
        }
        
        return [
            'Got it, thanks!',
            'Understood',
            'Okay, sounds good',
            'Thanks for the update',
            'Perfect!'
        ];
    }

    startMessagePolling() {
        // In real app, use WebSocket instead of polling
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(() => {
            if (this.currentTripId) {
                // Simulate checking for new messages
                this.checkForNewMessages();
            }
        }, 3000);
    }

    checkForNewMessages() {
        // In real app, fetch from server
        // For demo, occasionally add a random message
        if (Math.random() < 0.1) { // 10% chance every 3 seconds
            const demoMessages = [
                'Traffic is light today',
                'Should be there in 5 minutes',
                'Thanks for choosing our service!',
                'Let me know if you need any help'
            ];
            
            this.addMessage({
                id: Date.now(),
                text: demoMessages[Math.floor(Math.random() * demoMessages.length)],
                sender: this.userRole === 'customer' ? 'driver' : 'customer',
                timestamp: new Date(),
                isOwn: false
            });
        }
    }

    incrementUnreadCount() {
        this.unreadCount++;
        this.updateUnreadBadge();
    }

    clearUnreadCount() {
        this.unreadCount = 0;
        this.updateUnreadBadge();
    }

    updateUnreadBadge() {
        if (this.unreadCount > 0) {
            this.unreadBadge.textContent = this.unreadCount;
            this.unreadBadge.classList.remove('hidden');
        } else {
            this.unreadBadge.classList.add('hidden');
        }
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    endChat() {
        this.currentTripId = null;
        this.isOpen = false;
        this.closeChat();
        this.toggleBtn.classList.add('hidden');
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Clear messages
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = '<div class="chat-welcome"><p>Chat ended.</p></div>';
        }
        
        this.clearUnreadCount();
    }
}

// Initialize chat system
let realtimeChat;
document.addEventListener('DOMContentLoaded', () => {
    realtimeChat = new RealtimeChat();
});