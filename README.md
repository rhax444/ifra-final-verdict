# Ifra: The Final Verdict

**Play it:** https://ifra-final-verdict.vercel.app

A cinematic 3D courtroom mystery adventure, built with React, Vite, Three.js, React Three Fiber, Drei, Tailwind, Framer Motion, Lucide and Howler.

Everything is procedural: the geometry, textures, music and sound effects are all generated in code. There are no asset downloads and no paid APIs. The only external request is Google Fonts, which falls back to system fonts when offline.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (host anywhere: Netlify, Vercel, GitHub Pages…)
```

## Edit the story

All dialogue, charges, exhibits, witnesses, achievements, the gift text and the final letter live in
**`src/config/gameConfig.js`**. That file also holds `FRIEND_NAME`, `GAME_TITLE` and `HELPER_NAME`.

`HELPER_NAME` is internal metadata only. It is attached to the helper character in code and is never displayed. The helper's look (`HELPER_LOOK`) and the small `✦` mark on his notes and gift are kept the same across all of his appearances.

## Story flow

| Phase | Where | What happens |
|---|---|---|
| Prologue | Courthouse exterior | Cinematic approach, the summons and the five charges |
| Portrait | Studio | Customise hair style, hair colour, blazer and accessory |
| Ch. 1 | Reception | Talk to the receptionist, sign for the summons, enter the Evidence Wing |
| Ch. 2 | Evidence room | Collect Exhibits A–E (the drawer puzzle hides C). After three, she's tired, and a coffee and a note appear on her desk |
| Ch. 3 | Courtroom | Plea, three witnesses, cross-examination and presenting evidence |
| Ch. 4 | Courtroom | The final record is missing. A hand slides a folder under the door |
| Ch. 5 | Courtroom | The verdict: NOT GUILTY, confetti, applause, Future Legal Legend |
| Epilogue | Courtyard | A gift at the foot of the steps, a walk together, graduation, the letter |

## Controls

- **Desktop:** WASD or the arrow keys to move, Shift to hurry, drag to look, E (or click a glowing object) to interact, Space/Enter to advance dialogue, 1–3 to choose, I for the case file, Esc to pause.
- **Mobile:** joystick to move, drag to look, the hand button to interact, tap to advance dialogue.

On phones and low-core devices the game starts in Performance mode: no shadows, a lower pixel ratio and fewer particles. It also drops to Performance automatically if the frame rate falls. You can switch back in the pause menu.
