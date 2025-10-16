# 🚀 How to Push BMC Helix Monitor to GitHub

## Your Repository: git@github.com:blur702/bmc.git

Follow these steps on YOUR local machine:

---

## Step 1: Copy all files to your local machine

Download/copy the entire `bmc-helix-monitor` folder to your computer.

---

## Step 2: Navigate to the folder

```bash
cd /path/to/bmc-helix-monitor
```

---

## Step 3: Verify Git is initialized

```bash
git status
```

You should see all the files ready to commit.

---

## Step 4: Add the GitHub remote

```bash
git remote add origin git@github.com:blur702/bmc.git
```

---

## Step 5: Rename branch to main (if needed)

```bash
git branch -M main
```

---

## Step 6: Push to GitHub

```bash
git push -u origin main
```

If the repo already has content and you get a rejection, you can force push:

```bash
git push -u origin main --force
```

⚠️ WARNING: Force push will overwrite everything in the remote repo!

---

## Alternative: If repo has existing content you want to keep

If your GitHub repo already has files you don't want to overwrite:

```bash
# Pull existing content first
git pull origin main --allow-unrelated-histories

# Resolve any conflicts if they occur
# Then push
git push -u origin main
```

---

## Verify it worked

Go to: https://github.com/blur702/bmc

You should see all your files there! 🎉

---

## Troubleshooting

### "Permission denied (publickey)"
- Your SSH key isn't set up with GitHub
- Generate a key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
- Add to GitHub: Settings → SSH and GPG keys → New SSH key
- Paste contents of `~/.ssh/id_ed25519.pub`

### "Repository not found"
- Make sure the repo exists at github.com/blur702/bmc
- Check if you have access to it
- Try using HTTPS instead: `git remote set-url origin https://github.com/blur702/bmc.git`

### "Branch main already exists"
- Skip the `git branch -M main` step
- Just do `git push -u origin main`

---

## Need to start fresh?

If something goes wrong and you want to re-initialize:

```bash
# Remove git
rm -rf .git

# Re-initialize
git init
git add .
git commit -m "Initial commit: BMC Helix Monitor"
git branch -M main
git remote add origin git@github.com:blur702/bmc.git
git push -u origin main --force
```
