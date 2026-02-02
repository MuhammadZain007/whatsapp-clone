// Chat Functionality

let currentUser = null;
let currentChatId = null;
let currentChatUser = null;
let messagesSubscription = null;

// Initialize chat
window.addEventListener('DOMContentLoaded', async () => {
    currentUser = await getCurrentUser();
    if (!currentUser) return;
    
    // Get chat info from localStorage
    currentChatId = localStorage.getItem('currentChatId');
    const chatUserData = localStorage.getItem('currentChatUser');
    
    if (!currentChatId || !chatUserData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentChatUser = JSON.parse(chatUserData);
    
    // Update header
    document.getElementById('chatName').textContent = currentChatUser.full_name;
    const profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentChatUser.full_name)}&background=075e54&color=fff`;
    document.getElementById('chatProfilePic').src = profilePic;
    
    loadMessages();
    setupRealtimeSubscription();
    setupMessageInput();
});

// Setup message input
function setupMessageInput() {
    const messageInput = document.getElementById('messageInput');
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Load messages
async function loadMessages() {
    try {
        const { data: messages, error } = await window.supabase
            .from('messages')
            .select('*')
            .eq('chat_id', currentChatId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        displayMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display messages
function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    
    if (!messages || messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <p>Messages are end-to-end encrypted</p>
                <small>No one outside of this chat can read them</small>
            </div>
        `;
        return;
    }
    
    messagesList.innerHTML = '';
    
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesList.appendChild(messageElement);
    });
    
    // Scroll to bottom
    scrollToBottom();
}

// Create message element
function createMessageElement(message) {
    const div = document.createElement('div');
    const isSent = message.sender_id === currentUser.id;
    
    div.className = `message ${isSent ? 'message-sent' : 'message-received'}`;
    
    const time = new Date(message.created_at).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
    
    div.innerHTML = `
        <div class="message-text">${escapeHtml(message.content)}</div>
        <div class="message-time">
            ${time}
            ${isSent ? '<i class="fas fa-check"></i>' : ''}
        </div>
    `;
    
    return div;
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    try {
        // Insert message
        const { data: message, error } = await window.supabase
            .from('messages')
            .insert([
                {
                    chat_id: currentChatId,
                    sender_id: currentUser.id,
                    content: content,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // Update chat's last message
        await window.supabase
            .from('chats')
            .update({
                last_message: content,
                last_message_time: new Date().toISOString()
            })
            .eq('id', currentChatId);
        
        // Clear input
        messageInput.value = '';
        
        // Add message to UI
        const messageElement = createMessageElement(message);
        const messagesList = document.getElementById('messagesList');
        
        // Remove empty state if exists
        const emptyState = messagesList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        messagesList.appendChild(messageElement);
        scrollToBottom();
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

// Setup realtime subscription for new messages
function setupRealtimeSubscription() {
    messagesSubscription = window.supabase
        .channel(`messages:${currentChatId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `chat_id=eq.${currentChatId}`
            }, 
            (payload) => {
                // Only add message if it's from other user (avoid duplicates)
                if (payload.new.sender_id !== currentUser.id) {
                    const messageElement = createMessageElement(payload.new);
                    const messagesList = document.getElementById('messagesList');
                    
                    // Remove empty state if exists
                    const emptyState = messagesList.querySelector('.empty-state');
                    if (emptyState) {
                        emptyState.remove();
                    }
                    
                    messagesList.appendChild(messageElement);
                    scrollToBottom();
                }
            }
        )
        .subscribe();
}

// Scroll to bottom
function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Go back to chat list
function goBack() {
    window.location.href = 'index.html';
}

// Header button actions (placeholders)
function startVideoCall() {
    alert('Video call feature coming soon!');
}

function startVoiceCall() {
    alert('Voice call feature coming soon!');
}

function showChatMenu() {
    alert('More options coming soon!');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (messagesSubscription) {
        window.supabase.removeChannel(messagesSubscription);
    }
});

