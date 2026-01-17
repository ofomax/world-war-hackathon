# Deploying to Vercel

## Prerequisites
1. A GitHub account
2. A Vercel account (sign up at https://vercel.com)

## Step-by-Step Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   cd shooter
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to Vercel:**
   - Visit https://vercel.com
   - Sign in with your GitHub account

3. **Import Project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Vercel will auto-detect it's a React app

4. **Configure Project:**
   - **Root Directory:** Set to `shooter` (if your repo root is `hackathonGame`)
   - **Framework Preset:** Create React App (auto-detected)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Environment Variables (if needed):**
   - Add any environment variables in the Vercel dashboard
   - For this project, none are required

6. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to project:**
   ```bash
   cd shooter
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - For production deployment, run: `vercel --prod`

## Important Notes

- The `vercel.json` file is already configured for React Router (SPA routing)
- All routes will redirect to `index.html` for client-side routing
- Your public assets (sounds, backgrounds) will be served from the `public` folder
- The build output will be in the `build` folder

## Troubleshooting

- **Build fails:** Check that all dependencies are in `package.json`
- **Assets not loading:** Ensure paths use `process.env.PUBLIC_URL` (already done)
- **Routing issues:** The `vercel.json` rewrites should handle this

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
