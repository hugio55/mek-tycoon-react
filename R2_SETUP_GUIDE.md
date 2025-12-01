# Cloudflare R2 Setup Guide - Mek Tycoon Media Hosting

This guide walks you through setting up Cloudflare R2 for hosting the 895MB of media files (images, videos, audio) that are currently causing Vercel deployment failures.

## What This Solves

**Problem**: Vercel has deployment size limits. Your `public/` directory is 895MB (17,532 files in mek-images alone), causing video/audio files to not appear in production.

**Solution**: Cloudflare R2 (S3-compatible storage) with GitHub Actions auto-sync. Your workflow stays the same: drop files locally, commit, push. GitHub automatically uploads changed files to R2. Production loads from R2 CDN, localhost uses local files.

## Architecture Overview

```
┌─────────────────┐
│ Your Workflow   │
│ (unchanged!)    │
└────────┬────────┘
         │ 1. Drop files in public/
         │ 2. git commit & push
         ▼
┌─────────────────┐
│ GitHub Actions  │ ← Triggers on push to custom-minting-system
│ (automatic!)    │
└────────┬────────┘
         │ Syncs changed files only
         ▼
┌─────────────────┐
│ Cloudflare R2   │ ← 895MB storage, S3-compatible
│ (public bucket) │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│ Your Code (environment-aware) │
│ • localhost → /public files   │
│ • production → R2 CDN URLs    │
└──────────────────────────────┘
```

## Step 1: Cloudflare R2 Setup

### 1.1 Create R2 Bucket

You're already at this screen. Complete these steps:

1. **Click "Create bucket"** (you're ready to do this now)
   - Bucket name: `mek-tycoon-1`
   - Location: Automatic (Eastern North America)
   - Storage Class: Standard

2. **Make bucket public**:
   - After creation, go to bucket settings
   - Navigate to "Public Access" tab
   - Enable "Allow public access"
   - Click "Save"

### 1.2 Get R2 API Credentials

1. In Cloudflare dashboard, go to **R2 → Overview**
2. Click **"Manage R2 API Tokens"**
3. Click **"Create API Token"**
4. Configure:
   - Token name: `github-actions-mek-tycoon`
   - Permissions: `Object Read & Write`
   - Specify buckets: Select `mek-tycoon-1`
   - TTL: No expiry (or set to your preference)
5. Click **"Create API Token"**
6. **IMPORTANT**: Copy these values immediately (shown only once):
   - Access Key ID: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Secret Access Key: `yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`
   - Endpoint URL: `https://ACCOUNT_ID.r2.cloudflarestorage.com`

### 1.3 Get R2 Public URL

1. In your bucket settings, find the **"Public bucket URL"**
2. It will look like: `https://pub-xxxxxxxxxxxxx.r2.dev`
3. Copy this URL (you'll need it for Vercel)

**Example URLs:**
- Bucket endpoint (for API): `https://1a2b3c4d.r2.cloudflarestorage.com`
- Public URL (for browsers): `https://pub-9876543210.r2.dev`
- Media file example: `https://pub-9876543210.r2.dev/mek-images/150px/aa1-aa4-gh1.webp`

## Step 2: GitHub Secrets Configuration

Add these secrets to your GitHub repository:

1. Go to **GitHub.com → Your Repository**
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"** for each of these:

### Required Secrets

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `R2_ACCESS_KEY_ID` | Your Access Key ID from Step 1.2 | Cloudflare R2 API token screen |
| `R2_SECRET_ACCESS_KEY` | Your Secret Access Key from Step 1.2 | Cloudflare R2 API token screen |
| `R2_BUCKET_NAME` | `mek-tycoon-1` | Your bucket name |
| `R2_ENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` | From Step 1.2 endpoint URL |
| `R2_PUBLIC_URL` | `https://pub-xxxxx.r2.dev` | From Step 1.3 public bucket URL |

**Security Note**: These are encrypted GitHub secrets. Never commit them to code or `.env` files.

## Step 3: Vercel Environment Variable

Add the R2 public URL to Vercel so production deployments use R2:

1. Go to **Vercel Dashboard → Your Project**
2. Navigate to **Settings → Environment Variables**
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_R2_URL`
   - **Value**: `https://pub-xxxxx.r2.dev` (your public URL from Step 1.3)
   - **Environments**: Check `Production`, `Preview`, and `Development`
4. Click **"Save"**

**Important**: Do NOT set this in your local `.env.local` file. It's already configured as empty (localhost uses local files).

## Step 4: Initial Upload to R2

You need to do one initial upload of your 895MB of files. Two options:

### Option A: Use GitHub Action (Recommended)

1. Commit and push the code changes (already done - you have the workflow file)
2. Go to **GitHub → Actions tab**
3. The workflow will trigger and upload everything (~10-20 minutes first time)
4. Watch progress in the Actions log

### Option B: Manual Upload via Rclone (Faster if you have bandwidth)

If you have good upload speed, this is faster than GitHub Actions:

```bash
# Install rclone (Windows)
curl https://downloads.rclone.org/rclone-current-windows-amd64.zip -o rclone.zip
unzip rclone.zip
cd rclone-*-windows-amd64

# Configure rclone
./rclone config create r2 s3 \
  provider=Cloudflare \
  access_key_id=YOUR_ACCESS_KEY_ID \
  secret_access_key=YOUR_SECRET_ACCESS_KEY \
  endpoint=https://ACCOUNT_ID.r2.cloudflarestorage.com \
  acl=public-read

# Upload public/ directory to R2
./rclone sync "C:\Users\Ben Meyers\Documents\Mek Tycoon\TYCOON REACT 8-27\mek-tycoon-react-staging\public" r2:mek-tycoon-1 \
  --progress \
  --transfers 8 \
  --exclude "*.html" \
  --exclude "CLAUDE.md" \
  --exclude "test-*.html"
```

## Step 5: Verify Everything Works

### 5.1 Test Localhost (Should Use Local Files)

```bash
npm run dev:all
```

Open browser console and check:
- Images should load from `/mek-images/...` (local paths)
- No R2 URLs in network tab
- Fast loading (no internet required)

### 5.2 Test GitHub Action

1. Make a small change to a file in `public/` (e.g., add a test image)
2. Commit and push to `custom-minting-system` branch
3. Go to **GitHub → Actions** tab
4. Watch the "Sync Public Assets to Cloudflare R2" workflow run
5. Verify in R2 dashboard that new file appears

### 5.3 Test Production Deployment

1. Push to GitHub (triggers Vercel deployment)
2. Wait for Vercel deployment to complete
3. Visit production site: `https://mek.overexposed.io`
4. Open browser DevTools → Network tab
5. Verify media loads from R2:
   - Look for URLs like `https://pub-xxxxx.r2.dev/mek-images/...`
   - Should see 200 status codes
   - Video and audio should play correctly

## Files Modified (Already Done)

These files were updated to use the `getMediaUrl()` utility:

- ✅ `src/lib/media-url.ts` - Created utility function
- ✅ `src/app/landing/page.tsx` - Updated video, audio, images
- ✅ `src/components/UnifiedHeader.tsx` - Updated logo
- ✅ `src/contexts/SoundContext.tsx` - Updated sound files
- ✅ `.github/workflows/sync-r2.yml` - Created GitHub Action
- ✅ `.env.local` - Added `NEXT_PUBLIC_R2_URL` (empty for localhost)

## How It Works - Technical Details

### Media URL Utility (`src/lib/media-url.ts`)

```typescript
export function getMediaUrl(path: string): string {
  const R2_BASE_URL = process.env.NEXT_PUBLIC_R2_URL || '';

  // If R2_URL is set (production), use R2 CDN
  if (R2_BASE_URL) {
    return `${R2_BASE_URL}${path}`;
  }

  // Otherwise (localhost), use local files
  return path;
}
```

**Localhost**: `getMediaUrl('/mek-images/150px/aa1.webp')` → `/mek-images/150px/aa1.webp`
**Production**: `getMediaUrl('/mek-images/150px/aa1.webp')` → `https://pub-xxxxx.r2.dev/mek-images/150px/aa1.webp`

### GitHub Action Workflow

The workflow (`.github/workflows/sync-r2.yml`) runs automatically on every push to `custom-minting-system` branch when files in `public/` change.

**What it does:**
1. Installs rclone (S3-compatible sync tool)
2. Configures connection to R2 using GitHub secrets
3. Syncs only changed files (fast after initial upload)
4. Excludes unnecessary files (HTML test files, markdown docs)

**Sync is smart**: Only uploads new/modified files, not entire 895MB every time.

## Troubleshooting

### GitHub Action Fails with "Permission Denied"

**Problem**: R2 API token doesn't have write permissions.

**Solution**:
1. Go to Cloudflare R2 → API Tokens
2. Edit token or create new one
3. Ensure "Object Read & Write" is selected
4. Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in GitHub secrets

### Media Loads from Local Files in Production

**Problem**: `NEXT_PUBLIC_R2_URL` not set in Vercel.

**Solution**:
1. Vercel Dashboard → Settings → Environment Variables
2. Add `NEXT_PUBLIC_R2_URL` with your R2 public URL
3. Redeploy (Vercel → Deployments → Click "..." → Redeploy)

### R2 URLs Return 403 Forbidden

**Problem**: Bucket is not public.

**Solution**:
1. Cloudflare R2 → Select bucket
2. Settings → Public Access
3. Enable "Allow public access"
4. Wait 1-2 minutes for changes to propagate

### Media Loads from R2 on Localhost

**Problem**: `NEXT_PUBLIC_R2_URL` is set in `.env.local`.

**Solution**:
1. Open `.env.local`
2. Ensure line reads: `NEXT_PUBLIC_R2_URL=` (empty value)
3. Restart dev server: `npm run dev:all`

### Initial Upload Taking Too Long via GitHub Action

**Problem**: GitHub Actions has bandwidth limits, 895MB can take 20+ minutes.

**Solution**: Use manual rclone upload (Option B in Step 4) for first upload. Subsequent syncs are fast (only changed files).

### Files Not Syncing After Push

**Problem**: GitHub Action didn't trigger or path filter excluded files.

**Solution**:
1. Check GitHub Actions tab for workflow runs
2. Workflow only triggers on `public/**` path changes
3. If you modified files outside `public/`, action won't run
4. Manual trigger: GitHub → Actions → Select workflow → Run workflow

## Cost Estimates

### Cloudflare R2 Pricing (as of 2024)

- **Storage**: $0.015/GB/month
  - Your 895MB = ~$0.01/month
- **Class A Operations** (write, list): $4.50/million
  - GitHub Action writes: ~100 files/push = ~$0.0005/push
  - Negligible unless thousands of pushes
- **Class B Operations** (read): $0.36/million
  - Website traffic reads: First 10 million/month FREE
  - Then $0.36/million reads
- **Egress (downloads)**: First 10GB/month FREE, then $0.01/GB

**Expected monthly cost**: $0.01-$0.50 for typical usage (essentially free)

Compare to Vercel: Solving deployment size issues = priceless 😄

## Maintenance

### Adding New Media Files

1. Drop files in `public/` folder (same as always)
2. `git add .` and `git commit -m "Add new media"`
3. `git push` to `custom-minting-system` branch
4. GitHub Action automatically uploads to R2
5. Next Vercel deployment uses new files

**No manual R2 uploads needed!** GitHub Action handles everything.

### Monitoring R2 Usage

1. Cloudflare Dashboard → R2
2. View usage metrics (storage, operations, egress)
3. Set up usage alerts if desired (optional)

### Backup Strategy

Your media files exist in THREE places:

1. **Your local machine**: `public/` directory
2. **GitHub repository**: Full history in git
3. **Cloudflare R2**: Production CDN storage

**You're already backed up!** Git history is your backup. R2 is just a deployment target.

## Next Steps

1. **Complete Cloudflare setup** (Steps 1.1-1.3 above)
2. **Add GitHub secrets** (Step 2)
3. **Add Vercel environment variable** (Step 3)
4. **Do initial upload** (Step 4 - Option A or B)
5. **Test everything** (Step 5)
6. **Celebrate!** 🎉 Your workflow is now automated and Vercel deployments will work

## Support

If you encounter issues:

1. Check GitHub Actions logs for sync errors
2. Verify R2 bucket is public
3. Confirm Vercel has `NEXT_PUBLIC_R2_URL` set
4. Test with small file first (create test image in `public/test.png`)
5. Consult Cloudflare R2 docs: https://developers.cloudflare.com/r2/

---

**Remember**: Localhost will always use local files (fast development). Only production uses R2 (fast downloads for users). Your workflow stays the same!
