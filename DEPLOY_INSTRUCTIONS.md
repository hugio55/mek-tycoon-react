# 🚀 How to Deploy Your Mek Tycoon Site Online

## Option 1: Vercel (Easiest - Free)

1. Open terminal in the `mek-tycoon-react` folder
2. Run these commands:
```bash
npx vercel login
npx vercel --prod
```
3. Follow the prompts (login with GitHub/Email)
4. Your site will be live at a URL like: `https://mek-tycoon.vercel.app`

## Option 2: Netlify (No Account Needed!)

1. Open https://app.netlify.com/drop in your browser
2. Open File Explorer to `C:\Users\Ben Meyers\Documents\Mek Tycoon\mek-tycoon-react`
3. Drag the entire `mek-tycoon-react` folder onto the Netlify Drop page
4. Wait for upload - you'll get instant URL!

## Option 3: GitHub Pages (If you have GitHub)

1. Create a new repository on GitHub
2. Run these commands:
```bash
cd mek-tycoon-react
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```
3. Go to Settings → Pages in your GitHub repo
4. Enable GitHub Pages from main branch

## Option 4: Surge.sh (Super Quick)

1. Install and deploy:
```bash
npm install -g surge
cd mek-tycoon-react
npm run build
surge .next --domain YOUR-NAME.surge.sh
```

## Important Notes:

- Your Convex database is already deployed and will work with any of these options
- The site has 4000 mek images (400MB+) so upload might take a few minutes
- For Vercel/Netlify, they'll automatically handle the Next.js deployment

## Environment Variables

Your `.env.local` file contains:
- `NEXT_PUBLIC_CONVEX_URL` - This is already set and will work in production

Choose any option above and your site will be live in minutes!