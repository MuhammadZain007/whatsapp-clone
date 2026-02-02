// Group Chat Management Functions

let currentGroupId = null;

// Fetch all groups for current user
async function fetchUserGroups() {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await window.supabase
            .from('group_members')
            .select(`
                group_id,
                groups!inner(
                    id,
                    name,
                    description,
                    group_icon_url,
                    created_by,
                    created_at
                )
            `)
            .eq('user_id', user.id);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching groups:', error);
        return [];
    }
}

// Create new group
async function createGroup(groupName, description, memberIds) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Create group
        const { data: groupData, error: groupError } = await window.supabase
            .from('groups')
            .insert([{
                name: groupName,
                description: description,
                created_by: user.id
            }])
            .select();

        if (groupError) throw groupError;
        const groupId = groupData[0].id;

        // Add creator as admin
        await window.supabase
            .from('group_members')
            .insert([{
                group_id: groupId,
                user_id: user.id,
                role: 'admin'
            }]);

        // Add other members
        const membersToAdd = memberIds.map(userId => ({
            group_id: groupId,
            user_id: userId,
            role: 'member'
        }));

        if (membersToAdd.length > 0) {
            await window.supabase
                .from('group_members')
                .insert(membersToAdd);
        }

        // Create chat entry for group
        const { data: chatData, error: chatError } = await window.supabase
            .from('chats')
            .insert([{
                group_id: groupId,
                last_message: null,
                last_message_at: new Date().toISOString()
            }])
            .select();

        if (chatError) throw chatError;

        return { success: true, groupId, chatId: chatData[0].id };
    } catch (error) {
        console.error('Error creating group:', error);
        return { success: false, error: error.message };
    }
}

// Add member to group
async function addGroupMember(groupId, userId) {
    try {
        const { error } = await window.supabase
            .from('group_members')
            .insert([{
                group_id: groupId,
                user_id: userId,
                role: 'member'
            }]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error adding member:', error);
        return { success: false, error: error.message };
    }
}

// Remove member from group
async function removeGroupMember(groupId, userId) {
    try {
        const { error } = await window.supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error removing member:', error);
        return { success: false, error: error.message };
    }
}

// Get group details with members
async function getGroupDetails(groupId) {
    try {
        const { data, error } = await window.supabase
            .from('groups')
            .select(`
                *,
                group_members(
                    id,
                    user_id,
                    role,
                    joined_at,
                    profiles!group_members(
                        id,
                        email,
                        full_name,
                        status
                    )
                )
            `)
            .eq('id', groupId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting group details:', error);
        return null;
    }
}

// Send message to group
async function sendGroupMessage(groupId, messageText) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await window.supabase
            .from('messages')
            .insert([{
                group_id: groupId,
                sender_id: user.id,
                message: messageText,
                timestamp: new Date().toISOString(),
                status: 'sent'
            }])
            .select();

        if (error) throw error;

        // Update chat's last message
        await window.supabase
            .from('chats')
            .update({
                last_message: messageText,
                last_message_at: new Date().toISOString()
            })
            .eq('group_id', groupId);

        return { success: true, message: data[0] };
    } catch (error) {
        console.error('Error sending group message:', error);
        return { success: false, error: error.message };
    }
}

// Get group messages
async function getGroupMessages(groupId, limit = 50) {
    try {
        const { data, error } = await window.supabase
            .from('messages')
            .select(`
                *,
                profiles!messages_sender_id_fkey(
                    id,
                    full_name,
                    email
                )
            `)
            .eq('group_id', groupId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data ? data.reverse() : [];
    } catch (error) {
        console.error('Error fetching group messages:', error);
        return [];
    }
}

// Subscribe to group messages in real-time
function subscribeToGroupMessages(groupId, callback) {
    const channel = window.supabase
        .channel(`group:${groupId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `group_id=eq.${groupId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return () => channel.unsubscribe();
}

// Leave group
async function leaveGroup(groupId) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await window.supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', user.id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error leaving group:', error);
        return { success: false, error: error.message };
    }
}

// Delete group (only admin/creator)
async function deleteGroup(groupId) {
    try {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Check if user is creator
        const { data: groupData } = await window.supabase
            .from('groups')
            .select('created_by')
            .eq('id', groupId)
            .single();

        if (groupData.created_by !== user.id) {
            throw new Error('Only group creator can delete group');
        }

        const { error } = await window.supabase
            .from('groups')
            .delete()
            .eq('id', groupId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting group:', error);
        return { success: false, error: error.message };
    }
}
