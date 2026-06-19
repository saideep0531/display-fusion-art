# DisplayFusion — Deterministic MenuBoard Renderer

A deterministic digital menu board rendering engine built for restaurant chains operating across multiple locations and TV wall configurations.

Live Demo:
https://display-fusion-art.lovable.app

---

## Problem

Restaurant chains continuously update menus throughout the day.

* Breakfast disappears at 11:00 AM
* Dinner combos appear at 5:00 PM
* Items go out of stock
* Different stores have different TV layouts

Traditional menu systems require manual updates or expensive rendering pipelines.

DisplayFusion solves this by generating dynamic, unattended, TV-ready menu layouts automatically.

---

## Solution

DisplayFusion takes:

* Full menu data (`menu.json`)
* Screen wall configuration
* Current state of the day
* Out-of-stock information

And produces:

* Balanced menu layouts
* Multi-screen rendering
* Deterministic output
* Readable menu boards
* Near-zero render cost

Same input always produces the same output.

---

## Features

### Dynamic Menu Rendering

* Morning → Breakfast visible
* Lunch → Breakfast hidden
* Evening → Dinner specials active

### Multi-Screen Support

* 1 Screen
* 2 Screens
* 4 Screens
* Landscape
* Portrait

### Deterministic Rendering

Same menu + config + state → same layout

### Validation Engine

* Every available item appears exactly once
* No duplicates
* No missing items
* No clipping
* No overflow

### Cost Optimized

No LLM calls during live rendering.

Target:

* 1,000 menu changes/month
* Total cost < $10

---

## Architecture

```text
menu.json
+
screen config
+
state
↓
Renderer Engine
↓
Filter Availability
↓
Balanced Layout Algorithm
↓
TV Output
↓
Validation
```

---

## Rendering Pipeline

### Step 1 — Load Inputs

* Menu
* Screen config
* Current state

### Step 2 — Filter

Remove:

* unavailable categories
* out-of-stock items

### Step 3 — Sort

Deterministic ordering:

* category
* priority
* name
* id

### Step 4 — Layout

Distribute items across screens.

### Step 5 — Validate

Check:

* missing items
* duplicate items
* overflow

---

## Tech Stack

Frontend

* Lovable
* React
* TypeScript
* Tailwind

Rendering

* Deterministic layout engine
* CSS Grid

Deployment

* Lovable Publish

---

## AI Usage

AI is intentionally NOT used during menu rendering.

AI was used only during:

* design exploration
* development assistance
* renderer planning

Live menu changes execute deterministic code only.

---

## Demo Scenarios

### Morning

Breakfast visible

### Lunch Rush

Breakfast hidden

### Weekend Evening

Dinner specials active

### Config Testing

* solo
* duo
* wall
* tower
* twins
* totem

---

## Cost Estimate

Per Render:
~$0.0000

Monthly:
1000 renders < $10

No model inference cost.

---

## Submission

Track:
Frontend & UX

Project:
DisplayFusion — Deterministic MenuBoard Renderer

Live URL:
https://display-fusion-art.lovable.app

---

Built during Buildathon.
