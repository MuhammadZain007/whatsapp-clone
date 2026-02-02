// Image Sharing Functions

// Create image bucket in Supabase Storage (run once)
async function createImageBucket() {
    try {
        // This should be run once to create the bucket
        const { data, error } = await window.supabase
            .storage
            .createBucket('chat-images', {
                public: true
            });
        
        if (error && error.message.includes('already exists')) {
            console.log('Bucket already exists');
            return { success: true };
        }
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error creating bucket:', error);
        return { success: false, error: error.message };
    }
}

// Upload image to Supabase Storage
async function uploadImage(file) {
    try {
        // Validate file
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
        }

        if (file.size > maxSize) {
            throw new Error('File size must be less than 10MB');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const { data: { user } } = await window.supabase.auth.getUser();
        const fileName = `${user.id}/${timestamp}-${file.name}`;

        // Upload file
        const { data, error } = await window.supabase
            .storage
            .from('chat-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: publicUrl } = window.supabase
            .storage
            .from('chat-images')
            .getPublicUrl(data.path);

        return {
            success: true,
            url: publicUrl.publicUrl,
            fileName: data.path
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        return { success: false, error: error.message };
    }
}

// Send image message to individual chat
async function sendImageMessage(recipientId, imageUrl, caption = '') {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await window.supabase
            .from('messages')
            .insert([{
                sender_id: user.id,
                recipient_id: recipientId,
                message: caption || 'Image',
                file_url: imageUrl,
                file_type: 'image',
                timestamp: new Date().toISOString(),
                status: 'sent'
            }])
            .select();

        if (error) throw error;

        // Update chat's last message
        await window.supabase
            .from('chats')
            .update({
                last_message: '📷 Image',
                last_message_at: new Date().toISOString()
            })
            .eq('user_id_1', user.id)
            .eq('user_id_2', recipientId);

        return { success: true, message: data[0] };
    } catch (error) {
        console.error('Error sending image message:', error);
        return { success: false, error: error.message };
    }
}

// Send image message to group
async function sendGroupImageMessage(groupId, imageUrl, caption = '') {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await window.supabase
            .from('messages')
            .insert([{
                group_id: groupId,
                sender_id: user.id,
                message: caption || 'Image',
                file_url: imageUrl,
                file_type: 'image',
                timestamp: new Date().toISOString(),
                status: 'sent'
            }])
            .select();

        if (error) throw error;

        // Update chat's last message
        await window.supabase
            .from('chats')
            .update({
                last_message: '📷 Image',
                last_message_at: new Date().toISOString()
            })
            .eq('group_id', groupId);

        return { success: true, message: data[0] };
    } catch (error) {
        console.error('Error sending group image message:', error);
        return { success: false, error: error.message };
    }
}

// Delete image from storage
async function deleteImage(filePath) {
    try {
        const { error } = await window.supabase
            .storage
            .from('chat-images')
            .remove([filePath]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting image:', error);
        return { success: false, error: error.message };
    }
}

// Render image message in chat
function renderImageMessage(message, isCurrentUser) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${isCurrentUser ? 'sent' : 'received'}`;

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'message-bubble';

    // Create image with caption
    const imgContainer = document.createElement('div');
    imgContainer.className = 'image-message-container';

    const img = document.createElement('img');
    img.src = message.file_url;
    img.className = 'message-image';
    img.style.maxWidth = '300px';
    img.style.borderRadius = '8px';
    img.style.cursor = 'pointer';

    // Add click to expand
    img.addEventListener('click', () => {
        showImageModal(message.file_url);
    });

    imgContainer.appendChild(img);

    if (message.message && message.message !== 'Image') {
        const caption = document.createElement('p');
        caption.textContent = message.message;
        caption.style.marginTop = '8px';
        caption.style.marginBottom = '0';
        imgContainer.appendChild(caption);
    }

    bubbleEl.appendChild(imgContainer);

    // Add timestamp
    const timeEl = document.createElement('span');
    timeEl.className = 'message-time';
    timeEl.textContent = formatTime(message.timestamp);
    bubbleEl.appendChild(timeEl);

    messageEl.appendChild(bubbleEl);
    return messageEl;
}

// Show image in modal
function showImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    `;

    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = `
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        border-radius: 8px;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        transition: all 0.3s ease;
    `;

    closeBtn.addEventListener('click', () => modal.remove());
    closeBtn.addEventListener('mouseover', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.4)';
    });
    closeBtn.addEventListener('mouseout', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    });

    imgContainer.appendChild(img);
    imgContainer.appendChild(closeBtn);
    modal.appendChild(imgContainer);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

// Add image upload UI to message input
function addImageUploadButton(containerId) {
    const container = document.getElementById(containerId);
    
    // Create file input (hidden)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.id = 'image-upload-input';

    // Create button
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'image-upload-btn';
    uploadBtn.innerHTML = '🖼️';
    uploadBtn.title = 'Send Image';
    uploadBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 8px;
        transition: transform 0.2s;
    `;

    uploadBtn.addEventListener('click', () => fileInput.click());
    uploadBtn.addEventListener('mouseover', () => {
        uploadBtn.style.transform = 'scale(1.2)';
    });
    uploadBtn.addEventListener('mouseout', () => {
        uploadBtn.style.transform = 'scale(1)';
    });

    // Handle file selection
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.style.cssText = `
            position: relative;
            display: inline-block;
            margin: 8px 0;
        `;

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.cssText = `
            max-width: 200px;
            max-height: 200px;
            border-radius: 8px;
        `;

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '✕';
        removeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 14px;
        `;
        removeBtn.addEventListener('click', () => {
            preview.remove();
            fileInput.value = '';
        });

        preview.appendChild(img);
        preview.appendChild(removeBtn);

        // Insert preview before send button
        const sendBtn = container.querySelector('.send-btn');
        if (sendBtn) {
            sendBtn.parentNode.insertBefore(preview, sendBtn);
        } else {
            container.appendChild(preview);
        }
    });

    container.appendChild(fileInput);
    container.appendChild(uploadBtn);
}
