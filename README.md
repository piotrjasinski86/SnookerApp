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

- [ ] **Draw cue stick**
- [ ] **Implement mouse + keyboard aiming and striking**
- [ ] **Cue ball must be placed by player inside D**

---

### **Phase 5: Gameplay Logic**

- [ ] **Cushions have realistic bounce**
- [ ] **Pocketing balls removes them properly**
- [ ] **Cue ball re-inserted when pocketed**
- [ ] **Colored balls re-spotted**
- [ ] **Error prompt if two colored balls potted consecutively**
- [ ] **Collision detection shows correct impact type**

---

### **Phase 6: Testing & Debugging**

- [ ] **Test all keystroke modes**
- [ ] **Test cue interaction**
- [ ] **Test pocketing & re-spotting rules**

---

### **Phase 7: Extension**

- [ ] **Design & implement a unique gameplay extension**
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
- A **context file** for ChatGPT sessions (I paste updates when I want help)
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

