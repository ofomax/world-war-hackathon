# GitHub Repository Setup Guide

## Step 1: Create GitHub Repository

1. **Go to GitHub:**
   - Visit https://github.com
   - Sign in (or create an account if you don't have one)

2. **Create New Repository:**
   - Click the "+" icon in the top right
   - Select "New repository"

3. **Repository Settings:**
   - **Repository name:** `world-war-hackathon` (or any name you prefer)
   - **Description:** "World War Hackathon - Side-scrolling shooter game"
   - **Visibility:** Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

4. **Copy the Repository URL:**
   - After creating, GitHub will show you a page with commands
   - Copy the HTTPS URL (looks like: `https://github.com/YOUR_USERNAME/world-war-hackathon.git`)
   - You'll need this in the next step

## Step 2: Connect Local Repository to GitHub

After you create the repository on GitHub, come back here and we'll run these commands:

```bash
cd /Users/maxofosu/Documents/hackathonGame/shooter
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.**

## Step 3: Push Your Code

Once you've added the remote, we'll push all your code to GitHub.

---

**Ready?** 
1. First, create the repository on GitHub (Step 1)
2. Then tell me your GitHub username and repository name
3. I'll help you run the commands to push your code
