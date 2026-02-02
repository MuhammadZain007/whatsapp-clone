# WhatsApp Clone - Web App 💬

Modern, real-time messaging web application similar to WhatsApp, built with vanilla JavaScript and Supabase.

## ✨ Features

- 🔐 **User Authentication** - Email/password registration and login
- 💬 **Real-time Messaging** - Send and receive messages instantly
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **WhatsApp UI** - Familiar green theme and interface
- ⚡ **Fast & Lightweight** - No heavy frameworks, pure JavaScript
- 🔔 **Live Updates** - Automatic message sync using Supabase Realtime
- 🔒 **Secure** - End-to-end encrypted (displayed in UI)

## 🚀 Quick Start

### Prerequisites

- VS Code (ya koi bhi code editor)
- Node.js installed (optional, for live-server)
- Modern web browser (Chrome, Edge, Firefox)

### 📥 Installation Steps

#### 1. Supabase Setup (FREE - Bohot Important!)

**Step 1: Create Supabase Account**
```
1. https://supabase.com pe jao
2. "Start your project" click karo
3. GitHub se sign in karo (ya email se)
4. FREE hai, credit card nahi chahiye!
```

**Step 2: Create New Project**
```
1. Dashboard mein "New Project" click karo
2. Project ka naam do: "whatsapp-clone"
3. Strong password set karo (save kar lena!)
4. Region select karo (closest to you)
5. Free plan select karo
6. "Create new project" button press karo
7. 2-3 minute wait karo (project setup ho raha hai)
```

**Step 3: Get API Keys**
```
1. Project dashboard mein jao
2. Left sidebar mein "Settings" (gear icon) click karo
3. "API" section mein jao
4. Copy karo:
   - Project URL (example: https://xxxxx.supabase.co)
   - anon/public key (bohot lamba hoga)
```

**Step 4: Create Database Tables**
```
1. Left sidebar mein "SQL Editor" click karo
2. "New query" button click karo
3. Neeche diya hua SQL copy-paste karo
4. "Run" button press karo
```

**SQL Query (Copy This):**
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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for chats
CREATE POLICY "Users can view own chats" ON chats
    FOR SELECT USING (auth.uid() = user1 OR auth.uid() = user2);

CREATE POLICY "Users can create chats" ON chats
    FOR INSERT WITH CHECK (auth.uid() = user1 OR auth.uid() = user2);

CREATE POLICY "Users can update own chats" ON chats
    FOR UPDATE USING (auth.uid() = user1 OR auth.uid() = user2);

-- Create policies for messages
CREATE POLICY "Users can view messages from their chats" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND (chats.user1 = auth.uid() OR chats.user2 = auth.uid())
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

**Step 5: Enable Realtime**
```
1. Left sidebar mein "Database" click karo
2. "Replication" tab mein jao
3. Tables list mein "chats" aur "messages" tables ko enable karo
4. Toggle buttons ON kar do
```

#### 2. Configure App

**js/config.js file mein API keys paste karo:**

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // Apna URL
const SUPABASE_ANON_KEY = 'your-anon-key-here';    // Apni anon key
```

#### 3. Install Dependencies (Optional but Recommended)

VS Code ka Terminal kholo (Ctrl + `) aur:

```bash
cd web-app
npm install
```

#### 4. Run the App

**Method 1: Using Live Server (Recommended)**
```bash
npm start
```

**Method 2: VS Code Extension**
```
1. VS Code mein "Live Server" extension install karo
2. login.html file par right-click
3. "Open with Live Server" select karo
```

**Method 3: Simple Browser**
```
1. web-app/login.html file ko browser mein kholo
2. (Realtime features kam ho sakte hain is method mein)
```

## 📱 How to Use

### 1. Register Account
- Login page pe jao
- "Sign up" click karo
- Name, email, password enter karo
- "Sign Up" button press karo

### 2. Start Chatting
- Chat list page pe jao
- "New Chat" button (➕) click karo
- Dusre user ki email enter karo
- Message type karo aur send karo! ✉️

## 📂 Project Structure

```
web-app/
├── index.html              # Chat list page
├── login.html              # Login/register page
├── chat.html               # Chat conversation page
├── css/
│   └── style.css          # All styles (WhatsApp theme)
├── js/
│   ├── config.js          # Supabase configuration
│   ├── auth.js            # Authentication logic
│   ├── chat-list.js       # Chat list functionality
│   └── chat.js            # Chat/messaging functionality
├── package.json           # Dependencies
└── README.md              # Ye file!
```

## 🎨 Features in Detail

### ✅ Authentication
- Email/password registration
- Login with existing account
- Auto-redirect if logged in
- Secure session management

### ✅ Chat List
- View all conversations
- Search chats
- See last message preview
- Real-time updates
- Start new chat with any user

### ✅ Messaging
- Send/receive messages instantly
- Real-time message sync
- Message timestamps
- Sent/received indicators
- WhatsApp-style bubbles
- Auto-scroll to latest

## 🛠️ Troubleshooting

### ❌ "Supabase is not configured"
**Solution:** `js/config.js` mein API keys paste karo

### ❌ Login nahi ho raha
**Solution:**
- Supabase dashboard check karo
- Authentication enabled hai?
- Email verification off hai?

### ❌ Messages send nahi ho rahe
**Solution:**
- Database tables sahi bane?
- SQL query properly run kiya?
- Row Level Security policies set hain?

### ❌ Real-time nahi chal raha
**Solution:**
- Replication enabled hai tables par?
- Browser console check karo (F12)
- Page refresh karo

## 🆓 Free Resources Used

- **Supabase** - Backend & Database (500MB free)
- **Font Awesome** - Icons (CDN - free)
- **UI Avatars** - Profile pictures (API - free)
- **Live Server** - Development server (free tool)

## 📝 Database Schema

### profiles
- id (UUID) - User ID
- email (TEXT) - User email
- full_name (TEXT) - Display name
- status (TEXT) - online/offline
- created_at (TIMESTAMP)

### chats
- id (UUID) - Chat ID
- user1 (UUID) - First user
- user2 (UUID) - Second user
- last_message (TEXT) - Last message preview
- last_message_time (TIMESTAMP)

### messages
- id (UUID) - Message ID
- chat_id (UUID) - Parent chat
- sender_id (UUID) - Message sender
- content (TEXT) - Message text
- created_at (TIMESTAMP)

## 🚀 Future Enhancements

- [ ] Group chats
- [ ] Image/file sharing
- [ ] Voice messages
- [ ] Video calls
- [ ] Read receipts (blue ticks)
- [ ] Typing indicators
- [ ] Message reactions (emojis)
- [ ] Dark/Light theme toggle
- [ ] Profile pictures upload
- [ ] User status messages

## 🎓 Learning Resources

- **Supabase Docs:** https://supabase.com/docs
- **JavaScript Tutorial:** https://javascript.info
- **CSS Flexbox:** https://flexbox.io
- **Real-time Subscriptions:** https://supabase.com/docs/guides/realtime

## 💡 Tips

1. **Testing:** Multiple browsers mein kholo to test karo real-time messaging
2. **Debugging:** Browser console (F12) mein errors check karo
3. **Supabase Dashboard:** Database mein data directly dekh sakte ho
4. **Live Server:** Auto-reload hota hai jab code change karo

## 🤝 Need Help?

Agar koi problem ho:
1. Browser console (F12) check karo
2. Supabase dashboard mein logs dekho
3. README.md phir se carefully padho
4. SQL query dobara run karo

## 📄 License

MIT License - Free to use and modify!

---

**🎉 Enjoy your WhatsApp Clone! Happy Chatting! 💬**
