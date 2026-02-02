// Chat List Functionality

let currentUser = null;
let chatsSubscription = null;

// Initialize chat list
window.addEventListener('DOMContentLoaded', async () => {
    currentUser = await getCurrentUser();
    if (!currentUser) return;
    
    loadChats();
    setupRealtimeSubscription();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    const newChatBtn = document.getElementById('newChatBtn');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
        });
    }
    
    if (newChatBtn) {
        newChatBtn.addEventListener('click', showNewChatDialog);
    }
    
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', showCreateGroupDialog);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (menuDropdown) {
            menuDropdown.classList.remove('active');
        }
    });
}

// Toggle menu dropdown (safe for inline handler)
function toggleMenuDropdown() {
    const menuDropdown = document.getElementById('menuDropdown');
    if (menuDropdown) {
        menuDropdown.classList.toggle('active');
    }
}

// Load chats
async function loadChats() {
    try {
        const { data: chats, error } = await window.supabase
            .from('chats')
            .select('*')
            .or(`user1.eq.${currentUser.id},user2.eq.${currentUser.id}`)
            .order('last_message_time', { ascending: false });
        
        if (error) throw error;
        
        displayChats(chats);
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

// Display chats
async function displayChats(chats) {
    const chatList = document.getElementById('chatList');
    
    if (!chats || chats.length === 0) {
        chatList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No conversations yet</p>
                <button class="btn-primary" onclick="showNewChatDialog()">Start New Chat</button>
            </div>
        `;
        return;
    }
    
    chatList.innerHTML = '';
    
    for (const chat of chats) {
        const otherUserId = chat.user1 === currentUser.id ? chat.user2 : chat.user1;
        
        // Get other user's profile
        const { data: profile } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();
        
        const chatItem = createChatItem(chat, profile);
        chatList.appendChild(chatItem);
    }
}

// Create chat item element
function createChatItem(chat, profile) {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.onclick = () => openChat(chat.id, profile);
    
    const time = formatTime(chat.last_message_time);
    const profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=075e54&color=fff`;
    
    div.innerHTML = `
        <img src="${profilePic}" alt="${profile.full_name}">
        <div class="chat-item-content">
            <div class="chat-item-header">
                <span class="chat-item-name">${profile.full_name}</span>
                <span class="chat-item-time">${time}</span>
            </div>
            <div class="chat-item-message">${chat.last_message || 'No messages yet'}</div>
        </div>
    `;
    
    return div;
}

// Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // If today, show time
    if (diff < 86400000) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    // If yesterday
    if (diff < 172800000) {
        return 'Yesterday';
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Open chat
function openChat(chatId, profile) {
    localStorage.setItem('currentChatId', chatId);
    localStorage.setItem('currentChatUser', JSON.stringify(profile));
    window.location.href = 'chat.html';
}

// Show new chat dialog
function showNewChatDialog() {
    const modal = document.getElementById('newChatModal');
    modal.classList.add('active');
}

// Close new chat dialog
function closeNewChatDialog() {
    const modal = document.getElementById('newChatModal');
    modal.classList.remove('active');
    document.getElementById('recipientEmail').value = '';
    document.getElementById('recipientName').value = '';
}

// Start new chat
async function startNewChat() {
    const recipientEmail = document.getElementById('recipientEmail').value.trim();
    
    if (!recipientEmail) {
        alert('Please enter user email');
        return;
    }
    
    try {
        // Find user by email
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('email', recipientEmail)
            .single();
        
        if (error || !profile) {
            alert('User not found');
            return;
        }
        
        if (profile.id === currentUser.id) {
            alert('Cannot chat with yourself');
            return;
        }
        
        // Check if chat already exists
        const { data: existingChat } = await window.supabase
            .from('chats')
            .select('*')
            .or(`and(user1.eq.${currentUser.id},user2.eq.${profile.id}),and(user1.eq.${profile.id},user2.eq.${currentUser.id})`)
            .single();
        
        if (existingChat) {
            openChat(existingChat.id, profile);
            return;
        }
        
        // Create new chat
        const { data: newChat, error: chatError } = await window.supabase
            .from('chats')
            .insert([
                {
                    user1: currentUser.id,
                    user2: profile.id,
                    last_message: null,
                    last_message_time: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (chatError) throw chatError;
        
        closeNewChatDialog();
        openChat(newChat.id, profile);
        
    } catch (error) {
        console.error('Error starting chat:', error);
        alert('Failed to start chat');
    }
}

// Show create group dialog
async function showCreateGroupDialog() {
    const modal = document.getElementById('createGroupModal');
    modal.classList.add('active');
    
    // Load all users for member selection
    try {
        const { data: users } = await window.supabase
            .from('profiles')
            .select('id, full_name, email')
            .neq('id', currentUser.id);
        
        const membersList = document.getElementById('membersList');
        membersList.innerHTML = '';
        
        users.forEach(user => {
            const label = document.createElement('label');
            label.className = 'member-checkbox';
            label.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
            `;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = user.id;
            checkbox.style.marginRight = '8px';
            
            const text = document.createElement('span');
            text.textContent = `${user.full_name} (${user.email})`;
            
            label.appendChild(checkbox);
            label.appendChild(text);
            
            label.addEventListener('mouseover', () => {
                label.style.background = '#f0f0f0';
            });
            label.addEventListener('mouseout', () => {
                label.style.background = 'transparent';
            });
            
            membersList.appendChild(label);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Close create group dialog
function closeCreateGroupDialog() {
    const modal = document.getElementById('createGroupModal');
    modal.classList.remove('active');
    document.getElementById('groupName').value = '';
    document.getElementById('groupDescription').value = '';
}

// Create new group
async function createNewGroup() {
    const groupName = document.getElementById('groupName').value.trim();
    
    if (!groupName) {
        alert('Please enter group name');
        return;
    }
    
    const description = document.getElementById('groupDescription').value.trim();
    
    // Get selected members
    const checkboxes = document.querySelectorAll('.member-checkbox input[type="checkbox"]:checked');
    const memberIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (memberIds.length === 0) {
        alert('Please select at least one member');
        return;
    }
    
    try {
        const result = await createGroup(groupName, description, memberIds);
        
        if (result.success) {
            closeCreateGroupDialog();
            loadChats();
            alert('Group created successfully!');
        } else {
            alert('Failed to create group: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating group:', error);
        alert('Error creating group');
    }
}

// Handle search
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
        const message = item.querySelector('.chat-item-message').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || message.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Setup realtime subscription
function setupRealtimeSubscription() {
    chatsSubscription = window.supabase
        .channel('chats')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'chats',
                filter: `user1=eq.${currentUser.id}`
            }, 
            () => loadChats()
        )
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'chats',
                filter: `user2=eq.${currentUser.id}`
            }, 
            () => loadChats()
        )
        .subscribe();
}

// Show profile
function showProfile() {
    alert('Profile feature coming soon!');
}

// Go back
function goBack() {
    window.location.href = 'index.html';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (chatsSubscription) {
        window.supabase.removeChannel(chatsSubscription);
    }
});

