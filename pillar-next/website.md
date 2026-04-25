# Pillar Landing Page

> This file should be updated each chat session. Only add things that are high-level and important — decisions, constraints, and context that would be lost otherwise. No implementation details.

## About
AI coaching hardware. Watches form in real time, gives live audio feedback. Target: serious lifters who train alone.

## Design
- Light mode: warm off-white `#EDEAE4`, red accent `#9B2B2B` stays
- Feel: subtle and soft — inspired by Teenage Engineering but toned down
- No bloat animations. Static and fast.
- Mobile-first is a hard requirement. JOIN BETA always visible on mobile.

## Typography
Two options under evaluation via A/B toggle (bottom-right corner of site):
- **A** — Space Grotesk Bold (current)
- **B** — Inter Tight 800, tight tracking

## Page Structure
Hero → Product Slideshow → The Problem → Features → How It Works → Signup → Team → Footer

## Key Decisions
- Product slideshow (full-screen, user-controlled) replaces the broken image grid
- How It Works (Place / Lift / Listen) uses an accordion — all collapsed by default
- The Problem section: raw declarative prose, no numbering or borders
- Signup is email capture only — beta session booking, backend TBD
- New desktop product images needed (user to provide correct aspect ratio)

## Business
- YC application deadline: May 4, 2026
- Copy across all sections needs a heavy rewrite (in progress)
