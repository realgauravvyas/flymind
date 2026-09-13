# Making the GitHub repo page look great

The README screenshots are already wired up. Two more things make the repo page pop:

## 1. Social preview (the share image)

When anyone shares your repo link (X/Twitter, LinkedIn, WhatsApp, Discord), GitHub shows a card image. Set it:

1. Repo → **Settings** → **General** → scroll to **Social preview**
2. Upload `assets/demo-arena.png` (1440×900 — perfect card ratio)
3. Save. Share links now show the fly with its brain lighting up.

## 2. Repo description + topics (the header line under the repo name)

Repo home page → click the ⚙ (top-right of the "About" sidebar):

**Description:**
```
🧠 Poke a fruit fly's senses and watch real neural circuits fire — interactive connectome playground built on the Janelia/Google fruit fly brain maps. Train its mushroom body. Hear it sing.
```

**Website:** your GitHub Pages URL (after deploying)

**Topics** (type each, press enter):
```
connectomics  fruit-fly  drosophila  neuroscience  brain-visualization  education  javascript  canvas  webaudio  zero-dependency  interactive
```

## 3. Release (optional but nice)

Releases tab → **Draft a new release** → tag `v1.0.0` → title: `FLYMIND v1.0 — connectome playground` → paste `.github/RELEASE_TEMPLATE.md` content (fix the image paths from `../assets/...` to `assets/...`). The release page renders the screenshots big.

## 4. Pin it

On your GitHub profile → "Customize your pins" → add this repo so visitors see it first.
