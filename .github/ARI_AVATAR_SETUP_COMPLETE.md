# ARI Avatar Complete Setup Guide

**Goal**: Give ARI a profile picture that appears in GitHub commits, pull requests, and contribution graphs.

---

## Table of Contents

1. [Understanding How GitHub Avatars Work](#understanding-how-github-avatars-work)
2. [Option 1: Create a GitHub Bot Account (Recommended)](#option-1-create-a-github-bot-account-recommended)
3. [Option 2: Use Gravatar](#option-2-use-gravatar)
4. [Option 3: Use GitHub Machine User](#option-3-use-github-machine-user)
5. [Configuring ARI to Use the Avatar](#configuring-ari-to-use-the-avatar)
6. [Avatar Design Specifications](#avatar-design-specifications)
7. [Converting the SVG to PNG](#converting-the-svg-to-png)
8. [Verification and Testing](#verification-and-testing)
9. [Troubleshooting](#troubleshooting)

---

## Understanding How GitHub Avatars Work

GitHub displays avatars based on email addresses in commits. There are two types of commit attribution:

### Author vs. Committer
```
Author: The person who wrote the code
Committer: The person who applied the commit
```

### Co-Author Attribution
When you add a `Co-Authored-By` trailer to a commit message, GitHub shows that person's avatar in the commit:

```
feat: Add new feature

Detailed description here.

Co-Authored-By: ARI <ari@example.com>
```

**Critical**: The email in `Co-Authored-By` must match a GitHub account's email OR a Gravatar email.

---

## Option 1: Create a GitHub Bot Account (Recommended)

This is the cleanest solution. ARI gets her own GitHub profile with avatar.

### Step 1: Create New GitHub Account

1. **Open incognito/private browser** (to avoid cookie conflicts)
   - Chrome: `Cmd+Shift+N` / `Ctrl+Shift+N`
   - Firefox: `Cmd+Shift+P` / `Ctrl+Shift+P`
   - Safari: `Cmd+Shift+N`

2. **Go to https://github.com/signup**

3. **Enter account details**:
   - **Email**: Use a unique email. Options:
     - Create new email: `ari-assistant@gmail.com` or similar
     - Use email alias: `youremail+ari@gmail.com` (Gmail supports + aliases)
     - Use custom domain: `ari@yourdomain.com`
   - **Password**: Use a strong, unique password
   - **Username**: Choose something like:
     - `ARI-Assistant`
     - `ARI-Bot`
     - `ARI-AI`
     - `ARI-Hedrick` (if using your name)

4. **Complete verification** (solve the puzzle, verify email)

5. **Set up profile**:
   - Skip personalization questions
   - Choose free tier

### Step 2: Upload Avatar to Bot Account

1. **Go to Settings** → **Profile** (https://github.com/settings/profile)

2. **Click "Edit"** on the profile picture

3. **Upload the avatar image**:
   - Use the PNG version of the ARI avatar (see [Converting SVG to PNG](#converting-the-svg-to-png))
   - Recommended size: 460x460 pixels or larger
   - Supported formats: PNG, JPG, GIF

4. **Save changes**

### Step 3: Get the Bot Account's Noreply Email

1. **Go to Settings** → **Emails** (https://github.com/settings/emails)

2. **Find the noreply email** at the bottom:
   ```
   Your primary email address will be used for account-related notifications.

   Keep my email addresses private ☑️
   [Your GitHub-provided noreply address]
   12345678+ARI-Assistant@users.noreply.github.com
   ```

3. **Copy this email exactly**. It will be in the format:
   ```
   [user_id]+[username]@users.noreply.github.com
   ```
   Example: `12345678+ARI-Assistant@users.noreply.github.com`

### Step 4: Configure Commits to Use Bot Email

Update the Co-Author line in your commits:

**Before**:
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

**After**:
```
Co-Authored-By: ARI <12345678+ARI-Assistant@users.noreply.github.com>
```

---

## Option 2: Use Gravatar

Gravatar (Globally Recognized Avatar) works with any email address.

### Step 1: Create Gravatar Account

1. **Go to https://gravatar.com**

2. **Click "Create your Gravatar"**

3. **Sign up with an email address**:
   - Use any email you control
   - This email will be used in commits
   - Example: `ari-bot@yourdomain.com`

4. **Verify your email** (check inbox, click link)

### Step 2: Upload Avatar

1. **Log into Gravatar**

2. **Click "Add new image"**

3. **Upload the ARI avatar** (PNG format recommended)

4. **Crop if needed** (Gravatar shows square avatars)

5. **Set rating to "G"** (for general audiences)

6. **Link to your email address**

### Step 3: Wait for Propagation

- Gravatar can take up to 24 hours to propagate
- GitHub checks Gravatar by MD5 hashing the email address
- Test: Go to `https://www.gravatar.com/avatar/[MD5_OF_EMAIL]?d=404`

### Step 4: Use in Commits

```
Co-Authored-By: ARI <ari-bot@yourdomain.com>
```

---

## Option 3: Use GitHub Machine User

For organizations or more formal setups.

### Step 1: Create GitHub Account

Same as Option 1, Steps 1-4.

### Step 2: Add to Organization (Optional)

If you have a GitHub organization:

1. Go to Organization → People → Invite member
2. Add the bot account
3. Set appropriate permissions (usually "Write" for commit access)

### Step 3: Generate Personal Access Token (If Needed)

If the bot account will make commits directly:

1. Log into bot account
2. Settings → Developer settings → Personal access tokens → Fine-grained tokens
3. Generate new token with `repo` scope
4. Store securely

---

## Configuring ARI to Use the Avatar

### Update CLAUDE.md

Add to your project's `CLAUDE.md`:

```markdown
## Commit Attribution

When committing code, use this Co-Author line:

```
Co-Authored-By: ARI <12345678+ARI-Assistant@users.noreply.github.com>
```

Replace the placeholder email with your actual ARI bot account's noreply email.
```

### Update Global Claude Settings

Create or edit `~/.claude/settings.local.json`:

```json
{
  "ariCommitAuthor": {
    "name": "ARI",
    "email": "12345678+ARI-Assistant@users.noreply.github.com"
  }
}
```

### Update Git Hooks (Optional)

Create a prepare-commit-msg hook to automatically add Co-Author:

```bash
#!/bin/bash
# .git/hooks/prepare-commit-msg

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Only add if not a merge, squash, or amend
if [ "$COMMIT_SOURCE" != "merge" ] && [ "$COMMIT_SOURCE" != "squash" ]; then
    # Check if Co-Authored-By already exists
    if ! grep -q "Co-Authored-By: ARI" "$COMMIT_MSG_FILE"; then
        echo "" >> "$COMMIT_MSG_FILE"
        echo "Co-Authored-By: ARI <12345678+ARI-Assistant@users.noreply.github.com>" >> "$COMMIT_MSG_FILE"
    fi
fi
```

Make executable:
```bash
chmod +x .git/hooks/prepare-commit-msg
```

---

## Avatar Design Specifications

### Current ARI Avatar (ari-avatar.svg)

Located at: `.github/ari-avatar.svg`

**Design Elements**:
- Three interlocking circles representing LOGOS (blue), ETHOS (orange), PATHOS (green)
- Dark aurora gradient background (#1a1a2e → #16213e → #0f3460)
- Central core representing cognitive integration
- "ARI" text with subtitle "ARTIFICIAL REASONING INTELLIGENCE"
- Corner accents for visual polish

**Dimensions**: 460x460 pixels (scalable SVG)

### Design Principles

| Aspect | Specification |
|--------|---------------|
| Size | 460×460px minimum (displays at various sizes) |
| Format | PNG with transparency or JPG |
| Colors | Match ARI brand (blue/orange/green pillars) |
| Style | Professional, geometric, tech-focused |
| Clarity | Must be recognizable at 40×40px (commit view) |

### Color Palette

| Element | Hex Code | RGB |
|---------|----------|-----|
| LOGOS (Blue) | #3b82f6 | 59, 130, 246 |
| ETHOS (Orange) | #f97316 | 249, 115, 22 |
| PATHOS (Green) | #22c55e | 34, 197, 94 |
| Background Dark | #1a1a2e | 26, 26, 46 |
| Background Mid | #16213e | 22, 33, 62 |
| Background Light | #0f3460 | 15, 52, 96 |

---

## Converting the SVG to PNG

### Method 1: Using Browser

1. Open `.github/ari-avatar.svg` in Chrome/Firefox
2. Right-click → "Inspect"
3. Find the `<svg>` element
4. Right-click on it → "Capture node screenshot" (Chrome) or "Screenshot Node" (Firefox)
5. Save as PNG

### Method 2: Using Inkscape (Free)

1. Download Inkscape: https://inkscape.org/release/
2. Open the SVG file
3. File → Export PNG Image
4. Set dimensions to 460×460
5. Export

### Method 3: Using ImageMagick (Command Line)

```bash
# Install ImageMagick
brew install imagemagick  # macOS
apt install imagemagick   # Ubuntu/Debian

# Convert SVG to PNG
convert -density 300 .github/ari-avatar.svg -resize 460x460 .github/ari-avatar.png
```

### Method 4: Using Cloudconvert (Online)

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `.github/ari-avatar.svg`
3. Set output size to 460×460
4. Convert and download

### Method 5: Using rsvg-convert (Command Line)

```bash
# Install librsvg
brew install librsvg  # macOS
apt install librsvg2-bin  # Ubuntu/Debian

# Convert
rsvg-convert -w 460 -h 460 .github/ari-avatar.svg > .github/ari-avatar.png
```

### Method 6: Using Node.js (Programmatic)

```bash
npm install sharp

# Create convert.js:
const sharp = require('sharp');
sharp('.github/ari-avatar.svg')
  .resize(460, 460)
  .png()
  .toFile('.github/ari-avatar.png');
```

---

## Verification and Testing

### Step 1: Verify Email is Correct

After setting up, make a test commit:

```bash
cd ~/ARI-2

# Create test file
echo "test" > test-avatar.txt

# Commit with Co-Author
git add test-avatar.txt
git commit -m "test: Verify ARI avatar setup

This is a test commit to verify ARI's avatar appears correctly.

Co-Authored-By: ARI <12345678+ARI-Assistant@users.noreply.github.com>"

# Push to GitHub
git push origin main

# Clean up
git rm test-avatar.txt
git commit -m "chore: Remove avatar test file"
git push origin main
```

### Step 2: Check GitHub

1. Go to your repository on GitHub
2. Click on "Commits"
3. Find your test commit
4. Look for ARI's avatar next to the commit

### Step 3: Verify in Commit Details

Click on the commit to see details. You should see:
- Your avatar (as author)
- ARI's avatar (as co-author)
- Both names listed

### Step 4: Check Contribution Graph (If Using Bot Account)

If you want ARI to appear on contribution graphs:
1. The bot account must be a member of the repository
2. Commits must be attributed to the bot's verified email

---

## Troubleshooting

### Avatar Not Showing

| Problem | Solution |
|---------|----------|
| No avatar appears | Email doesn't match any GitHub/Gravatar account |
| Wrong avatar appears | Email matches different account than expected |
| Default gravatar appears | Gravatar not set up for that email |
| Delay in showing | GitHub caches avatars; wait 5-10 minutes |

### Email Verification Issues

```bash
# Verify the email format is correct
echo "Co-Authored-By: ARI <12345678+ARI-Assistant@users.noreply.github.com>"

# Common mistakes:
# - Missing angle brackets: Co-Authored-By: ARI 12345678+ARI@... (WRONG)
# - Wrong email: Co-Authored-By: ARI <wrong@email.com>
# - Typo in username: Co-Authored-By: ARI <12345678+ARl-Assistant@...> (lowercase L)
```

### Finding GitHub User ID

If you don't know the user ID for noreply email:

```bash
# Using GitHub API
curl -s https://api.github.com/users/ARI-Assistant | jq '.id'

# Or go to: https://api.github.com/users/[USERNAME]
# Look for the "id" field
```

### Gravatar Not Showing

1. Verify email is linked in Gravatar
2. Check MD5 hash:
   ```bash
   echo -n "ari@yourdomain.com" | md5
   # Go to: https://www.gravatar.com/avatar/[hash]?d=404
   # If 404, email isn't set up in Gravatar
   ```

### Commits Not Attributed

If commits show "Unknown" or no avatar:

1. Check the raw commit:
   ```bash
   git log --format=fuller -1
   ```

2. Verify the Co-Authored-By trailer is on its own line

3. Ensure there's a blank line before the trailer:
   ```
   commit message

   Co-Authored-By: ARI <email>
   ```

---

## Quick Reference

### Recommended Setup (Copy-Paste Ready)

**Step 1**: Create GitHub account `ARI-Assistant`

**Step 2**: Upload avatar from `.github/ari-avatar.svg` (convert to PNG first)

**Step 3**: Get noreply email from Settings → Emails

**Step 4**: Add to commits:
```
Co-Authored-By: ARI <[YOUR_USER_ID]+ARI-Assistant@users.noreply.github.com>
```

**Step 5**: Update CLAUDE.md with the email

**Step 6**: Make a test commit and verify on GitHub

---

## Avatar Files in This Repository

| File | Purpose |
|------|---------|
| `.github/ari-avatar.svg` | Vector source file (scalable) |
| `.github/ari-avatar.png` | Rasterized version (create using instructions above) |
| `.github/ARI_COMMIT_SETUP.md` | Original setup guide |
| `.github/ARI_AVATAR_SETUP_COMPLETE.md` | This comprehensive guide |

---

*Last updated: 2026-02-02*
