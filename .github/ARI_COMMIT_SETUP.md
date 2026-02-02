# ARI Commit Avatar Setup

This guide explains how to give ARI a profile picture that appears in GitHub commits.

## Option 1: GitHub Bot Account (Recommended)

### Step 1: Create ARI Bot Account
1. Create a new GitHub account: `ARI-Assistant` (or similar)
2. Upload your preferred avatar image to that account
3. Get the account's noreply email: `<id>+ARI-Assistant@users.noreply.github.com`

### Step 2: Update Co-Author Email
Change the Co-Author line in commits from:
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```
To:
```
Co-Authored-By: ARI <your-bot-id+ARI-Assistant@users.noreply.github.com>
```

### Step 3: Update ARI Configuration
Add to your hooks or CLAUDE.md:
```
When committing, use this Co-Author line:
Co-Authored-By: ARI <12345+ARI-Assistant@users.noreply.github.com>
```

## Option 2: Gravatar

### Step 1: Create Gravatar
1. Go to https://gravatar.com
2. Create an account with email: `ari-bot@yourdomain.com`
3. Upload your preferred avatar

### Step 2: Use in Commits
```
Co-Authored-By: ARI <ari-bot@yourdomain.com>
```

## Option 3: GitHub Machine User

GitHub supports "machine users" for automation:
1. Create a GitHub account specifically for ARI
2. Keep it minimal - just for attribution
3. Use its email in commits

## Suggested Avatar Specifications

For best results:
- **Size**: 460x460 pixels minimum
- **Format**: PNG with transparency or JPG
- **Style**: Professional, recognizable
- **Theme**: Should represent ARI's identity as an AI assistant

## Example Avatar Concepts

### Concept 1: Geometric Brain
- Neural network pattern
- Purple/blue gradient (#7c3aed to #3b82f6)
- Clean, modern look

### Concept 2: Abstract A
- Stylized letter "A"
- Integrated circuit motif
- Aurora colors (purple/green/blue)

### Concept 3: Cognitive Symbol
- Three intersecting circles (LOGOS/ETHOS/PATHOS)
- Minimalist design
- Matches ARI's cognitive architecture

## Quick Setup Script

After creating your bot account, add this to `.claude/settings.local.json`:

```json
{
  "ariCommitAuthor": {
    "name": "ARI",
    "email": "12345+ARI-Assistant@users.noreply.github.com"
  }
}
```

Then update the commit message template in hooks or CLAUDE.md.

## Verification

After setup, your commits should show:
- Your avatar for the main commit author
- ARI's avatar for the co-author

Test with:
```bash
git log --format='%an <%ae> | %cn <%ce>' -1
```
