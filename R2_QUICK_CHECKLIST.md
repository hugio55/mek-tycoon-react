# R2 Setup - Quick Checklist

Copy this checklist and check off items as you complete them.

## Cloudflare R2 Setup

- [ ] **Create R2 bucket**: `mek-tycoon-1`
  - Location: Automatic (Eastern North America)
  - Storage Class: Standard
- [ ] **Make bucket public**: Settings → Public Access → Enable
- [ ] **Create API token**: R2 → Manage R2 API Tokens
  - Name: `github-actions-mek-tycoon`
  - Permissions: Object Read & Write
  - Buckets: `mek-tycoon-1`
- [ ] **Copy API credentials** (save somewhere safe):
  - Access Key ID: `________________`
  - Secret Access Key: `________________`
  - Endpoint URL: `https://____________.r2.cloudflarestorage.com`
  - Public URL: `https://pub-____________.r2.dev`

## GitHub Secrets Setup

Go to GitHub.com → Repository → Settings → Secrets → Actions

- [ ] Add secret: `R2_ACCESS_KEY_ID` = (your access key)
- [ ] Add secret: `R2_SECRET_ACCESS_KEY` = (your secret key)
- [ ] Add secret: `R2_BUCKET_NAME` = `mek-tycoon-1`
- [ ] Add secret: `R2_ENDPOINT` = `https://ACCOUNT_ID.r2.cloudflarestorage.com`
- [ ] Add secret: `R2_PUBLIC_URL` = `https://pub-xxxxx.r2.dev`

## Vercel Environment Variable

Go to Vercel Dashboard → Settings → Environment Variables

- [ ] Add variable: `NEXT_PUBLIC_R2_URL`
  - Value: `https://pub-xxxxx.r2.dev` (your public URL)
  - Environments: Production, Preview, Development (all checked)

## Initial Upload

Choose ONE option:

### Option A: GitHub Action (Automatic)
- [ ] Commit and push changes
- [ ] Go to GitHub Actions tab
- [ ] Watch "Sync Public Assets to Cloudflare R2" workflow
- [ ] Wait for completion (~10-20 minutes for 895MB)

### Option B: Manual rclone (Faster)
- [ ] Install rclone
- [ ] Configure rclone with R2 credentials
- [ ] Run sync command (see R2_SETUP_GUIDE.md)
- [ ] Verify upload in R2 dashboard

## Testing

- [ ] **Test localhost**: `npm run dev:all`
  - Check DevTools Network tab
  - Media should load from `/mek-images/...` (local paths)
  - No R2 URLs should appear
- [ ] **Test GitHub Action**:
  - Add small file to `public/`
  - Commit and push
  - Check Actions tab for successful workflow run
- [ ] **Test production**:
  - Visit `https://mek.overexposed.io`
  - Open DevTools Network tab
  - Media should load from `https://pub-xxxxx.r2.dev/...`
  - Video and audio should play

## Done! 🎉

Your workflow is now:
1. Drop files in `public/` (same as always)
2. `git commit` and `git push`
3. GitHub automatically uploads to R2
4. Vercel deployments use R2 for media

**No more size limit issues!**
