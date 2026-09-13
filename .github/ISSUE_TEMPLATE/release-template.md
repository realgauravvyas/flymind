---
name: FLYMIND release notes template
about: Draft release body (copy from here when publishing)
title: ''
labels: ''
assignees: ''
---

<!-- Copy the body below into a GitHub Release (Releases → Draft new release → paste → publish).
     Fix image paths: ../assets/ → assets/ so they render on the release page. -->

# FLYMIND v1.0 — Interactive Fruit Fly Connectome Playground

**Poke a fruit fly's senses. Watch real neural circuits light up. Train its brain. Listen to it sing.**

Built on the complete fruit fly connectomes ([male CNS](https://male-cns.janelia.org/) — 166,000 neurons, 125M synapses — published by HHMI Janelia + Google Research, and [FlyWire female brain](https://flywire.ai)).

![Arena](../assets/demo-arena.png)

## What's inside

- 🪰 **Poke the Fly** — click SMELL/SEE/TOUCH/SCARE hotspots; watch named neurons (Or42b → V_PN → KC → MBON) cascade with live oscilloscope + trace log. Geosmin makes it flee; a poke triggers the giant-fibre jump reflex.
- 🕸 **Connectome Explorer** — force-graph of 42 real neuron classes; drag, zoom, search; click two neurons to animate the shortest signal path through real synapses.
- 🎓 **Train the Fly** — a playable mushroom body using the fly's actual dopamine-gated learning rule. Train odour+sugar pairings, watch KC→MBON weights rewrite, then run a free-choice test.
- 🎵 **Courtship Song Lab** — WebAudio synthesis of the male's real ~200 Hz wing pulse song; females on screen turn receptive when they hear it.
- 🔊 **Neuron audio** — every firing neuron pings a pitch-blip keyed to its cell class.

![Explorer](../assets/demo-explore.png)

## Verified before release

Played end-to-end by a headless browser: **21/21 pixel-audit checks passed, 0 console errors** — fly flees geosmin, leaps on threat, learning flips valence +0.00 → +0.58, song audio matches its readout.

## Try it

```bash
npm start   # http://localhost:8123 — no build, no dependencies
```
