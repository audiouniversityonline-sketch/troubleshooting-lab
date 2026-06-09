# Troubleshooting Lab

An interactive mixing-console training simulator for [Audio University](https://www.youtube.com/@AudioUniversity). Single-page app, no build step (React + Babel via CDN). Free Essentials tier acts as the lead magnet; paid challenge scenarios drip in over time for members.

## Files

- **`index.html`** — the app shell: engine, UI, and the synthesized audio.
- **`content.js`** — the scenario library. Sets `window.LEVELS` (the free Essentials, in order) and `window.CHALLENGE_BANK` (paid scenarios). **This is the file to edit when adding new levels.**

## Hosting

Served via GitHub Pages and embedded in an iframe on the Audio University Circle community. The member page is gated to an access group; the free page is open as a lead magnet.

A commit to `main` auto-deploys to the live Pages URL within about a minute. That is the whole content pipeline: add a scenario to `content.js`, commit, and it is live.

## Progress and the drip model

Member progress is saved in the browser via `localStorage`, keyed by each level's **stable `id`**. Two rules keep monthly content drops from disturbing anyone's progress:

1. **Every scenario has a stable `id`.** Progress is stored by id, not by position.
2. **Append only. Never renumber existing levels.** New scenarios go on the end with new ids.

Follow those two and you can drop new levels any time without resetting a single student.

## Audio

The app synthesizes its sound in the browser with the Web Audio API. It loads no audio files, so there is nothing to break across hosts. Sound starts off and resumes on the first click (browser autoplay policy).
