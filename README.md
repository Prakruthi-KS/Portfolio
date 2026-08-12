# Prakruthi Kaganti Shivakumar — Portfolio

A single-page, full-page horizontal-scroll portfolio site built with plain HTML/CSS/JS + GSAP ScrollTrigger.

## Structure

- `index.html` — all page content and section markup
- `style.css` — theme variables, layout, animations
- `script.js` — horizontal scroll rig, capabilities scroller, nav, project hover previews
- `logos/` — company/school logos used in the Experience timeline
- `Prakruthi-Resume.pdf` — downloadable resume

## Running locally

Just open `index.html` in a browser — no build step required.

## Deploying with GitHub Pages

1. Push this repo to GitHub (see below).
2. On GitHub: **Settings -> Pages -> Source -> Deploy from a branch -> `main` / root**.
3. Save. The site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Pushing to GitHub

This folder is already a git repo with everything committed. To publish:

    git remote add origin <YOUR_GITHUB_REPO_URL>
    git branch -M main
    git push -u origin main

Replace `<YOUR_GITHUB_REPO_URL>` with the URL of an **empty** repo you create on GitHub (don't initialize it with a README, so there's nothing to conflict with).
