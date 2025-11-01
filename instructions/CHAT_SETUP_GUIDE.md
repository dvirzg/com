# Admin Chat with Password-Based Encryption - Setup Guide

## Overview

This is a secure, admin-only chat system with **password-based end-to-end encryption**. All admins share a single encryption password that is used to encrypt/decrypt both messages and files.

### Key Features

✅ **Password-based encryption** - All admins use the same password
✅ **Messages encrypted** - Text messages are encrypted before storing in database
✅ **Files encrypted** - Files are encrypted client-side before upload
✅ **Real-time updates** - Messages appear instantly across all admin browsers
✅ **Multiple chat rooms** - Create and manage different channels
✅ **Pinned chat** - One permanent chat that cannot be deleted

## How the Encryption Works

### Password-Based Key Derivation

1. All admins enter the same shared password
2. The password is used to derive an encryption key using **PBKDF2** with 100,000 iterations
3. This key is used for **AES-GCM 256-bit encryption**
4. Password is stored in `sessionStorage` (cleared on tab/browser close)

### Message Encryption Flow

```
User types message → Encrypt with password → Store encrypted base64 + IV in database
Other admin loads → Decrypt with same password → Display plaintext
```

### File Encryption Flow

```
User selects file → Encrypt with password → Upload to Supabase Storage → Store IV in database
Other admin downloads → Decrypt with same password → Download plaintext file
```

### What's Encrypted

- ✅ **Message text** - Stored encrypted in `chat_messages.message`
- ✅ **Files** - Stored encrypted in Supabase Storage `chat-files` bucket
- ❌ **Metadata** - File names, sizes, timestamps are NOT encrypted (needed for UI)

### What's NOT Encrypted (Visible to Supabase/Database Admin)

- File names
- File sizes
- File types
- Message timestamps
- User IDs
- Room names
- Chat room structure

## Setup Instructions

### 1. Run the Database Schema

In your Supabase SQL Editor, run the entire schema from:

```
supabase-chat-schema.sql
```

This creates:
- `chat_rooms` table
- `chat_messages` table (with `message_iv` field for encrypted messages)
- RLS policies (admin-only access)
- Indexes and triggers
- Default "General Chat" pinned room

### 2. Create Storage Bucket

In Supabase Dashboard → Storage:

1. Create a new bucket named: `chat-files`
2. Make it **Private** (not public)
3. The SQL schema includes storage policies automatically

### 3. Set Admin Users

In Supabase Dashboard → Authentication → Users:

For each admin user:
1. Click on the user
2. Go to **User Metadata**
3. Add this field:
   ```json
   {
     "is_admin": true
   }
   ```

### 4. Share the Encryption Password

**IMPORTANT:** All admins must use the **exact same password**.

Ways to share the password securely:
- Use a password manager shared vault (1Password, Bitwarden, etc.)
- Share via encrypted message (Signal, WhatsApp, etc.)
- In-person communication
- Written on paper and stored securely

**DO NOT:**
- Email the password in plaintext
- Store it in unencrypted notes
- Post it in Slack/Discord
- Commit it to git

### 5. First-Time Access

When each admin first accesses `/chat`:

1. They'll see a password entry screen
2. Enter the shared password
3. Click "Unlock Chat"
4. Password is stored in `sessionStorage` (cleared when browser closes)
5. They can now send/receive encrypted messages

### 6. Salt Management (Important!)

The first admin to enter the password will generate a **salt** that's stored in `localStorage`. This salt is **critical** for all admins to use the same password.

**Two options:**

#### Option A: Let the first admin generate the salt (Simple)
- First admin enters password → salt is generated
- Other admins on different browsers will generate their own salts
- ⚠️ **Problem:** Messages encrypted by Admin A won't decrypt for Admin B

#### Option B: Share the salt among all admins (Recommended)
- Have ONE admin enter the password first
- They share their `localStorage` salt with other admins
- Other admins manually set the same salt in their browser console:

```javascript
// Admin 1 (after entering password once):
console.log(localStorage.getItem('admin_chat_salt'))
// Copy this value

// Admin 2, 3, etc. (before entering password):
localStorage.setItem('admin_chat_salt', 'PASTE_VALUE_HERE')
// Then reload and enter password
```

**Better solution: Store salt in database**

For production, modify `src/lib/encryption.js` to:
1. Fetch salt from a Supabase table instead of localStorage
2. Generate it once and store it centrally
3. All admins use the same salt from the database

## Usage

### For Admins

1. **Access Chat:** Navigate to `/chat` or click "Chat" in navbar
2. **Enter Password:** Enter the shared encryption password (once per session)
3. **Send Messages:** Type and press Enter
4. **Share Files:** Click 📎, select file, press Send
5. **Download Files:** Click on file attachment (auto-decrypts)
6. **Create Rooms:** Click "+ New Chat"
7. **Switch Rooms:** Click room name in sidebar
8. **Delete Messages:** Hover and click "Delete"

### Security Notes

- Password is cleared when you close the browser tab
- Wrong password = messages show "Failed to decrypt"
- Files are encrypted as binary blobs (no file type info leaked)
- All encryption happens in the browser (client-side)
- Supabase never sees plaintext messages or files

## File Structure

```
src/
├── pages/
│   └── Chat.jsx                    # Main chat page + password UI
├── lib/
│   ├── encryption.js              # Password-based encryption (PBKDF2 + AES-GCM)
│   └── supabase.js
├── components/
│   ├── AppRouter.jsx              # /chat route
│   └── Navbar.jsx                 # Chat link (admin-only)

Database:
└── supabase-chat-schema.sql       # Schema with message_iv column
```

## Troubleshooting

### "Failed to decrypt" errors

**Cause:** Wrong password or mismatched salt

**Solution:**
1. Ensure all admins are using the **exact same password** (case-sensitive)
2. Ensure all admins have the **same salt** (see Salt Management above)
3. Try clearing sessionStorage and re-entering password

### Files won't decrypt

**Cause:** Different encryption key (different password or salt)

**Solution:**
- Verify password matches what was used when file was uploaded
- Check browser console for decryption errors
- Files can only be decrypted with the same password+salt combo used to encrypt them

### Can't see Chat link in navbar

**Cause:** User is not an admin

**Solution:**
- Verify user has `is_admin: true` in Supabase user metadata
- Log out and log back in to refresh auth state

### "Encryption password not set" error

**Cause:** sessionStorage was cleared

**Solution:**
- Simply re-enter the password
- This is expected behavior when browser tab closes

## Security Considerations

### What This Protects Against

✅ Supabase admins reading your messages
✅ Database breaches (messages/files are encrypted)
✅ Storage bucket access (files are encrypted blobs)
✅ Man-in-the-middle attacks (if using HTTPS)

### What This Does NOT Protect Against

❌ Compromised admin device (malware can read decrypted messages)
❌ Supabase seeing metadata (file names, sizes, timestamps)
❌ Shoulder surfing (someone looking at your screen)
❌ Admin accidentally sharing password
❌ Browser extension reading sessionStorage

### Best Practices

1. **Use a strong password:** 20+ characters, random
2. **Rotate password periodically:** Change every 6 months
3. **Don't reuse passwords:** Unique to this chat system
4. **Use HTTPS:** Always access via https://
5. **Lock your device:** When stepping away
6. **Clear password:** Close browser when done
7. **Audit access:** Remove admin role when team members leave

## Production Improvements (Optional)

For a production system, consider:

1. **Store salt in database** - All admins automatically use the same salt
2. **Key derivation in Web Worker** - Don't block UI during PBKDF2
3. **Password strength meter** - Enforce strong passwords
4. **Password change flow** - Re-encrypt all messages with new password
5. **Session timeout** - Auto-lock after inactivity
6. **Audit logs** - Track who accesses chat (encrypted separately)
7. **Multi-factor auth** - Require 2FA before entering encryption password
8. **Key backup** - Secure recovery mechanism if password is lost

## FAQ

**Q: What happens if I forget the password?**
A: All encrypted messages and files become unrecoverable. There's no "forgot password" - that's the nature of client-side encryption.

**Q: Can Supabase support read our messages?**
A: No. Messages are encrypted before being sent to Supabase. They only see encrypted base64 strings.

**Q: Can other users (non-admins) read messages?**
A: No. Row-level security policies ensure only users with `is_admin: true` can access the chat tables.

**Q: Is this end-to-end encrypted like Signal?**
A: Yes and no. It's client-side encrypted, but all admins share the same key. True E2E encryption would give each user their own key pair.

**Q: How do I add more admins?**
A: Set `is_admin: true` in their Supabase user metadata, then share the encryption password with them.

**Q: Can I use different passwords for different chat rooms?**
A: Not currently. The password is global across all rooms. You'd need to modify the code to support per-room passwords.

**Q: What if someone quits the team?**
A: Remove their admin role in Supabase. For maximum security, also change the encryption password (all admins must re-enter new password).

## Support

If you encounter issues:
1. Check browser console for detailed errors
2. Verify SQL schema ran successfully
3. Confirm `chat-files` bucket exists and is private
4. Test with a simple password first (e.g., "test123")
5. Try in an incognito window to rule out browser extensions
