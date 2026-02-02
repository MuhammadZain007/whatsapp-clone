# WhatsApp Clone - Setup & Implementation Guide

## 🎯 Complete Setup Instructions

### Step 1: Supabase Database Setup

Run these SQL queries in Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    status TEXT DEFAULT 'offline',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chats table
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE,
    group_id UUID,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    group_id UUID,
    message TEXT,
    file_url TEXT,
    file_type TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'sent'
);

-- Create groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    group_icon_url TEXT
);

-- Create group_members table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT DEFAULT 'member'
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for chats
CREATE POLICY "Users can view their chats" ON chats FOR SELECT USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR 
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- RLS Policies for messages
CREATE POLICY "Users can view messages" ON messages FOR SELECT USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid()
);

-- RLS Policies for groups
CREATE POLICY "Users can view their groups" ON groups FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- RLS Policies for group_members
CREATE POLICY "Users can view group members" ON group_members FOR SELECT USING (
    group_id IN (SELECT id FROM groups)
);
```

### Step 2: Update Configuration

Edit `js/config.js` with your Supabase credentials:

```javascript
const SUPABASE_URL = 'your_supabase_url';
const SUPABASE_ANON_KEY = 'your_supabase_anon_key';

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Step 3: Setup Image Storage (Optional but Recommended)

In Supabase:
1. Go to Storage section
2. Create new bucket named `chat-images`
3. Make it public (for easy sharing)
4. Set max file size to 10MB

### Step 4: Local Development

**Option A: Using Live Server (VS Code)**
```
1. Install "Live Server" extension
2. Right-click on login.html
3. Select "Open with Live Server"
4. Opens at http://localhost:5500
```

**Option B: Using Python**
```bash
cd web-app
python -m http.server 8000
# Open browser at http://localhost:8000
```

**Option C: Using Node.js**
```bash
npm install -g http-server
http-server -p 8000
```

## 🎮 How to Use the App

### 1. Create Account
- Click "Sign Up"
- Enter email and password
- Click "Sign Up" button
- Account is created in Supabase

### 2. Login
- Enter email and password
- Click "Login" button
- Redirects to chat list

### 3. Start 1-on-1 Chat
- Click message icon (💬)
- Enter recipient's email
- Click "Start Chat"
- Begin messaging

### 4. Create Group Chat
- Click group icon (👥)
- Enter group name and description
- Select members to add
- Click "Create Group"

### 5. Share Images
- Click image icon (🖼️) in message input
- Select image from device
- Optionally add caption
- Click send

## 📊 File Structure

```
web-app/
├── login.html              # Login/Register page
├── index.html              # Chat list page
├── chat.html               # Chat interface
├── css/
│   └── style.css           # All styling
├── js/
│   ├── config.js           # Supabase setup
│   ├── auth.js             # Authentication
│   ├── chat-list.js        # Chat list logic
│   ├── chat.js             # Chat messaging
│   ├── group-chat.js       # Group functionality
│   └── image-sharing.js    # Image upload
├── database-setup.sql      # SQL schema
└── package.json            # Project info
```

## 🔧 Key Functions

### Authentication (auth.js)
```javascript
handleSignup()              // Register new user
handleLogin()               // Login existing user
handleLogout()              // Logout
toggleAuthMode()            // Switch signup/login
getCurrentUser()            // Get current user info
```

### Chat Management (chat-list.js)
```javascript
loadChats()                 // Fetch all chats
displayChats()              // Render chat list
startNewChat()              // Create 1-on-1 chat
```

### Group Chats (group-chat.js)
```javascript
createGroup()               // Create new group
addGroupMember()            // Add member to group
removeGroupMember()         // Remove member
getGroupDetails()           // Get group info
sendGroupMessage()          // Send to group
```

### Image Sharing (image-sharing.js)
```javascript
uploadImage()               // Upload to Storage
sendImageMessage()          // Send image in chat
renderImageMessage()        // Display image
showImageModal()            // Expand image view
```

## 🌐 Deploy to Netlify

1. **Install CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=web-app
   ```

4. **Get URL** from deployment output

## 🐛 Troubleshooting

### "Cannot read properties of undefined (reading 'signup')"
- Check if Supabase CDN is loaded
- Verify `config.js` is loaded before `auth.js`
- Check browser console for errors

### Images not uploading
- Check file size (max 10MB)
- Verify file type (JPEG, PNG, GIF, WebP)
- Check Supabase Storage bucket exists
- Verify bucket permissions are public

### Messages not appearing in real-time
- Check internet connection
- Verify Supabase realtime is enabled
- Check RLS policies are correct
- Refresh page if needed

### Group chat not working
- Ensure users are in group members
- Check group_id is passed correctly
- Verify RLS allows group members to access

## 💡 Tips & Tricks

1. **Test Multiple Users**: Open multiple browser windows with different users
2. **Check Console**: Browser dev tools (F12) show helpful error messages
3. **Clear Cache**: Ctrl+Shift+Delete in browser to clear cache if issues occur
4. **Live Updates**: Changes appear in real-time across all open windows
5. **Responsive Design**: Works on mobile - test with phone or device emulation

## 📈 Performance Tips

1. **Limit Message History**: Load messages in batches
2. **Optimize Images**: Compress before uploading
3. **Cache Data**: Store chat list locally
4. **Lazy Loading**: Load chats on scroll

## 🔒 Security Best Practices

1. **Never share API keys** - Keep config.js private
2. **Use HTTPS** - In production
3. **RLS Enabled** - All tables have security policies
4. **Validate Input** - Check file types and sizes
5. **Sanitize Messages** - Prevent XSS attacks

## 🚀 Next Steps

1. ✅ Setup Supabase database
2. ✅ Configure API keys
3. ✅ Test locally
4. ✅ Deploy to Netlify
5. 🎯 Share with friends!

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **JavaScript MDN**: https://developer.mozilla.org/en-US/docs/Web/JavaScript

---

**Version**: 2.0.0
**Last Updated**: December 2024
**Author**: Muhammad Zain
