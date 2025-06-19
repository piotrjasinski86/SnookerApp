# 🎱 Snooker App — BSc Graphics Programming Project

## 📌 Overview

This project is for the **CM2030 – Graphics Programming** module.  
The goal is to build a full snooker game simulation using **p5.js** and **matter.js**, following the assignment requirements.

---

## ✅ **Progress Tracking**

Below is my progress log, organized by **Phases** from my high-level plan.

---

### **Phase 1: Understand & Prepare**

- [x] **Re-read assignment PDF**
- [x] **Skim Snooker Wikipedia for table layout, ball colors, positioning**
- [x] **Created local project folder**
- [x] **Created `index.html` and `sketch.js`**
- [x] **Linked `p5.js` and `matter.js` via CDN**
- [x] **Verified canvas and physics engine log output**
- [x] **Initialized local Git repo**
- [x] **Connected to remote GitHub repo: [SnookerApp](https://github.com/piotrjasinski86/SnookerApp)**
- [x] **Made initial commit and push**
- [x] **Created `.gitignore` 

---

### **Phase 2: Build Core Structure**

- [x] **Defined key variables for table dimensions, pockets, baulk line, D zone radius, spots**
- [x] **Calculated pocket positions and sizes based on ball dimensions**
- [x] **Implemented table drawing with realistic 2:1 ratio**
- [x] **Added wooden table border for visual realism**
- [x] **Drew baulk line vertically with accurate placement**
- [x] **Drew the D zone semi-circle on the baulk side**
- [x] **Placed colored ball spots correctly along table length**
- [x] **Verified visual layout matches official snooker table layout**

---

### **Phase 3: Ball Mechanics**

- [x] **Created arrays for red balls and colored balls**
- [x] **Implemented Mode 1 (starting position, key `1`)**  
      - All reds in triangle, colored balls on official spots, pink and triangle spacing are authentic
- [x] **Implemented Mode 2 (random positions, key `2`)**  
      - Reds and exactly one of each colored ball appear at random valid positions (no duplicates)
- [x] **Implemented Mode 3 (random reds, key `3`)**  
      - Reds at random, colored balls on correct spots
- [x] **All balls have correct Matter.js physics properties**  
      - Restitution and friction for realistic bounce and rolling
- [x] **Cushions have physics bodies for proper collision/bounce**
- [x] **Gravity disabled — balls only move if hit**
- [x] **All ball drawing uses authentic snooker colors**
- [x] **Pocket positions fixed for snooker (side pockets at center of long cushions)**
- [x] **No red dot confusion — colored spots are small, subtle, and dark, only for colored balls (matches real tables)**
- [x] **No errors or visual overlap in any mode**

---

### **Phase 4: Cue Implementation**

- [x] **Draw cue stick**
  - Cue stick rendered with correct orientation and realistic tip/gap
  - Only visible when cue ball is placed and all balls have stopped (with a short delay for realism)
- [x] **Cue ball must be placed by player inside D**
  - Player can place and reposition cue ball in D zone before first shot
  - Semi-transparent cue ball while placing, turns opaque when placed
  - Repositioning allowed any time balls are at rest
- [x] **Mouse + keyboard aiming and striking**
  - Cue aims from white ball toward mouse position
  - Shot power set with mouse wheel, constrained to realistic range
  - Power bar shown below cue ball
  - Shot taken by pressing Space bar
  - Cue stick and power bar hidden while balls are moving
- [x] **Shot lag implementation**
  - Cue and power bar only appear after a short pause once all balls stop, for improved realism
- [x] **Physics and user feedback**
  - Shot force proportional to power bar value
  - Visual feedback for shot strength (percentage display)


---

### **Phase 5: Gameplay Logic**

- [x] **Cushions have realistic bounce**
  - All table cushions use `restitution: 0.85` for realistic bounce behavior.
  - Tuned and tested for snooker-style deflection.

- [x] **Pocketing balls removes them properly**
  - Red balls are removed from the `redBalls` array and the Matter.js world when pocketed.
  - Cue ball and colored balls are handled separately (see below).

- [x] **Cue ball re-inserted when pocketed**
  - If the cue ball is pocketed, player is forced to re-place it interactively inside the D zone.
  - Velocity is reset to zero for clean repositioning.

- [x] **Colored balls re-spotted**
  - When a colored ball is pocketed, it is automatically moved back to its original spot.
  - Angular velocity and speed are reset to avoid drifting.

- [x] **Error prompt if two colored balls are potted consecutively**
  - Implemented tracking for last pocketed ball type.
  - If a player pockets two colored balls in a row without potting a red in between, an error message is shown in the console and can be displayed on-screen.

- [x] **Collision detection shows correct impact type**
  - Uses Matter.js `collisionStart` to detect collisions involving the cue ball.
  - Logs to console: 
    - `cue–red` when cue ball hits a red.
    - `cue–color` when cue ball hits a colored ball.
    - `cue–cushion` when cue ball hits a cushion.
  - Additional foul logic: if the cue ball hits a colored ball first while reds remain, a visible **FOUL** message appears on screen for 2 seconds.

---

### **Phase 6: Testing & Debugging**

- [ ] **Test all keystroke modes**
- [ ] **Test cue interaction**
- [ ] **Test pocketing & re-spotting rules**

---

### **Phase 7: Extension**

- [x] **Designed and implemented a unique aim prediction feature**
- [x] **Dotted line shows shot direction from the cue ball**
- [x] **Line bounces realistically off cushions**
- [x] **Line stops when it would hit a red or colored ball**
- [x] **Implemented realistic reflection logic for cushions**
- [x] **Helper functions for ray–cushion and ray–ball detection**
- [x] **Fully integrated into main draw loop**
- [ ] **Write explanation in commentary**
---

### **Phase 8: Finalize & Deliver**

- [ ] **Polish code & comments**
- [ ] **Bundle `.js` files as required**
- [ ] **Record video walkthrough (OBS Studio)**
- [ ] **Submit `.zip`, `.mp4`, YouTube link, and merged `.js`**

---

## ✏️ **How I Use This README**

This README acts as:
- A **progress log** for myself  
- A **guide** for remaining steps

---

## 📁 **Repo**

[🔗 GitHub: SnookerApp](https://github.com/piotrjasinski86/SnookerApp)

---

## ✅ **Next Up**

- Complete **Phase 2**: core variables + table drawing
- Create `.gitignore`
- Push updates regularly

---

## 📌 **Last updated:** `2025-06-17`

---

