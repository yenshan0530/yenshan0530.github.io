# My Jekyll Website

This repository contains the source code for my website, optimized for deployment on Linux clusters (like H100 nodes).

## Environment Setup

This project uses a hybrid Conda/Ruby environment to manage dependencies without `sudo` access.

### 1. Recreate the Environment
```bash
conda env create -f environment.yml
conda activate website
```
### 2. Install Ruby Gems
```bash
bundle install
```

## Running Locally (Remote Server)
To serve the site on a remote cluster and view it locally:

1. **On the Server:**
   ```bash
   bundle exec jekyll serve --host 0.0.0.0
   ```
2. **On your Local Machine (SSH Tunnel):**
   ```bash
   ssh -L 4000:localhost:4000 <user>@<server-ip>
   ```
Visit `http://localhost:4000` in your browser.