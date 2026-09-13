# FLYMIND 🪰🧠
### Interactive Fruit Fly Connectome & Sensory Electrophysiology Playground

<p align="center">
  <a href="https://realgauravvyas.github.io/connectomics/flymind/">
    <img src="https://img.shields.io/badge/🚀_LAUNCH_FLYMIND-realgauravvyas.github.io%2Fconnectomics%2Fflymind-00e5ff?style=for-the-badge&logo=google-chrome&logoColor=black" alt="Launch FLYMIND" />
  </a>
  <a href="https://realgauravvyas.github.io/connectomics/">
    <img src="https://img.shields.io/badge/CONNECTOMICS-MASTER_HUB-00e5ff?style=for-the-badge&logo=github&logoColor=white" alt="Connectomics Hub" />
  </a>
</p>

[![Connectome Milestone](https://img.shields.io/badge/Connectome-Cell%202026-00e5ff.svg)](https://research.google/blog/a-connectomics-milestone-mapping-the-complete-male-fruit-fly-brain/)
[![Live Status](https://img.shields.io/badge/GitHub_Pages-LIVE-00ff88?style=flat-square&logo=github)](https://realgauravvyas.github.io/connectomics/flymind/)
[![Circuits](https://img.shields.io/badge/Neural_Circuits-42_Classes_%C2%B7_642_Synapses-ff007f?style=flat-square)](https://realgauravvyas.github.io/connectomics/flymind/)
[![Oscilloscope](https://img.shields.io/badge/Oscilloscope-Real--Time_Firing_Trace-00e5ff?style=flat-square)](https://realgauravvyas.github.io/connectomics/flymind/)
[![Sound](https://img.shields.io/badge/Procedural_Audio-WebAudio_Zero_Assets-ffb703?style=flat-square)](https://realgauravvyas.github.io/connectomics/flymind/)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero_Runtime-brightgreen?style=flat-square)](https://realgauravvyas.github.io/connectomics/flymind/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> 🎮 **Experience the Living Connectome in Your Browser:**  
> 👉 **[https://realgauravvyas.github.io/connectomics/flymind/](https://realgauravvyas.github.io/connectomics/flymind/)**  
> *Part of the [CONNECTOMICS Suite](https://realgauravvyas.github.io/connectomics/) by Gaurav Vyas.*

**Poke a fruit fly's senses. Watch real neural circuits light up. Train its brain. Listen to it sing.**

FLYMIND is an interactive neuro-computational workbench built directly from published *Drosophila melanogaster* connectomics datasets (the complete [FlyWire female brain][flywire] and Google Research $\times$ HHMI Janelia's complete [Male CNS connectome][blog], *Cell* September 2026).

A neon holo-wireframe fly rests under a virtual laboratory scanner: stimulate its compound eyes, antennal olfactory receptors, mechanosensory bristles, or looming shadow sensors, and watch named action potential cascades propagate across its brain in real time alongside a synchronized digital oscilloscope, synaptic wiring trace, and spatial audio telemetry.

---

## 📸 Interactive Visual Showcase

| **POKE THE FLY** — Real sensory-motor signal cascades | **CONNECTOME EXPLORER** — Force-directed graph of 42 neuron classes |
|:--:|:--:|
| ![Arena](assets/demo-arena.png) | ![Connectome Explorer](assets/demo-explore.png) |
| **TRAIN THE FLY** — Dopaminergic Mushroom Body conditioning | **COURTSHIP SONG LAB** — Wing vibration acoustic physics |
| ![Train the Fly](assets/demo-learn.png) | ![Courtship Song Lab](assets/demo-song.png) |

---

## 🔬 Core Interactive Experiment Modes

| Laboratory Tab | Biophysical Mechanism & Gameplay |
|---|---|
| **🪰 Poke the Fly** | Trigger realistic sensory cues (SMELL, SEE, TOUCH, SCARE). Signals propagate through verified biological routes: `Or42b → V_PN → KC → MBON` (attraction to apple cider vinegar), `Or56a → DA1_PN` (hardwired avoidance to harmful geosmin mold), and mechanical touch triggering the **Giant Fiber escape jump reflex** (`GFN → TTMn`). |
| **🕸 Connectome Explorer** | Interactive force-directed topological graph of 42 biological neuron classes. Search for specific neuro-types (`MBON`, `PAM`, `fru`, `vpoDN`). Select any two neurons to compute and animate the shortest physiological signal pathway (BFS over real synaptic edges). |
| **🎓 Train the Fly** | Playable **Mushroom Body** associative memory model. Pair odorants with sugar reward (PAM dopamine neurons) or electric shock (PPL1 dopamine neurons) to witness real-time synaptic depression of KC $\to$ MBON connections (Owald & Waddell rule). Then run free-choice T-maze tests to verify behavioral preference shifts. |
| **🎵 Courtship Song Lab** | Male *Drosophila* extend and oscillate a single wing to produce a species-specific ~200 Hz **pulse song** (~35 ms interpulse interval). Adjust pulse parameters in real time via Web Audio API synthesis and observe female acoustic receptivity behaviors governed by the `P1 → vpoDN → wing motor` courtship pathway. |
| **🔬 Science Dossier** | Comprehensive scientific breakdown detailing every circuit motif, published literature citations, transmitter profiles, and honest biological simplifications. |

---

## 🧬 Biological Neuroanatomy & Wiring Ground Truth

FLYMIND utilizes authentic neuron nomenclature and connectivity logic from published EM reconstructions:

```
  [ SENSORY PERCEPTION ]
    • Olfaction: Or42b (Vinegar / Attraction), Or56a (Geosmin / Toxic Flee), Gr21a (CO2 Panic)
    • Vision: R1–R6 Photoreceptors, T4/T5 Motion Detectors, HS/VS Wide-Field Tangential Cells
    • Mechanosensation: Johnston's Organ (JO-A1 Acoustic Hearing), Bristle Touch Sensors
             │
             ▼
  [ CENTRAL ROUTING & LEARNING ]
    • Projection Neurons: V_PN (Attraction), DA1_PN (Avoidance), DL5_PN
    • Associative Memory: 42 Kenyon Cells (KCs) + APL Feedback Interneuron
    • Neuromodulation: PAM Dopaminergic Neurons (Reward), PPL1 Clusters (Punishment)
    • Output Valuation: MBON-$\alpha$, MBON-$\beta$ (Driving Approach vs Avoidance Valence)
             │
             ▼
  [ DESCENDING MOTOR PATHWAYS ]
    • Giant Fiber Neuron (GFN): Monosynaptic escape jump reflex
    • MDN (Moonwalker): Reverse backward walking command
    • P1 & pCd Hub: Male-specific courtship excitation and song initiation
    • vpoDN: Descending motor command driving unilateral wing oscillation
             │
             ▼
  [ EFFECTORS ]
    • TTMn: Tergal Trochanter jump muscle activation
    • WSN / Wing Motor: Flight and acoustic courtship vibrations
```

---

## 🧪 Automated Testing & Headless Verification

FLYMIND features an extensive automated test suite ensuring neural connectivity and learning integrity:

```bash
# Run all 4 headless validation suites
npm test
```

**Individual Component Tests:**
```bash
node tools/test-mb.js            # Learning Rule: Sugar flips odor valence (0.00 -> +0.46)
node tools/test-cascade.js       # Signal Cascades: Verify sequential firing & termination
node tools/test-connectivity.js  # Synaptic Connectivity: 1,600 neuron pairs reachable
node tools/test-integration.js   # DOM bindings, stim buttons, zero cycle deadlocks
```

---

## 📁 Repository Structure

```
flymind/
├── index.html        # Complete multi-tab scientific laboratory interface
├── css/style.css     # Neon-wireframe lab HUD and oscilloscope styling
├── js/
│   ├── data.js       # Biological neuron attributes, transmitters & synaptic matrices
│   ├── brain.js      # Event-driven action potential propagation engine
│   ├── arena.js      # Interactive 2D neon fly canvas + hotspot sensors
│   ├── explore.js    # Force-directed connectome graph & BFS pathfinder
│   ├── learn.js      # Mushroom body dopaminergic plasticity simulator
│   ├── song.js       # Courtship acoustic wing-oscillation canvas
│   ├── audio.js      # Procedural Web Audio API spike blips & song synthesis
│   └── main.js       # Tab state machine, oscilloscope trace, UI telemetry
└── tools/            # Headless Node.js test runners & browser playthrough audits
```

---

## 🌐 Complete Connectomics Ecosystem

FLYMIND is part of the [**CONNECTOMICS**](https://realgauravvyas.github.io/connectomics/) simulation suite:

- ⚽ **[FLYKICK](https://realgauravvyas.github.io/connectomics/flykick/):** 2 teams of neural flies play football with real-time Brain Cam and manual possession override.
- ♟️ **[FlyGambit](https://realgauravvyas.github.io/connectomics/fly-gambit/):** Sparse *Drosophila* connectome learning chess with interactive mid-game brain lesioning.
- 🏃 **[FlySprint](https://realgauravvyas.github.io/connectomics/fly-sprint/):** 1–5 evolved flies with 94-weight neural gait controllers racing 100m–400m and hurdles.
- 🔬 **[MUSCA](https://realgauravvyas.github.io/connectomics/musca/):** 166,700 reconstructed neurons with 2.82M edges and reverse behavior search.
- ⚡ **[166k](https://realgauravvyas.github.io/connectomics/166k/):** Large-scale Leaky Integrate-and-Fire (LIF) spiking electrophysiology with dopamine conditioning.
- 🌌 **[SYNAPTICA](https://realgauravvyas.github.io/connectomics/synaptica/):** 12 mapped neuropil hubs with real-time Hebbian plasticity tracking.
- 🪰 **[DROSOMIND](https://realgauravvyas.github.io/drosomind/):** Articulated 3D male fly with bio-acoustic courtship song synthesis.

---

## 📚 Scientific References

- Google Research, HHMI Janelia, FlyEM Consortium:  
  *"Sexual dimorphism in the complete connectome of the Drosophila male central nervous system"*, **Cell** (September 2026).
- Google Research Announcement:  
  [A connectomics milestone: Mapping the complete male fruit fly brain][blog].
- FlyWire Whole-Brain Consortium ([flywire.ai][flywire]).
- Owald & Waddell (2015): *Olfactory learning in Drosophila mushroom bodies*.

[blog]: https://research.google/blog/a-connectomics-milestone-mapping-the-complete-male-fruit-fly-brain/
[flywire]: https://flywire.ai

---

## 👤 Author

**Gaurav Vyas**  
- 🌐 **Academic Profile:** [socialpsychology.org/member/gaurav-vyas](https://www.socialpsychology.org/member/gaurav-vyas)  
- 🔶 **Interactive Portfolio:** [realgauravvyas.github.io](https://realgauravvyas.github.io/)  
- 🐙 **GitHub:** [@realgauravvyas](https://github.com/realgauravvyas)  
- 🪰 **Full Connectomics Suite:** [realgauravvyas.github.io/connectomics](https://realgauravvyas.github.io/connectomics/)

---

## 📄 License

MIT License &copy; 2026 Gaurav Vyas. Open-source science for everyone.
