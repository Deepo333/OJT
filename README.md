# Career Forge

A tiny personal web app that helps you figure out what you'd need to learn to qualify for a real job you want. It runs entirely in your phone's browser. There is no server, no account, no database, and no AI key. You are the bridge: the app writes a prompt, you paste it into the Claude app, then you paste Claude's reply back into this app and it saves the analysis for you.

## Stage 1: what this version does

1. You paste a full job listing and describe your current background.
2. The app builds a carefully-structured prompt for Claude.
3. You copy that prompt with one tap and paste it into the Claude app.
4. Claude replies with a structured analysis. You copy that reply.
5. You paste it back into Career Forge. It parses the reply and shows you:
   - Required Qualifications
   - Preferred Qualifications
   - Tools & Software
   - Core Responsibilities
   - What I Already Have
   - What I Need to Learn
6. Every analysis is saved on your phone (in the browser's local storage) so you can revisit it later.

There's a **Try the example** button on the home screen that fills in a sample job listing and a sample background, so you can walk through the whole flow before you use a real one.

## How the copy-paste flow works, step by step

1. Open Career Forge on your phone.
2. Tap **Try the example** (or paste a real job listing and your own background).
3. Tap **Generate Analysis Prompt**. The prompt appears in a box.
4. Tap **Copy prompt**. Your phone now has the prompt on its clipboard.
5. Switch to the Claude app. Paste. Send.
6. When Claude replies, long-press its answer, tap **Copy**.
7. Switch back to Career Forge (still on the same screen).
8. Paste Claude's reply into the "Paste Claude's response here" box.
9. Tap **Save Analysis**.
10. You'll see the analysis broken out into sections. It's saved to your home screen list.

If the parser complains, it usually means part of Claude's reply got cut off during copying. Go back to the Claude app, select and copy the *whole* reply, and paste again.

## How to deploy this to GitHub Pages, from just your iPhone

You do not need a computer. You only need the GitHub app or safari.github.com in a browser, and this repository.

1. In GitHub, open the repository that contains these files (`index.html`, `styles.css`, `app.js`, `manifest.json`, `icon.svg`, `README.md`).
2. Tap the repository name at the top → **Settings**.
3. Scroll down to **Pages** (under "Code and automation").
4. Under **Source**, pick **Deploy from a branch**.
5. Under **Branch**, pick **main** (or whichever branch has these files) and the folder **/(root)**. Tap **Save**.
6. Wait a minute. Refresh the Pages screen. You'll see a green box that says something like *"Your site is live at https://YOUR-USERNAME.github.io/YOUR-REPO/"*.
7. Open that URL in Safari on your iPhone.
8. Tap the **Share** icon (the box with an arrow) → **Add to Home Screen** → **Add**.
9. You now have a Career Forge icon on your home screen. Tap it and it runs full-screen like an app.

That's it. No build step. Every future edit you make in the GitHub app (or on github.com in Safari) will redeploy automatically within a minute or two.

### If Pages doesn't work

- Make sure the repository is **public** (free GitHub Pages only serves public repos).
- Make sure `index.html` is at the top level of the repository, not inside a subfolder.
- Give it two or three minutes after saving — the first deploy takes the longest.

## Files in this project

| File            | What it does                                       |
| --------------- | -------------------------------------------------- |
| `index.html`    | The single page: home, prompt view, analysis view. |
| `styles.css`    | Mobile-first styling. Dark mode is automatic.      |
| `app.js`        | Prompt building, response parsing, saving.         |
| `manifest.json` | Makes it installable as an app.                    |
| `icon.svg`      | The app icon.                                      |
| `README.md`     | This file.                                         |

## Your data

Everything you save lives in your iPhone browser's local storage under the key `careerForge.analyses.v1`. It is not sent anywhere. If you clear Safari's site data, or uninstall the home-screen app in a way that clears storage, your saved analyses will be gone. Only the Claude app sees the pasted prompt — Career Forge never talks to any AI service or server.

## What's next (future stages, not built yet)

- **Study path generation**: from a "need to learn" list, generate a personalized week-by-week study plan (also via the copy-paste Claude flow).
- **Practice assignments**: request small, specific practice exercises for each gap skill and track which ones you've done.
- **Feedback**: paste your finished practice work and get structured feedback from Claude.
- **Portfolio**: collect completed practice work into a shareable portfolio view.
- **Progress tracking**: mark skills as "learning" → "practicing" → "done" as you close each gap.

Every future stage will keep the same rule: no server, no AI key, no account. Career Forge will always be a static page that runs on your phone, with you as the human bridge to Claude.
