-- Create Groups Table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    group_icon_url TEXT
);

-- Create Group Members Table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT DEFAULT 'member' -- 'admin' or 'member'
);

-- Create unique constraint so user can't join group twice
ALTER TABLE group_members ADD CONSTRAINT unique_group_member UNIQUE(group_id, user_id);

-- Update messages table to support both individual and group chats
ALTER TABLE messages ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT check_recipient_or_group 
    CHECK ((group_id IS NOT NULL AND recipient_id IS NULL) OR (recipient_id IS NOT NULL AND group_id IS NULL));

-- Update chats table to support groups
ALTER TABLE chats ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE chats ADD CONSTRAINT check_user_or_group 
    CHECK ((group_id IS NOT NULL AND user_id_1 IS NULL AND user_id_2 IS NULL) OR 
           (user_id_1 IS NOT NULL AND user_id_2 IS NOT NULL AND group_id IS NULL));

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy for groups - users can see groups they're members of
CREATE POLICY "Users can view their groups" ON groups
    FOR SELECT USING (
        id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
        OR created_by = auth.uid()
    );

-- RLS Policy for groups - only creator can update/delete
CREATE POLICY "Only creator can update groups" ON groups
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Only creator can delete groups" ON groups
    FOR DELETE USING (created_by = auth.uid());

-- RLS Policy for groups - anyone authenticated can create
CREATE POLICY "Authenticated users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy for group_members
CREATE POLICY "Users can view group members" ON group_members
    FOR SELECT USING (
        group_id IN (SELECT id FROM groups)
    );

CREATE POLICY "Admins can manage group members" ON group_members
    FOR ALL USING (
        group_id IN (
            SELECT gm.group_id FROM group_members gm 
            WHERE gm.user_id = auth.uid() AND gm.role = 'admin'
        )
    );

-- Index for better performance
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_chats_group_id ON chats(group_id);
