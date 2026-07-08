/* ============================================================
   content.js - Troubleshooting Lab scenario data
   ------------------------------------------------------------
   The level/challenge library, split out of index.html so new
   scenarios can be dripped in by editing this one small file
   instead of the app shell. Loaded as a plain <script> BEFORE
   the app's babel blocks, so keep it plain JS (arrow functions
   are fine; no JSX).

     window.LEVELS          - the free Essentials tier, in order.
     window.PRACTICE        - the paid Practice Mode scenario (endless reps).
     window.PRACTICE_FAULTS - the fault pool Practice Mode draws from.
     window.FEEDBACK_MODE   - the paid ring-out trainer (endless wedges).

   Rules that keep monthly drops from disturbing student progress:
     - Every entry has a STABLE id. Progress is saved by id.
     - Only ever APPEND new scenarios. Never renumber existing ones.
   ============================================================ */

// LEVELS — the Essentials free tier.
//
// Contract per level (kept intentionally small so the prose surface stays
// editable):
//   - title    : 2-4 words
//   - symptom  : what's going on, in plain language. For task levels this is
//                the job to do, not a problem description.
//   - hint     : a plain nudge if they're stuck
//   - solution : what the fix was (shown on solve)
//   - task     : true for setup/procedure levels where nothing is broken.
//                Changes the UI framing: TASK label instead of the red
//                SYMPTOM, TASK COMPLETE instead of MIX RESTORED, Recap
//                instead of Fix.
//   - requirePowerOn : win on power state, not signal. Passes when the
//                console, power amp, and both wedges are all on (in an order
//                that didn't pop). Use with conditions: [] for a pure
//                power-on lesson that doesn't need signal flow.
//   - requirePowerOff : the mirror image. Passes when the master fader is
//                pulled down, every powered box (wedges + PA speakers, or the
//                amp on a passive rig) is off, and the console is off — in an
//                order that didn't pop. Turning the console off while a
//                powered box is still live pops it (cause 'mixer_off_pop'),
//                so the order the level teaches is: speakers first, console
//                last.
//   - requireZeroed : zero-the-console check. Passes when every channel is
//                back to its default state (gain, aux1/aux2 and fader down,
//                muted, pan centered, HPF and +48V off) and the master is
//                down AND muted. Pair with requirePowerOff for the full
//                end-of-night routine.
//   - verifyEach : [{source, dest, min, label}] — verify outputs one at a
//                time. Each destination LATCHES checked the moment its source
//                reaches it (>= min) and stays checked, so the win does NOT
//                need them all live at once. Win when every entry is checked.
//                Use with conditions: [] and an explicit involves.
//   - gainStructure : { refChannel?, unity, faderTol, inputBand? } — gain-
//                structure lesson. Win also requires the reference channel's
//                fader AND the master fader to sit at unity (within faderTol).
//                Optional inputBand [lo, hi] also requires the ref channel's
//                input (chanIn baseline) to sit in a healthy band, so the
//                student sets the input gain by hand (pair with requirePflCheck
//                to make them verify it in PFL first). Omit refChannel for a
//                master-only unity check (The Gig: playback ends turned down,
//                so no single channel is pinned).
//   - conditions, sabotage, defaultInspect, topology, involves: engine fields
//   - sabotage(s, rng) : rng is a seeded PRNG the app passes on every load.
//                Challenges place their fault with it (randomized reps);
//                Essentials ignore it and stay deterministic.
//   - par      : challenges only. The move count of a systematic check,
//                shown against the student's own move count in the debrief.
//   - hintAuto : presentation override. Defaults: Essentials show the hint
//                up front, challenges keep it behind a "Need a hint?" button.
//
// Prose rule (Kyle, 2026-06-10): write simple and clear, not "in character."
// Don't reach for engineer slang or scene-setting to sound like the niche.
// Plain sentences that say what's happening beat flavor every time, and
// they're easier for beginners.
//
// REFOCUSED 2026-06-10 PM (Kyle): the free Essentials are now setting up a
// system and learning the standard input types, as a continuous on-site build.
// The 10 lessons, in order:
//   1 Patch the System    - connect everything per the input list (added
//                           2026-06-11: inputs, outputs, snake by color code)
//   2 Power-On Sequence   - bring the rig up in the right order (active speakers)
//   3 Set the Input Level - PFL the playback, set gain, faders to unity
//   4 Test the Wedges     - send to each wedge, verify one at a time
//   5 Mic Inputs          - dynamic (no power) + condenser (+48V)
//   6 DI Boxes            - passive (no power) + active (+48V)
//   7 Monitor Mix         - send a wedge mix
//   8 Feedback Awareness  - keep the monitor loop under control
//   9 The Gig             - final exam: full pre-show check from a cold start
//                           (speakers verified with playback, then the band)
//  10 Power-Down          - zero the console, then shut down in the right order
// The early levels build on each other (each starts where the last ended).
// Troubleshooting faults (cable, gain, fader, mute, pan, phantom, master,
// speaker, feedback, crosspatch) live in the paid PRACTICE_FAULTS pool, where
// "something's broken, fix it" is the point.
// Source types: Vocal Mic 1 = dynamic, Vocal Mic 2 = condenser (+48V); Bass DI
// = passive, Keyboard DI = active (diActive, needs +48V like a condenser). The
// 5/6 playback is a FOH line input on channel 5 (no snake port).
// Extra contract field (2026-06-11):
//   - requirePatch : win requires the physical patch to match the paperwork
//                (the Input List): sources on snake inputs 1-4, input tails on
//                their console channels, console outputs into snake returns
//                1-6 (outFan), and speaker lines on their numbered out ports
//                (outPatch). Used by Patch the System and every practice rep.
// Ids renumbered 2026-06-10 and again 2026-06-11 (Patch the System became
// lesson 1), both pre-launch. After launch the append-only rule is absolute.

// --- Adaptive-hint helper --------------------------------------------------
// Each lesson can define hints: [{ text, done(ctx) }]. The brief shows only the
// steps not yet done, one more per click, so a hint never points at something
// the engineer already handled. ctx carries the live state, audio, and the same
// status objects the OBJECTIVE checklist reads, so a hint clears exactly when
// its step actually gets done. hintReaches mirrors the checklist's level read.
function hintReaches(ctx, src, dest, min) {
  var a = ctx && ctx.audio;
  if (!a || !a.contributions) return false;
  var c = a.contributions[src];
  if (!c) return false;
  var lvl = dest === 'pa' ? Math.max(c.pa_l || 0, c.pa_r || 0) : (c[dest] || 0);
  return lvl >= (min == null ? 0.3 : min);
}

window.LEVELS = [
  {
    id: 1,
    title: 'Patch the System',
    // THE FIRST LESSON (Kyle, 2026-06-11): before anything gets powered on,
    // the system gets CONNECTED, per paperwork (the Input List in the top
    // bar), the way a pro does it. A BIDIRECTIONAL snake: the send side rides
    // input channels 1-4, the return side its OWN channels 1-6, each numbered
    // and colored from 1 (1 brown, 2 red, 3 orange, 4 yellow, 5 green, 6 blue).
    // Four drag-and-drop jobs, all with the power off:
    //   1. INPUTS - each source's cable into its numbered stage-box port.
    //   2. INPUT TAILS - the FOH fan-out tails 1-4 onto their console
    //      channels, matched by color.
    //   3. RETURN TAILS - the console outputs into snake returns 1-6 at FOH
    //      (MAIN L -> 1, MAIN R -> 2, AUX 1 -> 3, AUX 2 -> 4, AUX 3 -> 5, AUX 4 -> 6).
    //   4. SPEAKER LINES - each speaker's line into its numbered out port
    //      at the stage box (PA L <- 5, PA R <- 6, W1 <- 7, W2 <- 8).
    // EVERYTHING starts disconnected (a brand-new system is unconnected,
    // never crosspatched). Win = requirePatch (four identity checks); no
    // signal conditions. The rig stays off the whole time. The next lesson
    // begins "everything is connected" — this is where that becomes true.
    task: true,
    requirePatch: true,
    involves: [],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'Connect the whole system from the paperwork, with everything still powered off. Open the Input List in the top bar for the plan, then patch each cable to the port it calls for.',
    hint: 'Drag a cable end and drop it on a port or an output chip. Dropping on a taken spot swaps the two cables. The colors follow the snake channel code, and each side of the snake counts from 1: 1 brown, 2 red, 3 orange, 4 yellow, 5 green, 6 blue. Patch with the power off so nothing can pop while the system is dead.',
    hints: [
      { title: 'Patch the inputs', target: null, teach: 'Patching is just following the paperwork. Open the Input List in the top bar and wire what it tells you, starting at the stage.', text: 'Inputs first: drag each source cable onto its numbered stage-box port. Drop on a taken spot to swap.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[0] && ctx.patchStatus[0].pass },
      { title: 'Land the snake at the console', target: null, teach: 'The snake carries those inputs from the stage back to you at front of house. Each tail lands on its own channel.', text: 'Drop snake tails 1-4 onto their matching console channels.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[1] && ctx.patchStatus[1].pass },
      { title: 'Send the outputs down the snake', target: null, teach: 'The same snake carries your mix back out on its own return side, counted from 1: channels 1 to 6.', text: 'Console outs into snake 1-6: L to 1, R to 2, AUX 1 to 3, AUX 2 to 4, AUX 3 to 5, AUX 4 to 6.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[2] && ctx.patchStatus[2].pass },
      { title: 'Connect the speakers', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2', 'out-wedge3', 'out-wedge4'], teach: 'Last, the speakers pick up those same return channels at the stage end. Match each speaker to the output feeding it.', text: 'Each speaker line to its out port: PA L to 1, PA R to 2, Wedge 1 to 3, Wedge 2 to 4, Wedge 3 to 5, Wedge 4 to 6.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[3] && ctx.patchStatus[3].pass },
    ],
    sabotage: (s) => {
      // Load-in state: nothing connected anywhere. Input cables loose above
      // the stage box, speaker lines loose below it, input tails coiled
      // below the fan-out (fanOut 0 = unplugged), return tails coiled next
      // to them (outFan nulls). Rig fully off, console zeroed
      // (normalizeChannels covers the channels via involves []).
      s.cables = { vocal: 0, vocal2: 0, guitar: 0, laptop: 0 };
      s.fanOut = [0, 0, 0, 0];
      s.outFan = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
      s.outPatch = { pa_l: null, pa_r: null, wedge: null, wedge2: null, wedge3: null, wedge4: null };
      s.master = { ...s.master, mute: true, fader: 0 };
      s.mixer = { on: false };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false, volume: 0 };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false, volume: 0 };
      s.outputs.wedge = { ...s.outputs.wedge, on: false, volume: 0 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false, volume: 0 };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: false, volume: 0 };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: false, volume: 0 };
      return s;
    },
    solution: 'Everything connected per the I/O list: inputs on snake 1 to 4, outputs on the return side 1 to 6, every color matched. The system is connected and still off. Next, power on.',
    defaultInspect: 'pa',
  },
  {
    id: 2,
    title: 'Power-On Sequence',
    // Pure power-on lesson on an ACTIVE-speaker rig (powered PA speakers, no
    // separate power amp). The console starts zeroed and safe: faders down,
    // every channel muted, master muted (normalizeChannels handles the
    // channels since there are no conditions; the sabotage mutes the master).
    // Everything is powered off. The win is bringing the rig up in the right
    // order, NOT sending signal (that's the next lessons). Win = console on +
    // both active PA speakers on + both wedges on, flagged by requirePowerOn
    // (topology-aware: active mode checks the PA speakers, not an amp).
    // The only hazard is the POP: turning a powered speaker or wedge on first,
    // then switching the console on, sends the console's switch-on transient
    // into a live powered box and pops the speakers (wouldPopOnMixerOn ->
    // cause 'mixer_pop'). So the rule the level teaches is: console first,
    // powered boxes last. A pop blocks the win until reset. Master stays muted,
    // so there's no blast to worry about here.
    task: true,
    requirePowerOn: true,
    // involves: [] forces normalizeChannels to mute EVERY channel with faders
    // down (the zeroed console start). Without it, deriveInvolves defaults to
    // [1] to avoid an accidentally-dead desk, which would leave channel 1 live.
    involves: [],
    symptom: 'Everything is connected and the console is zeroed: every channel is back at its starting position. Power the system up in the right order: console first, then both PA speakers and all four wedges. The wrong order pops the speakers.',
    hint: 'Power on the console first, then the powered speakers last. If you turn a PA speaker or wedge on first and then switch the console on, the console sends a pop to the speakers. So: console first, then the wedges and the PA speakers.',
    hints: [
      { title: 'Console on first', target: 'mixer-power', teach: 'Power up from the source outward. The console goes on first, so its switch-on thump has no live speaker to play it.', text: 'Turn the console on first.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.console },
      { title: 'Then the speakers', target: null, teach: 'With the console already on and settled, the speakers come up last. Nothing pops, because the thump already passed.', text: 'Now bring up the rest: both PA speakers and all four wedges.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.paStage && ctx.powerStatus.wedges },
    ],
    conditions: [],
    // Active speakers: powered PA boxes with their own on/off, no power amp.
    topology: { paRig: 'powered' },
    sabotage: (s) => {
      // Zeroed, safe console between shows: channels already muted with faders
      // down (normalizeChannels, no conditions). Mute the master too, then
      // power off everything with a switch: both active PA speakers and both
      // wedges. The only task left is the power-on order.
      s.master = { ...s.master, mute: true, fader: 0 };
      s.mixer = { on: false };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false };
      s.outputs.wedge = { ...s.outputs.wedge, on: false };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: false };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: false };
      return s;
    },
    solution: 'Turn the console on first, then the wedges and the two PA speakers.',
    defaultInspect: 'pa',
  },
  {
    id: 3,
    title: 'Set the Input Level',
    // Step 1 of the real-show setup, picking up exactly where Power-On left
    // off: the rig is on but the console is fully zeroed (every channel muted,
    // faders all the way down, master muted AND its fader at 0, playback gain
    // all the way down). The student PFLs the playback, sets the input GAIN
    // healthy, unmutes and brings the channel + master to unity, THEN sets how
    // loud the room is with the PA speaker volume (the SPL beat lives here now).
    // requirePflCheck = the PFL workflow happened; gainStructure.inputBand =
    // input sits healthy; unity checks require unmuted + at unity; the PA
    // corridor (0.30-0.65 ~= 86-92 dB SPL, a sane small-club show level) is the
    // room level set with the speaker volume, shown as a green target band on
    // the loudness meter. involves: [7] keeps the playback channel live, mutes the mics.
    task: true,
    involves: [7],
    requirePflCheck: true,
    // inputBand = the healthy AVERAGE window on the real-units meter: -21 to
    // -15 dBFS (about -18 average, the digital-console standard), in the
    // engine's nominal-anchored linear values.
    gainStructure: { refChannel: 7, unity: 0.75, faderTol: 0.06, inputBand: [0.575, 1.148] },
    conditions: [
      { source: 'playback', dest: 'pa', min: 0.30, max: 0.65 },
    ],
    symptom: 'The system is on and the console is fully zeroed, with your playback connected. Set your gain structure start to finish: check it in PFL, set the gain, bring the faders to unity, then set the room level with the PA until the loudness meter sits in the green target band.',
    hint: 'Press PFL on the playback to hear it in your headphones. Set the GAIN so the meter sits in the healthy zone. Release PFL, unmute the playback and the master, and bring both faders up to unity. Then bring up the PA speaker volume until the loudness meter reaches the green target band. A live show is louder than the all-day-safe line, so that band sits in the amber part of the meter on purpose.',
    hints: [
      { title: 'Check it in PFL', target: 'ch7-pfl', teach: 'PFL lets you hear and meter a channel in your headphones before the room does. Always set a level in PFL first.', text: 'PFL the playback so you can set it in your headphones first.', done: (ctx) => ctx.pflChecked || (ctx.state.channels[6] && ctx.state.channels[6].solo) },
      { title: 'Set the gain', target: 'ch7-gain', teach: 'Gain sets how hard the source hits the console. You want it strong on the meter with a little room to spare, set by the meter, not by ear.', text: 'Set the GAIN so the input meter sits in the healthy zone.', done: (ctx) => ctx.gainStatus && ctx.gainStatus.input },
      { title: 'Faders to unity', target: ['ch7-fader', 'master-fader'], teach: 'With the gain set, the channel and master faders live at unity, the U mark. That is where they are built to run.', text: 'Release PFL, unmute the playback and the master, and bring both faders up to unity.', done: (ctx) => ctx.gainStatus && ctx.gainStatus.fader && ctx.gainStatus.master },
      { title: 'Set the room level', target: ['out-pa-l', 'out-pa-r'], teach: 'Gain and faders are set, so set the room volume with the PA, not by pushing a fader. A show sits above the all-day-safe line by nature, so aim for the green target band on the loudness meter, not the quietest reading.', text: 'Bring the PA volume up until the loudness meter sits in the green target band.', done: (ctx) => { var c = ctx.audio && ctx.audio.contributions && ctx.audio.contributions.playback; if (!c) return false; var l = Math.max(c.pa_l || 0, c.pa_r || 0); return l >= 0.30 && l <= 0.65; } },
    ],
    sabotage: (s) => {
      // Continuous with Power-On: rig on, console fully zeroed. Channel muted,
      // fader 0, GAIN all the way down. Master muted, fader 0. PA speaker volume
      // all the way down too, since the student sets the room level here.
      s.channels[6].mute = true;
      s.channels[6].fader = 0;
      s.channels[6].gain = 0;
      s.channels[6].aux1 = 0; s.channels[6].aux2 = 0;
      s.master.mute = true; s.master.fader = 0;
      s.outputs.pa_l.volume = 0; s.outputs.pa_r.volume = 0;
      return s;
    },
    solution: 'PFL the playback, set the input gain healthy, unmute and bring the channel and master to unity, then set the PA speaker volume for a good room level.',
    defaultInspect: 'pa',
  },
  {
    id: 4,
    title: 'Test the Wedges',
    // The monitor wedges, on their own. The PA was already set in Set the Input
    // Level, so we don't re-check it here. This introduces the wedges and which
    // aux feeds which: AUX 1 -> Wedge 1 through AUX 4 -> Wedge 4. The student sends
    // the reference out each aux and brings up each wedge volume until it plays.
    // verifyEach latches each wedge once it gets signal. The PA, gain and faders
    // stay as set in Level 2. The wedge volumes the student sets here are kept
    // for the rest of the build (Levels 4-7 start with them up).
    task: true,
    involves: [7],
    verifyEach: [
      { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 plays' },
      { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 plays' },
      { source: 'playback', dest: 'wedge3', min: 0.25, label: 'Wedge 3 plays' },
      { source: 'playback', dest: 'wedge4', min: 0.25, label: 'Wedge 4 plays' },
    ],
    conditions: [],
    symptom: 'The PA is set. Now bring up all four monitor wedges. AUX 1 feeds Wedge 1, AUX 2 Wedge 2, AUX 3 Wedge 3, AUX 4 Wedge 4. Each wedge checks off once it plays and stays checked.',
    hint: 'Turn up each AUX send on the playback channel and bring up that wedge on stage until it plays: AUX 1 for Wedge 1, AUX 2 for Wedge 2, AUX 3 for Wedge 3, AUX 4 for Wedge 4.',
    hints: [
      { title: 'Wedge 1', target: 'ch7-aux', teach: 'A wedge only plays what you send it. AUX 1 is the feed to Wedge 1, and the wedge has its own volume on stage.', text: 'Wedge 1: turn up AUX 1 on the playback, then raise the Wedge 1 volume until it plays.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.wedge },
      { title: 'Wedge 2', target: 'ch7-aux', teach: 'Same idea on the next monitor: AUX 2 feeds Wedge 2.', text: 'Wedge 2: AUX 2 on the playback, then raise the Wedge 2 volume.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.wedge2 },
      { title: 'Wedge 3', target: 'ch7-aux', teach: 'AUX 3 feeds Wedge 3, the bass wedge.', text: 'Wedge 3: AUX 3 on the playback, then raise the Wedge 3 volume.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.wedge3 },
      { title: 'Wedge 4', target: 'ch7-aux', teach: 'AUX 4 feeds Wedge 4, the keys wedge.', text: 'Wedge 4: AUX 4 on the playback, then raise the Wedge 4 volume.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.wedge4 },
    ],
    sabotage: (s) => {
      // Carried from Set the Input Level: good input, faders at unity, PA set.
      // The wedges are not up yet: sends closed, wedge volumes down. Playback is
      // a hot line source, so its healthy gain sits low on the knob (~0.20).
      s.channels[6].mute = false;
      s.channels[6].gain = window.HEALTHY_GAIN_BY_CH[6];
      s.channels[6].fader = 0.75;
      s.channels[6].aux1 = 0; s.channels[6].aux2 = 0; s.channels[6].aux3 = 0; s.channels[6].aux4 = 0;
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0; s.outputs.wedge2.mute = false;
      s.outputs.wedge3.on = true; s.outputs.wedge3.volume = 0; s.outputs.wedge3.mute = false;
      s.outputs.wedge4.on = true; s.outputs.wedge4.volume = 0; s.outputs.wedge4.mute = false;
      return s;
    },
    solution: 'Open AUX 1 through AUX 4 on the playback and bring up each wedge volume on stage until all four play.',
    defaultInspect: 'wedge',
  },
  {
    id: 5,
    title: 'Mic Inputs',
    // First real inputs after the system is up: the two vocal mics. Teaches the
    // dynamic-vs-condenser difference. Vocal Mic 1 (ch1) is a DYNAMIC: no power
    // needed, just set the gain and bring it up. Vocal Mic 2 (ch2) is a
    // CONDENSER: dead until +48V phantom is on. Both start muted with the gain
    // pulled low, so the student sets each gain, turns +48V on for the
    // condenser (safely, while muted), and brings both up. The condenser's PA
    // condition can't pass without phantom, so the difference is the lesson.
    // deriveInvolves maps the conditions to channels 1 and 2; the rest mute.
    task: true,
    requirePflEach: [1, 2],
    conditions: [
      { source: 'vocal',  dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'pa', min: 0.3 },
    ],
    symptom: 'The system is up. Bring in your vocal mics: a dynamic on channel 1 and a condenser on channel 2. PFL each one to check it in your headphones, set its gain, then bring it up. One of them needs power.',
    hint: 'PFL each mic to check it in your headphones, set its gain, then bring it up. The dynamic on channel 1 needs no power. The condenser on channel 2 needs +48V phantom. Turn +48V on while the channel is muted and NOT in PFL, then PFL to check it: turning +48V on while you are listening in PFL pops your headphones.',
    hints: [
      { title: 'Channel 1: the dynamic', target: 'ch1-strip', teach: 'A dynamic mic needs no power, so it is the simple one. Same routine as the playback: check, set, bring up.', text: 'Channel 1 (dynamic, no power): PFL it, set the gain, unmute, and bring it up.', done: (ctx) => hintReaches(ctx, 'vocal', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[1] },
      { title: 'Power the condenser', target: 'ch2-phantom', teach: 'A condenser mic needs +48V phantom power to work. Switch it on while the channel is muted so the turn-on thump never reaches the speakers.', text: 'Channel 2 is a condenser: it needs +48V phantom. Switch it on while muted.', done: (ctx) => ctx.state.channels[1] && ctx.state.channels[1].phantom },
      { title: 'Bring up channel 2', target: 'ch2-strip', teach: 'With phantom on, the condenser behaves like any other channel. Check it, set the gain, bring it up.', text: 'Then check channel 2 in PFL, set its gain, and bring it up.', done: (ctx) => hintReaches(ctx, 'vocal2', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[2] },
    ],
    sabotage: (s) => {
      // System set up (master at unity, PA at a good level, wedges still up from
      // Test the Wedges). The two vocal channels start muted, faders down, gain
      // low. The condenser's phantom is off so the student has to know it needs
      // +48V. PFL each channel to check it before bringing it up.
      s.channels[0].mute = true; s.channels[0].fader = 0; s.channels[0].gain = window.HEALTHY_GAIN_BY_CH[0] * 0.5; s.channels[0].phantom = false;
      s.channels[1].mute = true; s.channels[1].fader = 0; s.channels[1].gain = window.HEALTHY_GAIN_BY_CH[1] * 0.5; s.channels[1].phantom = false;
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      return s;
    },
    solution: 'PFL each mic, set its gain, and bring it up. The condenser on channel 2 needs +48V phantom (turn it on while muted); the dynamic on channel 1 does not.',
    defaultInspect: 'pa',
  },
  {
    id: 6,
    title: 'DI Boxes',
    // The instrument inputs, and the active-vs-passive DI difference. Bass DI
    // (ch3, guitar source, diActive) is ACTIVE: electronics inside need +48V
    // phantom, same as a condenser, dead without it. Keyboard DI (ch4, laptop)
    // is PASSIVE: no power. Both start muted, low gain; the student PFLs each,
    // sets the gain, turns +48V on for the active DI (while muted), brings both
    // up. The active DI's PA condition can't pass without phantom. The mics
    // from the previous level stay set the way they were but muted (audio off)
    // so the build carries forward. Source cards label Active/Passive DI.
    task: true,
    requirePflEach: [3, 4],
    conditions: [
      { source: 'guitar', dest: 'pa', min: 0.3 },
      { source: 'laptop', dest: 'pa', min: 0.3 },
    ],
    symptom: 'Now the instruments. Set up both direct boxes: an active DI on the bass (channel 3) and a passive DI on the keyboard (channel 4). PFL each, set its gain, then bring it up. One of them needs power.',
    hint: 'PFL each DI to check it, set its gain, then bring it up. The active DI on the bass (channel 3) has electronics that need +48V phantom, just like a condenser: turn +48V on while the channel is muted and NOT in PFL (it pops your headphones if you do it while listening in PFL). The passive DI on the keyboard (channel 4) needs no power.',
    hints: [
      { title: 'Power the active DI', target: 'ch3-phantom', teach: 'The bass runs through an active DI, which has electronics inside that need +48V, just like a condenser. Switch it on while the channel is muted.', text: 'Channel 3 (active DI on bass) needs +48V phantom. Switch it on while muted.', done: (ctx) => ctx.state.channels[2] && ctx.state.channels[2].phantom },
      { title: 'Bring up the bass', target: 'ch3-strip', teach: 'Phantom on, now treat it like any input: check it, set the gain, bring it up.', text: 'Then check channel 3 in PFL, set its gain, and bring it up.', done: (ctx) => hintReaches(ctx, 'guitar', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[3] },
      { title: 'Bring up the keys', target: 'ch4-strip', teach: 'The keyboard runs through a passive DI, which needs no power. The simplest input on the board.', text: 'Channel 4 (passive DI on keys, no power): PFL it, set the gain, bring it up.', done: (ctx) => hintReaches(ctx, 'laptop', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[4] },
    ],
    sabotage: (s) => {
      // Mics from the last level kept as set (their per-source healthy gain),
      // but muted so the audio stops.
      s.channels[0].mute = true; s.channels[0].fader = 0.72; s.channels[0].gain = window.HEALTHY_GAIN_BY_CH[0]; s.channels[0].phantom = false;
      s.channels[1].mute = true; s.channels[1].fader = 0.72; s.channels[1].gain = window.HEALTHY_GAIN_BY_CH[1]; s.channels[1].phantom = true;
      // Both DI channels start muted, faders down, gain low (half of healthy) so
      // the student sets each by the meter: the passive bass needs a lot of gain
      // (its healthy spot is high on the knob), the keys very little. The active
      // DI (bass, ch3) has phantom off so the student has to power it.
      s.channels[2].mute = true; s.channels[2].fader = 0; s.channels[2].gain = window.HEALTHY_GAIN_BY_CH[2] * 0.5; s.channels[2].phantom = false;
      s.channels[3].mute = true; s.channels[3].fader = 0; s.channels[3].gain = window.HEALTHY_GAIN_BY_CH[3] * 0.5; s.channels[3].phantom = false;
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      return s;
    },
    solution: 'PFL each DI, set its gain, and bring it up. The active DI on the bass (channel 3) needs +48V phantom (turn it on while muted); the passive DI on the keyboard (channel 4) does not.',
    defaultInspect: 'pa',
  },
  {
    id: 7,
    title: 'Monitor Mix',
    task: true,
    // A positive setup task, not a problem: build the singer her monitor mix.
    // The wedge volume is already up (set in Test the Wedges and kept), so this
    // is purely the aux send: open AUX 1 on the vocal to feed her wedge.
    symptom: 'Send Vocal 1 to Wedge 1.',
    hint: 'Wedge 1 is on and turned up. Turn up AUX 1 on the Vocal 1 channel to send it there.',
    hints: [
      { title: 'Send Vocal 1 to Wedge 1', target: 'ch1-aux', teach: 'A wedge is a separate mix from the room. AUX 1 feeds Wedge 1 and does not touch the PA.', text: 'Turn up AUX 1 on the Vocal 1 channel to send it to Wedge 1.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.35) },
    ],
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.35 },
    ],
    sabotage: (s) => {
      // System set up: vocal live in the PA, wedge up (kept from Test the
      // Wedges). The vocal just isn't in the monitor yet (aux sends closed).
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      s.channels.forEach(c => c.aux1 = 0);
      return s;
    },
    solution: 'AUX 1 up on the Vocal 1 channel sends it to Wedge 1.',
    defaultInspect: 'wedge',
  },
  {
    id: 8,
    title: 'Feedback Awareness',
    task: true,
    // Does NOT start ringing. The singer has a little of herself in the wedge
    // (aux 1 low) and asks for more. As the student turns AUX 1 up to give her
    // more, the loop gain crosses the ring threshold and the wedge starts to
    // feed back. To win, the student needs the vocal LOUD in the wedge
    // (>= 0.8, about 1.2 dB PAST the ring point under the real-dB loop) AND
    // no feedback, so pulling the send back down won't do it.
    // For now HPF clears it (drops the low-end loop gain ~40% while the wedge
    // level stays up). NEXT TURN: add an EQ on the aux outputs as the real,
    // surgical fix; HPF is the stopgap so the level is solvable today.
    symptom: 'Turn Vocal 1 up in Wedge 1. Push it to a strong level and the wedge starts to ring: that is feedback. Get the level up and ring the feedback out on the monitor EQ.',
    hint: 'Turn up AUX 1 on the Vocal 1 channel to raise it in Wedge 1. When it rings, look at the Wedge 1 monitor EQ: the ringing frequency glows. Pull that band down far enough to stop the ring. Cuts cost a little level, so keep them small.',
    hints: [
      { title: 'Raise Vocal 1 in Wedge 1', target: 'ch1-aux', teach: 'Push AUX 1 up to raise Vocal 1 in the wedge. As a wedge gets loud it can start to ring, which is the monitor feeding back on itself.', text: 'Bring AUX 1 on the Vocal 1 channel up until Wedge 1 reaches a strong level.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.8) },
      { title: 'Ring it out', target: 'out-wedge1', teach: 'Feedback rings at one frequency. On the wedge Monitor EQ that band glows. Pull just that band down a touch and the ring stops while the level stays up.', text: 'When it rings, pull the glowing band down on the Wedge 1 Monitor EQ, enough to stop it.', done: (ctx) => !ctx.feedback },
    ],
    // Wedge min 0.8 under the real-dB loop (2026-07-02): the ring point on
    // the primed wedge sits at a send of ~0.66, and 0.8 lands about 1.2 dB
    // past it, so the level she asks for genuinely cannot be reached without
    // ringing out the hot band. EQ cuts still cost level (eqLevelGain), so
    // the cut eats a little of the send — exactly like a real desk.
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.8 },
    ],
    sabotage: (s) => {
      // Vocal live in the PA. Her wedge has been pushed up all night (volume
      // cranked, kept), with a little vocal in it but not enough. Pushing AUX 1
      // up to give her what she wants crosses into feedback. Her wedge rings at
      // its resonant band (wedge.ringBand, mid-high); HPF won't fix that, so the
      // student has to ring it out on the monitor EQ. Wedge volume kept with
      // headroom so the loud send doesn't clip while she's still ringing.
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.7; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      s.channels[0].aux1 = 0.2;
      s.channels[0].highpass = false;
      return s;
    },
    solution: 'Turn Vocal 1 up in Wedge 1, then ring it out: pull the glowing band down on the monitor EQ to cut the ringing frequency.',
    defaultInspect: 'wedge',
  },
  {
    id: 9,
    title: 'The Gig',
    // FINAL EXAM. Everything from Levels 1-7 performed start to finish from a
    // cold venue, with no new skills. The objective version of soundcheck:
    // prove every speaker passes signal, then line-check every input. Nobody
    // judges the blend, the student proves every
    // signal arrives clean. Win = power-on order (requirePowerOn) + every
    // speaker TESTED with playback (verifyEach latches each one, exactly like
    // Test the Wedges — playback is a checking tool, so it can and should be
    // pulled back down once the speakers are proven) + every input PFL'd
    // (requirePflEach 1-5) + the band present in the PA + the singer's wedge,
    // all with no pop / clip / ring (built-in gates). gainStructure here has
    // NO refChannel: master-only unity check, because playback ends the level
    // turned down. The band mins are 0.25, reachable with faders at unity and
    // a healthy gain: the mix bus power-sums (uncorrelated sources add as
    // sqrt of sum of squares, like a real console), so all five channels at
    // unity with healthy gain sit well under the clip threshold.
    task: true,
    requirePowerOn: true,
    requirePflEach: [1, 2, 3, 4, 7],
    gainStructure: { unity: 0.75, faderTol: 0.06 },
    involves: [1, 2, 3, 4, 7],
    verifyEach: [
      { source: 'playback', dest: 'pa',     min: 0.30, label: 'PA tested with playback' },
      { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 tested with playback' },
      { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 tested with playback' },
      { source: 'playback', dest: 'wedge3', min: 0.25, label: 'Wedge 3 tested with playback' },
      { source: 'playback', dest: 'wedge4', min: 0.25, label: 'Wedge 4 tested with playback' },
    ],
    conditions: [
      { source: 'vocal',  dest: 'pa', min: 0.25 },
      { source: 'vocal2', dest: 'pa', min: 0.25 },
      { source: 'guitar', dest: 'pa', min: 0.25 },
      { source: 'laptop', dest: 'pa', min: 0.25 },
      { source: 'vocal',  dest: 'wedge', min: 0.35 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'Final exam. Nothing is powered on yet. Run the whole job in order: power on, test every speaker with playback, then bring the band in. Keep it clean the whole way.',
    hint: 'Everything you have already done, in order. Console on first, then the speakers. PFL the playback, set its gain, and send it to the PA and all four wedges: each speaker checks off once it plays and stays checked, so you can turn the playback back down afterward. Then the band: PFL each input, set its gain, and bring it up with the fader at unity. Turn on +48V for the condenser and the active DI while the channel is muted and before you PFL it. Open AUX 1 on Vocal 1 to send it to Wedge 1.',
    hints: [
      { title: 'Power up in order', target: 'mixer-power', teach: 'Same as you practiced: source outward. Console first so its thump has nowhere to go, then the speakers.', text: 'Power on in order: console first, then both PA speakers and all four wedges.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.console && ctx.powerStatus.paStage && ctx.powerStatus.wedges },
      { title: 'Prove every speaker', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2', 'out-wedge3', 'out-wedge4'], teach: 'Before a single mic matters, send playback to each speaker and confirm it plays. Catch a dead box now, not during the first song.', text: 'Test every speaker with playback: send it to the PA and all four wedges.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.pa && ctx.verifyStatus.wedge && ctx.verifyStatus.wedge2 && ctx.verifyStatus.wedge3 && ctx.verifyStatus.wedge4 },
      { title: 'Power what needs it', target: ['ch2-phantom', 'ch3-phantom'], teach: 'The condenser and the active DI both need +48V. Switch them on while their channels are muted.', text: 'Turn +48V on (while muted) for the condenser (ch 2) and active DI (ch 3).', done: (ctx) => ctx.state.channels[1] && ctx.state.channels[1].phantom && ctx.state.channels[2] && ctx.state.channels[2].phantom },
      { title: 'Check every input', target: null, teach: 'Walk the band one channel at a time. PFL each input and meter it before you ever bring it into the room.', text: 'Check every input in PFL before you bring it up: the four band channels and the playback.', done: (ctx) => ctx.pflChannels && [1, 2, 3, 4, 7].every((ch) => ctx.pflChannels[ch]) },
      { title: 'Bring the band up', target: null, teach: 'Now open them into the room, faders at unity, levels already set with the gain. The whole band, clean in the PA.', text: 'Bring the band up clean, faders at unity: vocals, bass, and keys in the PA.', done: (ctx) => hintReaches(ctx, 'vocal', 'pa', 0.25) && hintReaches(ctx, 'vocal2', 'pa', 0.25) && hintReaches(ctx, 'guitar', 'pa', 0.25) && hintReaches(ctx, 'laptop', 'pa', 0.25) },
      { title: 'Send Vocal 1 to Wedge 1', target: 'ch1-aux', teach: 'Last step: Vocal 1 needs to be in Wedge 1. Open AUX 1 on Vocal 1 and the show is ready.', text: 'Send Vocal 1 to Wedge 1: open AUX 1 on the Vocal 1 channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.35) },
    ],
    sabotage: (s) => {
      // Cold venue. Everything off, console zeroed, nothing set.
      s.mixer = { on: false };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false, volume: 0, mute: false };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false, volume: 0, mute: false };
      s.outputs.wedge = { ...s.outputs.wedge, on: false, volume: 0, mute: false };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false, volume: 0, mute: false };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: false, volume: 0, mute: false };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: false, volume: 0, mute: false };
      s.master = { ...s.master, mute: true, fader: 0 };
      for (let i = 0; i < s.channels.length; i++) {
        s.channels[i].mute = true;
        s.channels[i].fader = 0;
        // Playback out (the FOH stereo line is unused in the gig); every input
        // starts at half its per-source healthy gain, so the student sets each by
        // the meter from a weak-but-present start (no channel reads hot to begin).
        s.channels[i].gain = s.channels[i].stereo ? 0 : window.HEALTHY_GAIN_BY_CH[i] * 0.5;
        s.channels[i].phantom = false;
        s.channels[i].aux1 = 0;
        s.channels[i].aux2 = 0;
        s.channels[i].aux3 = 0;
        s.channels[i].aux4 = 0;
      }
      return s;
    },
    solution: 'The whole setup, start to finish: power in order, every speaker proven with playback, every input line checked in PFL and brought up clean, and Vocal 1 in Wedge 1.',
    defaultInspect: 'pa',
  },
  {
    id: 10,
    title: 'Power-Down',
    // The bookend, in two beats. Beat 1: ZERO THE CONSOLE (requireZeroed) —
    // every strip back to default: gain, aux sends and fader down, muted, pan
    // centered, HPF off, +48V off, master down AND muted. The next engineer
    // powers on into a predictable desk. Beat 2: POWER OFF in reverse order
    // (requirePowerOff): speakers off FIRST, console off LAST. Turning the
    // console off while a powered speaker is still live plays the console's
    // power-off transient through it (cause 'mixer_off_pop' — same physics
    // as the Level 1 pop, opposite direction). Start state is the end of the
    // night: the band's inputs still live at modest show levels (main bus is
    // clean), with the kind of leftovers a real show leaves behind — pans
    // pushed off center on the DIs, HPF still in on the vocal, +48V on the
    // powered inputs.
    task: true,
    requirePowerOff: true,
    requireZeroed: true,
    involves: [1, 2, 3, 4],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'Zero the console back to default, then shut down in reverse order: speakers and wedges off first, console off last.',
    hint: 'Work down each strip: gain down, aux sends down, HPF off, +48V off, pan back to center, fader down, mute on. Then the master: all the way down and muted. Power-off is power-on in reverse: the speakers go off first and the console goes off last. A console makes a pop when it switches off, and any powered speaker still on will play that pop.',
    hints: [
      { title: 'Zero the console', target: null, teach: 'You leave the desk the way you would want to find it. Every control back to its resting place so the next power-up is predictable.', text: 'Zero the console: gains, sends, faders down; mute; pans centered; HPF and +48V off.', done: (ctx) => ctx.zeroStatus && ctx.zeroStatus.slice(0, 7).every((z) => z.pass) },
      { title: 'Drop the master', target: 'master-fader', teach: 'The main output comes all the way down and muted, so nothing can sneak out while you shut the rest down.', text: 'Then the master: all the way down and muted.', done: (ctx) => ctx.zeroStatus && ctx.zeroStatus[7] && ctx.zeroStatus[7].pass },
      { title: 'Speakers off first', target: null, teach: 'Power-down is power-up in reverse. The speakers go off first so they are dead before the console makes its switch-off thump.', text: 'Power off in reverse: PA speakers and wedges off first.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.paOff && ctx.powerStatus.wedgesOff },
      { title: 'Console off last', target: 'mixer-power', teach: 'With every speaker already dead, the console goes off last and its thump plays to nobody.', text: 'Console off last (it pops on shutoff, and a live speaker would play it).', done: (ctx) => ctx.powerStatus && !ctx.powerStatus.console },
    ],
    sabotage: (s) => {
      // End-of-night state: a clean live mix (every input at its per-source
      // healthy gain, faders modest), with realistic show leftovers for the
      // zero-out: off-center pans on the DIs, HPF in on the vocal, phantom on
      // the condenser + active DI.
      s.channels[0].mute = false; s.channels[0].fader = 0.55; s.channels[0].gain = window.HEALTHY_GAIN_BY_CH[0]; s.channels[0].phantom = false; s.channels[0].aux1 = 0.45; s.channels[0].aux2 = 0; s.channels[0].highpass = true;
      s.channels[1].mute = false; s.channels[1].fader = 0.55; s.channels[1].gain = window.HEALTHY_GAIN_BY_CH[1]; s.channels[1].phantom = true;  s.channels[1].aux1 = 0;    s.channels[1].aux2 = 0;
      s.channels[2].mute = false; s.channels[2].fader = 0.4;  s.channels[2].gain = window.HEALTHY_GAIN_BY_CH[2]; s.channels[2].phantom = true;  s.channels[2].aux1 = 0;    s.channels[2].aux2 = 0; s.channels[2].pan = 0.3;
      s.channels[3].mute = false; s.channels[3].fader = 0.4;  s.channels[3].gain = window.HEALTHY_GAIN_BY_CH[3]; s.channels[3].phantom = false; s.channels[3].aux1 = 0;    s.channels[3].aux2 = 0; s.channels[3].pan = 0.7;
      s.channels[6].mute = true;  s.channels[6].fader = 0;    s.channels[6].gain = 0;   s.channels[6].aux1 = 0;        s.channels[6].aux2 = 0;
      s.master = { ...s.master, mute: false, fader: 0.75 };
      s.mixer = { on: true };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: true, volume: 0.6, mute: false };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: true, volume: 0.6, mute: false };
      s.outputs.wedge = { ...s.outputs.wedge, on: true, volume: 0.6, mute: false };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: true, volume: 0.6, mute: false };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: true, volume: 0.6, mute: false };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: true, volume: 0.6, mute: false };
      return s;
    },
    solution: 'Console zeroed, master down and muted, speakers off, console off last. The next engineer powers on into a predictable console.',
    defaultInspect: 'pa',
  },
];

// PRACTICE MODE — the paid tier. One endless scenario instead of a fixed
// challenge list: every rep starts with the band up and playing, then breaks
// 1-3 things (the FAULTS selector in the top bar) drawn at random from the
// fault pool below. The student finds and fixes them. The fault placement is
// seeded per rep, so Reset replays the same rep and the next rep is always
// new. Locked on the free tier; ?tier=member unlocks it.
//
// This is the sustainability model: a new training rep costs zero authoring
// time. Growing the product = adding entries to PRACTICE_FAULTS (data-only,
// edit this file and deploy) or new fault physics (quarterly engine work —
// hum + ground lift, cable crackle, and friends land here as new pool
// entries when their engine support exists).
//
// Presentation (handled by the app, not by fields here):
//   - Symptom only; the hint hides behind a "Need a hint?" button.
//   - The solve shows a DEBRIEF (moves vs par, hints, rep count), never an
//     answer key.
//   - The app sets window.PRACTICE_FAULT_COUNT from the FAULTS selector
//     before calling sabotage, and reads window.PRACTICE_LAST (par + fault
//     keys for the debrief) after.
//
// The shared start state is bandUp(): the four band inputs live at healthy
// show levels, playback muted, master at unity, PA + wedges up. Conditions
// cover every source on BOTH sides of the PA, so the win is generic no
// matter what the rng broke — and a hard-panned or one-sided fault can't
// slip through.
//
// Numbers (real-units engine): each source at its PER-SOURCE healthy gain
// (HEALTHY_GAIN_BY_CH: bass ~0.77, keys ~0.23, mics ~0.42-0.48) -> chanIn 0.81
// (+4 dBu, -18 dBFS) on every channel, fader 0.6 (-5.8 dB) -> post 0.415,
// master at unity, PA trim 0.6 (-6 dB) -> per-source, per-side PA contribution
// 0.27 (conditions min 0.2 with margin); the main bus power-sums to about
// 0 dBu, 22 dB under the clip. Same meters as the old uniform-0.42 board — the
// gain KNOBS now sit at realistic per-source spots.
// ---- Board descriptor. Which channels are real inputs, on the MX-8 OR the
// 16-channel board, derived from state so ONE fault engine serves both. For the
// MX-8 these reproduce the old hardcoded values exactly (inputs 0-3, powered
// 1-2, playback ch6); on the 16-channel board they expand to all 14 inputs.
function pbInputs(s) {
  const out = [];
  for (let i = 0; i < s.channels.length; i++) {
    if (s.channels[i].stereo) continue;                                 // the playback strip
    if (window.sourceFor && window.sourceFor(s, i)) out.push(i);        // patched to a real source
  }
  return out;
}
function pbSources(s) { return pbInputs(s).map((i) => window.sourceFor(s, i)); }
function pbPowered(s) { return pbInputs(s).filter((i) => { const d = window.SOURCES[window.sourceFor(s, i)]; return d && (d.kind === 'condenser' || d.diActive); }); }
function pbMics(s) { return pbInputs(s).filter((i) => { const d = window.SOURCES[window.sourceFor(s, i)]; return d && (d.kind === 'dynamic' || d.kind === 'condenser'); }); }
function pbPlayback(s) { return s.channels.findIndex((c) => c.stereo); }
function pbPick(arr, rng) { return arr.length ? arr[Math.floor((rng ? rng() : 0) * arr.length)] : -1; }

// Healthy 16-channel start: every one of the 14 inputs up at its per-source
// nominal gain, playback muted, PA and wedges on. Mirrors the MX-8 bandUp.
function bandUp16(s) {
  for (const i of pbInputs(s)) {
    const c = s.channels[i];
    const d = window.SOURCES[window.sourceFor(s, i)];
    c.mute = false;
    c.fader = 0.6;
    c.gain = window.healthyGain(d ? d.dbu : null);
    c.phantom = !!(d && (d.kind === 'condenser' || d.diActive));
  }
  const pb = pbPlayback(s);
  if (pb >= 0) { s.channels[pb].mute = true; s.channels[pb].fader = 0; s.channels[pb].gain = 0; }
  s.master.mute = false; s.master.fader = 0.75;
  ['pa_l', 'pa_r', 'wedge', 'wedge2', 'wedge3', 'wedge4'].forEach((k) => {
    if (s.outputs[k]) { s.outputs[k].on = true; s.outputs[k].mute = false; s.outputs[k].volume = 0.6; }
  });
  return s;
}

function bandUp(s) {
  if (s.big16) return bandUp16(s);
  for (let i = 0; i < 4; i++) {
    s.channels[i].mute = false;
    s.channels[i].fader = 0.6;
    s.channels[i].gain = window.HEALTHY_GAIN_BY_CH[i]; // per-source healthy input: every channel nominal, ~0.81 baseline
    // Condenser (ch2) and active DI (ch3) need +48V to pass signal.
    s.channels[i].phantom = (i === 1 || i === 2);
  }
  s.channels[6].mute = true; s.channels[6].fader = 0; s.channels[6].gain = 0;
  s.master.mute = false; s.master.fader = 0.75;
  s.outputs.pa_l.on = true; s.outputs.pa_l.mute = false; s.outputs.pa_l.volume = 0.6;
  s.outputs.pa_r.on = true; s.outputs.pa_r.mute = false; s.outputs.pa_r.volume = 0.6;
  s.outputs.wedge.on = true; s.outputs.wedge.mute = false; s.outputs.wedge.volume = 0.6;
  s.outputs.wedge2.on = true; s.outputs.wedge2.mute = false; s.outputs.wedge2.volume = 0.6;
  return s;
}
const BAND_SOURCES = ['vocal', 'vocal2', 'guitar', 'laptop'];
// 0-based indexes of the band channels that need +48V: ch2 condenser, ch3
// active DI. The phantom fault can only land where phantom matters.
const POWERED_IDX = [1, 2];

// A live mic amplified on a channel gained for a DI feeds back through the PA.
// The bass channel is the only one gained hot enough to do it (its healthy gain
// is the highest), so a crosspatch must never leave a mic there or the rep opens
// howling and the app misreads the PA feedback as a wedge ring (Kyle 2026-07-06:
// "starts with howling feedback, but the problem is actually a crosspatch"). A
// DI landing on a hot channel just runs hot, which reads on the correct channel
// and is fine. These helpers let the crosspatch faults reject the mic-on-hot
// swaps and keep the rest.
const MIC_SOURCES = ['vocal', 'vocal2'];
function hotMicChannel() {
  const g = (window.HEALTHY_GAIN_BY_CH || []).slice(0, 4);
  if (!g.length) return 2;
  let hi = 0; for (let i = 1; i < g.length; i++) if (g[i] > g[hi]) hi = i;
  return hi;
}
// Channel index a source currently lands on: source -> its cable's port ->
// the channel that port feeds (fanOut). Reflects whatever cables/fanOut hold now.
function sourceChannel(s, src) { return s.fanOut[s.cables[src] - 1] - 1; }
// A crosspatch swap to reject: it would either howl (a live mic on the hot
// channel) or scream (a very low-gain source slammed onto a much hotter channel,
// e.g. the keyboard on the bass channel, which opens at ~117 dB and reads as a
// distortion fault, not a crosspatch). A MODERATE hot channel is left alone: a
// crosspatch really does mis-gain a channel, and that clue reads on the correct
// channel and clears when you re-patch (Kyle 2026-07-06: no feedback, stay
// realistic). The 6.0 ceiling is well above the deliberate 'gain too hot' fault
// (~3.6) so ordinary hot channels pass; only the absurd overloads are rejected.
function crosspatchBad(s) {
  const hot = hotMicChannel();
  if (MIC_SOURCES.some((m) => sourceChannel(s, m) === hot)) return true;
  const a = window.computeAudio ? window.computeAudio(s) : null;
  if (a && a.chanInBaseline) {
    for (let i = 0; i < 4; i++) { if (a.chanInBaseline[i] > 6) return true; }
  }
  return false;
}

// The fault pool. Each entry is ONE thing that can go wrong, applied on top
// of the bandUp() start state. `apply` places the fault with the seeded rng.
// `par` is the move count of the systematic fix — inspecting and listening
// are free, so a one-knob fix is par 1; a safe replug or a safe +48V fix is
// mute -> fix -> unmute, par 3 (plugging into a live channel, or switching
// +48V on one, pops the system).
//
// `weight` (default 1) makes a fault appear more often. Feedback carries
// weight 2 per Kyle (2026-06-11): mic feedback is the live-sound problem,
// so it shows up in a bigger share of reps.
//
// `apply` may RETURN { conditions: [...] } to attach extra win conditions to
// the rep — the feedback fault uses this to require the singer's monitor to
// STAY UP, so pulling the send to zero isn't a fix; ringing the wedge out on
// its EQ band is.
window.PRACTICE_FAULTS = [
  { key: 'cable',        label: 'Cable unplugged',   blurb: "A channel's input cable is unplugged.",                  par: 3, apply: (s, rng) => { const src = pbPick(pbSources(s), rng); if (src) s.cables[src] = 0; } },
  { key: 'gain',         label: 'Gain at zero',      blurb: "A channel's gain is at zero, so its meter never moves.",  par: 1, apply: (s, rng) => { const i = pbPick(pbInputs(s), rng); if (i >= 0) s.channels[i].gain = 0; } },
  // GAIN TOO HOT — the opposite of 'gain at zero'. A channel's gain is set a few
  // dB into the red, so the preamp clips and the channel distorts even though
  // signal is flowing fine. The win engine already blocks a solve while anything
  // is in the red (the `clean` gate in the App), so this is a real diagnosis,
  // not an auto-win: the fix is to read the red meter and pull GAIN back down.
  // The gain knob is exponential (~+3 dB per 0.05), so a FIXED knob value would
  // clip wildly differently per channel; instead we offset from each channel's
  // calibrated healthy gain. +0.22 puts chanIn baseline ~3.6-3.8 on any of the
  // three candidates — solidly clipping (verified against detectClipping,
  // including the condenser on ch1 which needs the most gain to clip), yet a
  // realistic few-dB overshoot, not an absurd slam. Restricted to vox 1/2 and
  // keys (bass's quiet source reads borderline). Aux sends are 0 in the base
  // Practice state, so cranking the preamp distorts without ringing a wedge.
  { key: 'gain-hot',     label: 'Gain too hot',      blurb: "A channel's gain is set so hot the preamp clips and the channel distorts.", par: 2, apply: (s, rng) => {
      if (s.big16) { const i = pbPick(pbInputs(s), rng); if (i >= 0) s.channels[i].gain = Math.min(1, s.channels[i].gain + 0.22); return; }
      const ch = [0, 1, 3][Math.floor((rng ? rng() : 0) * 3)]; s.channels[ch].gain = Math.min(1, window.HEALTHY_GAIN_BY_CH[ch] + 0.22);
    } },
  { key: 'fader',        label: 'Fader down',        blurb: 'A channel fader is all the way down.',                    par: 1, apply: (s, rng) => { const i = pbPick(pbInputs(s), rng); if (i >= 0) s.channels[i].fader = 0; } },
  { key: 'mute',         label: 'Channel muted',     blurb: 'A channel is muted.',                                    par: 1, apply: (s, rng) => { const i = pbPick(pbInputs(s), rng); if (i >= 0) s.channels[i].mute = true; } },
  // NOTE: no 'pan' fault. The win reads the LOUDER PA side (pan is a free
  // creative choice, not a fault — see PRACTICE_CONDITIONS below), so a hard
  // pan still passes every condition. It was an automatic win, so it's out.
  { key: 'phantom',      label: 'Phantom power off', blurb: 'Phantom power is off, so a condenser or active DI is silent.', par: 3, apply: (s, rng) => { const i = pbPick(pbPowered(s), rng); if (i >= 0) s.channels[i].phantom = false; } },
  { key: 'master-mute',  label: 'Master muted',      blurb: 'The master is muted, so nothing reaches the room.',       par: 1, apply: (s)      => { s.master.mute = true; } },
  { key: 'master-fader', label: 'Master fader down', blurb: 'The master fader is down.',                               par: 1, apply: (s)      => { s.master.fader = 0; } },
  { key: 'pa-volume',    label: 'PA volume down',    blurb: 'One PA speaker is turned down.',                          par: 1, apply: (s, rng) => { s.outputs[rng() < 0.5 ? 'pa_l' : 'pa_r'].volume = 0; } },
  { key: 'pa-mute',      label: 'PA muted',          blurb: 'One PA speaker is muted, so one side of the room is silent.', par: 1, apply: (s, rng) => { s.outputs[rng() < 0.5 ? 'pa_l' : 'pa_r'].mute = true; } },
  // DIGITAL-ONLY faults (digital: true). They live in the mute-group buttons and
  // DCA faders on the digital surface and have no analog equivalent, so the draw
  // skips them unless window.PRACTICE_SURFACE === 'digital'.
  { key: 'mute-group',   label: 'Mute group engaged', blurb: 'A mute group is silencing channels even though their own MUTE is off.', par: 2, digital: true, apply: (s, rng) => {
      // Light a group carrying band-critical channels (VOX or BAND, not ALL/FX).
      // The members read silent with their MUTE button off; the fix is to find
      // the lit group and clear it.
      const gi = (rng() < 0.5) ? 0 : 1;
      if (s.muteGroups && s.muteGroups[gi]) s.muteGroups[gi].active = true;
    } },
  { key: 'dca-down',     label: 'DCA pulled down',    blurb: 'A DCA fader is down, so its channels are silent in the mains while their channel faders look fine.', par: 1, digital: true, apply: (s, rng) => {
      const di = (rng() < 0.5) ? 0 : 1;
      if (s.dcas && s.dcas[di]) s.dcas[di].fader = 0;
    } },
  { key: 'soft-patch',   label: 'Input not patched', blurb: 'A channel is dead because its input is unassigned in the soft patch, even though the cable is fine.', par: 2, digital: true, apply: (s, rng) => {
      if (!s.inputPatch) s.inputPatch = [1, 2, 3, 4, 5, 6, 7];
      const ci = Math.floor((rng ? rng() : 0) * 4); // a band channel (0-3)
      s.inputPatch[ci] = 0;
    } },
  { key: 'scene-recall', label: 'Wrong scene recalled', blurb: 'The wrong scene is loaded, so faders and mutes jumped to the wrong values.', par: 2, digital: true, apply: (s) => {
      // Snapshot the healthy state as SHOW, build a broken SOUNDCHK, apply it to
      // the live channels, and leave SOUNDCHK active. Fix = recall SHOW from the
      // SCENES strip. Only faders/mutes are stored, which is exactly what the
      // fault touches, so a recall fully restores the rep.
      const snap = () => ({ channels: s.channels.map(c => ({ fader: c.fader, mute: c.mute })) });
      const show = snap();
      const sc = snap();
      sc.channels[0].mute = true;                       // lead vocal muted in soundcheck
      if (sc.channels[3]) sc.channels[3].fader = 0;     // keys fader down in soundcheck
      s.channels = s.channels.map((c, i) => ({ ...c, fader: sc.channels[i].fader, mute: sc.channels[i].mute }));
      s.scenes = [
        { name: 'SHOW',     snapshot: show },
        { name: 'SOUNDCHK', snapshot: sc },
        { name: 'WALK-IN',  snapshot: null },
      ];
      s.currentScene = 1;
    } },
  // FEEDBACK is NOT in this stacked pool. Faults here share one generic prompt
  // ("something is broken, find it"), so a feedback fault could only announce
  // itself by RINGING on load, and stacked with others that meant the rep could
  // open on a wall of howling wedges (Kyle 2026-07-08: "very annoying"). Real
  // feedback is caused, not walked into: you push a wedge up and it rings. So it
  // lives as its own latent task, window.MONITOR_RING (below), which opens quiet
  // and rings only when the student raises the send. It never stacks and never
  // opens howling.
  // CROSSPATCH — two cables traded places. The console's channel labels and
  // the patch row in the brief are the evidence; one drag (swap) fixes it.
  // Stage-box version trades two sources' input ports; snake version trades
  // two fan-out tails at FOH. Practice always requires the patch to match
  // the input list (PRACTICE.requirePatch), so these can't hide even when
  // both swapped channels happen to stay audible. Par 3 because changing a
  // patch on a live channel POPS: the safe fix is master down (one move,
  // covers both channels) -> swap -> master back up.
  { key: 'crosspatch-stage', label: 'Crosspatch at the stage box', blurb: 'Two inputs are swapped at the stage box.', par: 3, big8only: true, apply: (s, rng) => {
    // Random source-port swaps, but reject any that leave a live mic on the hot
    // (bass) channel — that howls and reads as feedback, not a crosspatch. Falls
    // back to trading the two mics, which can never land a mic on the DI channel.
    for (let tries = 0; tries < 16; tries++) {
      const i = Math.floor(rng() * 4);
      let j = Math.floor(rng() * 3); if (j >= i) j += 1;
      const a = BAND_SOURCES[i], b = BAND_SOURCES[j];
      const t = s.cables[a]; s.cables[a] = s.cables[b]; s.cables[b] = t;
      if (!crosspatchBad(s)) return;
      const u = s.cables[a]; s.cables[a] = s.cables[b]; s.cables[b] = u; // undo, retry
    }
    const t = s.cables['vocal']; s.cables['vocal'] = s.cables['vocal2']; s.cables['vocal2'] = t;
  } },
  { key: 'crosspatch-snake', label: 'Crosspatch at the snake', blurb: 'Two channels are swapped at the snake.', par: 3, big8only: true, apply: (s, rng) => {
    // Same guard for the snake variant (swaps which channel each port feeds).
    // Fallback trades the two non-mic channel tails, so the mics stay put.
    for (let tries = 0; tries < 16; tries++) {
      const i = Math.floor(rng() * 4);
      let j = Math.floor(rng() * 3); if (j >= i) j += 1;
      const t = s.fanOut[i]; s.fanOut[i] = s.fanOut[j]; s.fanOut[j] = t;
      if (!crosspatchBad(s)) return;
      const u = s.fanOut[i]; s.fanOut[i] = s.fanOut[j]; s.fanOut[j] = u; // undo, retry
    }
    const t = s.fanOut[2]; s.fanOut[2] = s.fanOut[3]; s.fanOut[3] = t;
  } },
];

// Win conditions: every band source audible in the PA (heard in the room).
// Uses the combined 'pa' check (the louder side), NOT both pa_l and pa_r, so
// pan is a free creative choice, not a fault. Centering is only "correct" when
// zeroing the console, not during an active mix. Matches how the lessons score.
const PRACTICE_CONDITIONS = [];
for (const src of BAND_SOURCES) {
  PRACTICE_CONDITIONS.push({ source: src, dest: 'pa', min: 0.2 });
}

// PRACTICE GOALS — the dynamic part. A practice rep isn't always "something is
// broken, restore the full mix". Sometimes the call is a positive task: build a
// monitor mix, fix the gain structure, check the speakers. Each goal sets up its
// own start state and returns a `winSpec` — the win conditions plus the prompt
// text — which the app merges over the base Practice scenario, so the same
// engine that wins the lessons wins these. `apply(s, r)` mutates the band-up
// start state and returns the winSpec. The custom-scenario author (a later
// feature) writes a winSpec the same way.
//
// These read like the real job: a real engineer spends as much time building
// monitor mixes and setting gain as chasing faults, so weaving them in makes
// Practice train the whole role, not just diagnosis.
window.PRACTICE_GOALS = [
  {
    key: 'monitor-mix', label: 'Build a monitor mix', par: 2,
    apply: (s) => {
      // Band up and playing in the PA. Both wedges are on and turned up, but
      // nobody is in the monitors yet — every send starts closed. Build it.
      s.outputs.wedge = { ...s.outputs.wedge, on: true, mute: false, volume: 0.7 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: true, mute: false, volume: 0.7 };
      for (let i = 0; i < 4; i++) { s.channels[i].aux1 = 0; s.channels[i].aux2 = 0; }
      return {
        conditions: [
          { source: 'vocal2', dest: 'wedge2', min: 0.35 },
          { source: 'vocal2', dest: 'wedge',  min: 0.30 },
        ],
        symptom: 'Build a monitor mix. Send Vocal 2 to its own wedge (Wedge 2) and into Vocal 1\'s wedge (Wedge 1). Both sends are closed right now.',
        title: 'Monitor Mix Request',
        hint: "It's all aux sends on the Vocal 2 channel. AUX 2 feeds Wedge 2 (their own monitor); AUX 1 feeds Wedge 1 (Vocal 1's monitor). Bring both up until each wedge has them.",
        solution: 'AUX 2 and AUX 1 up on the Vocal 2 channel, so Vocal 2 is in both wedges.',
      };
    },
  },
  {
    key: 'gain-stage', label: 'Fix the gain structure', par: 2,
    apply: (s) => {
      // The bass came in weak: its gain got cracked down to half of where a
      // passive bass needs to sit, and the fader was ridden up to compensate.
      // The fix is at the top of the chain: bring the GAIN up until the bass
      // sits healthy on its meter. gainOnly = the win tests the input gain ONLY,
      // never the fader position. The fader is a mix choice — near unity by habit
      // but legitimately above or below — so requiring it at unity would teach a
      // false rule (Kyle 2026-07-06). Where the student leaves the fader is theirs.
      s.channels[2].gain = window.HEALTHY_GAIN_BY_CH[2] * 0.5; s.channels[2].fader = 0.9;
      return {
        conditions: [{ source: 'guitar', dest: 'pa', min: 0.3 }],
        gainStructure: { refChannel: 3, inputBand: [0.575, 1.148], gainOnly: true },
        symptom: 'The bass gain is set too low and the fader is pushed up to compensate. Set the level at the top of the chain: bring the GAIN up until the bass sits healthy on its meter. The fader from there is a mix call.',
        title: 'Fix the Gain Structure',
        hint: 'PFL the bass (channel 3) and bring its GAIN up until the input meter sits in the healthy zone. That is the fix. The fader is yours to set the balance after.',
        solution: "Bass gain set healthy in PFL, so the level is set at the top of the chain, not by riding the fader. Where the fader sits from there is a mix choice.",
      };
    },
  },
  {
    key: 'speaker-check', label: 'Check the speakers', par: 3,
    apply: (s) => {
      // Quiet stage before the band: use the playback to prove every speaker is
      // passing signal, the PA and all four wedges, one at a time. This checks the
      // OUTPUTS — it is NOT a line check (a line check verifies the inputs).
      for (let i = 0; i < 4; i++) { s.channels[i].mute = true; }
      s.channels[6].mute = false; s.channels[6].gain = window.HEALTHY_GAIN_BY_CH[6]; s.channels[6].fader = 0.75; s.channels[6].aux1 = 0; s.channels[6].aux2 = 0; s.channels[6].aux3 = 0; s.channels[6].aux4 = 0;
      s.outputs.wedge = { ...s.outputs.wedge, on: true, mute: false, volume: 0.6 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: true, mute: false, volume: 0.6 };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: true, mute: false, volume: 0.6 };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: true, mute: false, volume: 0.6 };
      return {
        conditions: [],
        verifyEach: [
          { source: 'playback', dest: 'pa',     min: 0.30, label: 'PA passes signal' },
          { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 passes signal' },
          { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 passes signal' },
          { source: 'playback', dest: 'wedge3', min: 0.25, label: 'Wedge 3 passes signal' },
          { source: 'playback', dest: 'wedge4', min: 0.25, label: 'Wedge 4 passes signal' },
        ],
        symptom: 'Confirm every speaker is passing signal: the PA and all four wedges. Send the playback to each one. They check off as they play.',
        title: 'Check the Speakers',
        hint: 'Send the playback to the PA on its fader, then open AUX 1 through AUX 4, one per wedge. Each speaker checks off once it plays, so you can move on.',
        solution: 'Playback sent to the PA and all four wedges: every speaker proven to pass signal, before a single input matters.',
      };
    },
  },
];

// MONITOR RING-OUT — the signature live-sound task, framed the way it really
// happens: a singer wants more in her wedge, you push her monitor up, and at a
// strong level it starts to ring. The fix is the Feedback Awareness skill: find
// the glowing band on that wedge's Monitor EQ and cut it a touch, keeping her
// level up. It opens QUIET (send low, well under the ring point) so the rep never
// starts howling; the ring only appears once the student raises the send
// (Kyle 2026-07-08). Board-aware: MX-8 uses vocal 1 or 2 into its wedge; the
// 16-channel board picks any live mic into any wedge. Rolled on its own chance in
// PRACTICE.sabotage so it stays frequent on both boards and never stacks.
//
// Calibration (real-dB engine): the wedge's tallest resonance rings once the
// mic's contribution to it crosses ~0.68 (FEED_0DB / 1.22). Start send 0.18 sits
// far below that (silent). Win min 0.70 is just ABOVE the ring onset, so the only
// way to satisfy it is to push through the ring and cut it out — pulling the send
// back down to kill the ring would drop below the required level and fail. A
// strong push lands ~0.75, where ONE band rings (the second onset is ~0.79), and
// a surgical few-dB cut clears it while the level stays above 0.70.
window.MONITOR_RING = {
  key: 'monitor-ring', label: 'Ring out the monitor', par: 2,
  apply: (s, rng) => {
    const r = rng || (() => 0.5);
    let ci, auxKey, wedgeKey, wedgeLabel;
    if (s.big16) {
      ci = pbPick(pbMics(s), r);
      if (ci < 0) ci = 0;
      const opts = [['aux1', 'wedge', 'Wedge 1'], ['aux2', 'wedge2', 'Wedge 2'], ['aux3', 'wedge3', 'Wedge 3'], ['aux4', 'wedge4', 'Wedge 4']];
      const o = opts[Math.floor(r() * opts.length)];
      auxKey = o[0]; wedgeKey = o[1]; wedgeLabel = o[2];
    } else if (r() < 0.5) {
      ci = 0; auxKey = 'aux1'; wedgeKey = 'wedge'; wedgeLabel = 'Wedge 1';
    } else {
      ci = 1; auxKey = 'aux2'; wedgeKey = 'wedge2'; wedgeLabel = 'Wedge 2';
    }
    const src = window.sourceFor(s, ci);
    const chLabel = (s.channels[ci] && s.channels[ci].label) || 'the vocal';
    // Latent: the singer has a little monitor, well under the ring point. The
    // wedge is live so raising the send climbs straight toward feedback.
    s.channels[ci][auxKey] = 0.18;
    if (s.outputs[wedgeKey]) { s.outputs[wedgeKey].on = true; s.outputs[wedgeKey].mute = false; s.outputs[wedgeKey].volume = 0.78; }
    return {
      conditions: [{ source: src, dest: wedgeKey, min: 0.70 }],
      symptom: chLabel + ' wants more in ' + wedgeLabel + '. Bring her monitor up to a strong level. As you push it, the wedge starts to ring. Find the glowing band on that wedge\'s Monitor EQ, cut it a touch to stop the ring, and leave the level up.',
      title: 'Give the Monitor More',
      hint: 'Raise the ' + auxKey.toUpperCase() + ' send on ' + chLabel + '\'s channel toward a strong level. When it rings, open that wedge\'s Monitor EQ, find the glowing band, and pull it down a few dB, just enough to stop the ring. Keep the level up, do not pull the send back down.',
      solution: chLabel + '\'s monitor brought up to a strong level with the ring cut out on the wedge EQ. Pulling the send back down would lose her the monitor; ringing out the one glowing band keeps her level and kills the feedback.',
    };
  },
};

window.PRACTICE = {
  id: 'practice',
  title: 'Practice Mode',
  symptom: 'Something is wrong with the sound. Find what is broken and fix it, without popping the speakers.',
  hint: 'Walk the signal path and watch where the meters stop: source, cable, gain, mute, fader, master, speaker. Check the quick things first, and close the path before you touch a cable or +48V (mute the channel, or pull the master down). If a wedge rings, cut the glowing band on its monitor EQ.',
  conditions: PRACTICE_CONDITIONS,
  involves: [1, 2, 3, 4],
  // Every practice rep also requires the patch to match the input list —
  // that's how the crosspatch faults get caught even when the swapped
  // channels happen to stay audible.
  requirePatch: true,
  sabotage: (s, rng) => {
    // 16-channel Practice: rebuild the rep on the big board (bandState sets
    // big16), then band it up and fault it exactly like the MX-8.
    if (window.PRACTICE_16 && window.bandState) s = window.bandState();
    bandUp(s);
    const r = rng || (() => 0);
    // Board-aware win: require every ACTIVE input source audible in the PA.
    // Captured from the healthy board BEFORE faults, so an unplugged cable still
    // counts. On the 16-channel board this REPLACES the static 4-source list via
    // winSpec; null on the MX-8 leaves its existing conditions untouched.
    const boardWinSpec = s.big16 ? { conditions: pbSources(s).map((src) => ({ source: src, dest: 'pa', min: 0.2 })) } : null;
    // ONBOARDING ONE-SHOT. The welcome screen's "quick fix" sets
    // window.PRACTICE_FORCE to a fault key (or array of keys) so a brand-new
    // signup's very first rep is always a single, legible, winnable fault, never
    // a zero-fault call or a goal task. Cleared after this one draw, so every rep
    // after it is a normal random draw. Inert (skipped) when unset.
    const forced = window.PRACTICE_FORCE;
    if (forced) {
      window.PRACTICE_FORCE = null;
      const fkeys = Array.isArray(forced) ? forced : [forced];
      let fpar = 0; const ffaults = []; const fcond = [];
      for (const k of fkeys) {
        const f = window.PRACTICE_FAULTS.find((x) => x.key === k);
        if (!f) continue;
        const res = f.apply(s, r);
        if (res && res.conditions) fcond.push(...res.conditions);
        fpar += f.par; ffaults.push(f.key);
      }
      if (ffaults.length) {
        window.PRACTICE_LAST = { par: fpar, faults: ffaults, extraConditions: fcond, winSpec: boardWinSpec };
        return s;
      }
    }
    // MONITOR RING-OUT gets its OWN roll, before the generic goal roll and on
    // BOTH boards, so the signature feedback lesson stays frequent. It opens
    // quiet and only rings when the student pushes the wedge up, so the rep never
    // starts howling (Kyle 2026-07-08). Its winSpec carries the single ring win
    // condition + prompt, replacing the generic board win for this focused task.
    const RING_CHANCE = (typeof window.PRACTICE_RING_CHANCE === 'number') ? window.PRACTICE_RING_CHANCE : 0.16;
    if (!window.PRACTICE_FREE && window.MONITOR_RING && r() < RING_CHANCE) {
      const winSpec = window.MONITOR_RING.apply(s, r);
      window.PRACTICE_LAST = { par: window.MONITOR_RING.par, faults: [], goalKey: window.MONITOR_RING.key, goalLabel: window.MONITOR_RING.label, winSpec: winSpec, extraConditions: [] };
      return s;
    }
    // Sometimes the call is a positive task, not a fault: build a monitor mix,
    // fix the gain, check the speakers. These ignore the FAULTS count (a task is
    // a task), carry their own win conditions + prompt text (winSpec), and make
    // Practice train the whole job instead of only diagnosis.
    const GOAL_TASK_CHANCE = (typeof window.PRACTICE_GOAL_CHANCE === 'number') ? window.PRACTICE_GOAL_CHANCE : 0.25;
    // The free-tier Practice taste leaves out the "check the speakers" verify
    // task — a free sample should read as "find what's broken," not a
    // nothing-is-wrong check. Members get the full goal pool.
    const goalPool = window.PRACTICE_FREE
      ? window.PRACTICE_GOALS.filter((g) => g.key !== 'speaker-check')
      : window.PRACTICE_GOALS;
    if (!s.big16 && goalPool && goalPool.length && r() < GOAL_TASK_CHANCE) {
      const g = goalPool[Math.floor(r() * goalPool.length)];
      const winSpec = g.apply(s, r);
      window.PRACTICE_LAST = { par: g.par, faults: [], goalKey: g.key, goalLabel: g.label, winSpec: winSpec, extraConditions: [] };
      return s;
    }
    // The 16-channel board carries one extra fault at every difficulty (capped
    // at 4): more inputs to scan AND more to find, so graduating from 8 to 16 is
    // a real step up in challenge, not just a wider desk.
    const baseN = window.PRACTICE_FAULT_COUNT || 1;
    const n = s.big16 ? Math.max(2, Math.min(4, baseN + 1)) : Math.max(1, Math.min(3, baseN));
    // Distinct fault TYPES per rep (weighted entries appear more often, but
    // never twice). Two faults can still land on the same channel — that
    // just makes the diagnosis honest work.
    let pool = [];
    for (const f of window.PRACTICE_FAULTS) {
      // Digital-only faults (mute group, DCA) live on the digital surface, where
      // the controls to fix them exist. The app sets window.PRACTICE_SURFACE; on
      // analog (or before it's set), these are skipped so a player is never
      // handed a fault they have no way to reach.
      if (f.digital && window.PRACTICE_SURFACE !== 'digital') continue;
      // Crosspatch faults need the input-patch UI, which the 16-channel board
      // does not have yet, so skip them there (they'd be unfixable).
      if (f.big8only && s.big16) continue;
      // "Practice what needs it" biases the draw toward the fault types the
      // member is rusty on (window.PRACTICE_FOCUS, set by the app from the
      // freshness ledger). Unset = an even draw across the pool.
      let w = f.weight || 1;
      if (Array.isArray(window.PRACTICE_FOCUS) && window.PRACTICE_FOCUS.indexOf(f.key) !== -1) w += 4;
      for (let i = 0; i < w; i++) pool.push(f);
    }
    let par = 0;
    const faults = [];
    const extraConditions = [];
    for (let i = 0; i < n && pool.length > 0; i++) {
      const f = pool[Math.floor(r() * pool.length)];
      pool = pool.filter(x => x.key !== f.key);
      const res = f.apply(s, r);
      if (res && res.conditions) extraConditions.push(...res.conditions);
      par += f.par;
      faults.push(f.key);
    }
    window.PRACTICE_LAST = { par, faults, extraConditions, winSpec: boardWinSpec };
    return s;
  },
  // Never shown (the debrief replaces the answer key); kept for the contract.
  solution: 'Walk the signal path and fix what is broken.',
  defaultInspect: 'pa',
};

// FEEDBACK MODE — the ring-out trainer (Kyle, 2026-06-11 PM; realism pass
// 2026-06-12 from ring-out research). Practice Mode trains diagnosis; this
// trains the monitor engineer's core physical skill: pushing a wedge toward
// a target level while killing feedback frequency by frequency. The wedge
// carries the FULL ISO third-octave graphic EQ (63 Hz to 16 kHz, 25 bands)
// and a per-rep random feedback profile. The rhythm the mode teaches is the
// real one: up, ring, back off a touch, cut a few dB, up again.
//
// What the research pinned down (Carvin Audio, Rane Note 158, Sweetwater,
// Yamaha, QSC ring-out guides), and how the profile encodes it:
//   - Feedback starts at the single highest peak in the loop response, and
//     the first few peaks stand well above the rest. So: a ladder of 3-4
//     genuinely hot bands (the hottest rings earliest), placed in the real
//     wedge trouble zones (low-mid hoot, midrange ring, presence whistle).
//   - Real cuts are a few dB, not slammed sliders ("notches on the order of
//     a couple of dB, not tens of dB" — Rane). The ladder is tuned so 2-7 dB
//     per band is enough at the target level.
//   - Pros STOP after those few cuts: past the top peaks the response is a
//     crowd of near-ties, and more EQ just wrecks tone for no added gain.
//     So: every other band is a tame floor that only rings when the send is
//     pushed far past the target (the real "everything rings at once" wall),
//     and the toneGate fails the rep if the cuts go far beyond what the
//     rings needed. Win = target level + no rings + tone intact.
window.FEEDBACK_MODE = {
  id: 'feedback-mode',
  title: 'Mic Feedback Mode',
  par: 12,
  conditions: [
    // Target 1.0 under the real-dB engine: reaching it forces the send about
    // 1.6 dB past the third resonance's ring point, so a rep always rides
    // through the hot ladder (3 rings, sometimes the borderline 4th right at
    // the target) — the full real ring-out arc, never a one-cut shortcut.
    { source: 'vocal', dest: 'wedge', min: 1.0 },
  ],
  // The wedge must keep >= 92% of its response: a real ring-out's three or
  // four small cuts pass easily, slammed sliders or shotgun cutting fail.
  toneGate: 0.92,
  involves: [1],
  symptom: 'Ring-out training. Bring Vocal 1 up to the target level in Wedge 1. As you push, a frequency will start to ring. Back the send off a little, find the glowing band on the wedge\'s graphic EQ, and cut it a few dB, just enough that the ring stays gone. Then keep climbing. A real ring-out only takes a few cuts, so keep them small and stop when you reach the target.',
  hint: 'Raise the send a little at a time. When a frequency rings, find it on the monitor EQ and pull that band down a few dB, just past where the ring stops. Expect three or four on the way up, and keep every cut small. Once the vocal hits the target, stop.',
  sabotage: (s, rng) => {
    const r = rng || (() => 0.5);
    // The singer's vocal live at its clean input-gain sweet spot (the vocal's
    // per-source healthy gain: baseline ~0.81, +4 dBu, no distortion on the
    // Golden stem peaks), her wedge on, the send low. The ring-out is driven by
    // the aux send, not the preamp, so a clean input gain leaves the lesson
    // intact.
    s.channels[0].mute = false;
    s.channels[0].gain = window.HEALTHY_GAIN_BY_CH[0];
    s.channels[0].fader = 0.72;
    s.channels[0].aux1 = 0.15;
    s.master.mute = false;
    s.master.fader = 0.75;
    // Ring-out happens before doors: PA off, all focus on the wedge.
    s.outputs.pa_l = { ...s.outputs.pa_l, on: false };
    s.outputs.pa_r = { ...s.outputs.pa_r, on: false };
    s.outputs.wedge2 = { ...s.outputs.wedge2, on: false, volume: 0 };
    // 25-band ISO third-octave profile. Floor bands are tame: they only ring
    // when the wedge is pushed far past the target, which is the real wall a
    // ring-out stops short of. The spectrum extremes are tamer still (a
    // wedge rolls off down low, and the air bands rarely ring first).
    const N = 25;
    const profile = [];
    for (let b = 0; b < N; b++) {
      const edge = (b <= 3 || b >= 23) ? 0.8 : 1.0;
      profile.push((0.30 + r() * 0.22) * edge);
    }
    // The hot ladder: 3 or 4 real resonances, one per trouble zone so the
    // ear learns the zones (hoot 200-500, ring 630-2k, whistle 2.5k-8k).
    // Which zone gets the hottest peak shuffles per rep. The hotness values
    // stagger the onsets: the hottest rings early on the way up, the next
    // partway, the third near the target, the optional fourth right at it.
    const zones = [
      [5, 6, 7, 8, 9],          // 200, 250, 315, 400, 500 Hz — the hoot
      [10, 11, 12, 13, 14, 15], // 630 Hz .. 2 kHz — the midrange ring
      [16, 17, 18, 19, 20, 21], // 2.5 kHz .. 8 kHz — the whistle
    ];
    for (let i = zones.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = zones[i]; zones[i] = zones[j]; zones[j] = t;
    }
    const pick = (zone) => zone[Math.floor(r() * zone.length)];
    const hot = [
      { idx: pick(zones[0]), p: 1.30 + r() * 0.25 },
      { idx: pick(zones[1]), p: 1.02 + r() * 0.14 },
      { idx: pick(zones[2]), p: 0.86 + r() * 0.10 },
    ];
    if (r() < 0.5) {
      // A fourth, borderline resonance somewhere in the working range. It
      // rings right around the target, so some reps need a fourth small cut
      // and some sneak under it. Real rooms vary exactly like this.
      let idx = 4 + Math.floor(r() * 19);
      while (hot.some(h => h.idx === idx)) idx = 4 + Math.floor(r() * 19);
      hot.push({ idx, p: 0.76 + r() * 0.07 });
    }
    for (const h of hot) profile[h.idx] = h.p;
    s.outputs.wedge = { ...s.outputs.wedge, on: true, mute: false, volume: 0.8, eq: new Array(N).fill(0), fbProfile: profile };
    return s;
  },
  // Never shown (the debrief replaces the answer key); kept for the contract.
  solution: 'The wedge at the target level, the few real resonances each cut a few dB.',
  defaultInspect: 'wedge',
};

// ── Scenario Library ────────────────────────────────────────────────────
// A curated, growing shelf of real-world situations. Each entry is the decoded
// form of an authored scenario: the start board the student sees, the win
// conditions (empty = restore the full mix), and the four text fields. index.html
// turns each into a playable, member-gated challenge in the LIBRARY band; any one
// can also be handed out as a free ?scenario= link. To add one: open ?author=1,
// set the board, write the text, hit "Copy library entry", and paste the object
// here. Keep the voice plain (no em dashes; "system" not "rig"; "speaker" not "box").
window.SCENARIO_LIBRARY = [
  {
    id: 'lead-vocal-dead',
    title: 'Lead vocal is dead',
    symptom: 'The lead vocal is not coming through the PA. Get it back into the mix.',
    hint: 'Everything upstream looks fine. Check the channel itself before you touch the gain.',
    solution: 'Channel 1 was muted, so the lead vocal never reached the mix. Unmuting it put it back in the PA. When one source is missing and the rest sound fine, check the channel mute first.',
    conditions: [],
    start: {"channels":[{"label":"Vocal 1","gain":0.48,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":true,"solo":false,"fader":0.72,"inputTrim":1,"id":1},{"label":"Vocal 2","gain":0.42,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":2},{"label":"Bass","gain":0.77,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.65,"inputTrim":1,"id":3},{"label":"Keys","gain":0.23,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.6,"inputTrim":1,"id":4},{"label":"5/6","gain":0.20,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.7,"inputTrim":1,"id":5,"stereo":true}],"mixer":{"on":true},"master":{"fader":0.75,"mute":false,"aux1":0.75,"aux2":0.75},"outputs":{"pa_l":{"on":true,"mute":false,"volume":0.7},"pa_r":{"on":true,"mute":false,"volume":0.7},"wedge":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":15},"wedge2":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":12},"amp":{"on":true}},"cables":{"vocal":1,"vocal2":2,"guitar":3,"laptop":4},"outFan":{"1":"mainL","2":"mainR","3":"aux1","4":"aux2"},"outPatch":{"pa_l":1,"pa_r":2,"wedge":3,"wedge2":4},"fanOut":[1,2,3,4],"sourceMute":{"vocal":false,"guitar":false,"laptop":false,"vocal2":false,"playback":false},"playbackMode":"music","testing":"vocal","inspect":"pa","topology":{"mixerLocation":"side-stage","paRig":"powered","wedgeLocation":"stage"}},
  },
  {
    id: 'pa-side-quiet',
    title: 'One side of the room is quiet',
    symptom: 'The right side of the audience is getting a lot less than the left. Even out the two main speakers so the whole room hears the same mix.',
    hint: 'This is a PA output level, not a channel. Check the two mains against each other.',
    solution: 'PA Right was turned down well below PA Left, so half the room got a thin mix. Matching the two main outputs evened out the coverage. Keep your main sides level so the whole room hears the same thing.',
    conditions: [],
    start: {"channels":[{"label":"Vocal 1","gain":0.48,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":1},{"label":"Vocal 2","gain":0.42,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":2},{"label":"Bass","gain":0.77,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.65,"inputTrim":1,"id":3},{"label":"Keys","gain":0.23,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.6,"inputTrim":1,"id":4},{"label":"5/6","gain":0.20,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.7,"inputTrim":1,"id":5,"stereo":true}],"mixer":{"on":true},"master":{"fader":0.75,"mute":false,"aux1":0.75,"aux2":0.75},"outputs":{"pa_l":{"on":true,"mute":false,"volume":0.7},"pa_r":{"on":true,"mute":false,"volume":0.35},"wedge":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":15},"wedge2":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":12},"amp":{"on":true}},"cables":{"vocal":1,"vocal2":2,"guitar":3,"laptop":4},"outFan":{"1":"mainL","2":"mainR","3":"aux1","4":"aux2"},"outPatch":{"pa_l":1,"pa_r":2,"wedge":3,"wedge2":4},"fanOut":[1,2,3,4],"sourceMute":{"vocal":false,"guitar":false,"laptop":false,"vocal2":false,"playback":false},"playbackMode":"music","testing":"vocal","inspect":"pa","topology":{"mixerLocation":"side-stage","paRig":"powered","wedgeLocation":"stage"}},
  },
  {
    id: 'keys-buried',
    title: 'Keys are buried',
    symptom: 'You can barely hear the keys in the PA. Bring them back up so they sit with the rest of the band.',
    hint: 'Look at the channel fader for the keys, not the gain.',
    solution: 'The keys fader was pulled almost all the way down, so almost nothing reached the mix. Bringing it back up to a normal level put them back in. The fader sets the level going to the mix; the gain sets it at the input.',
    conditions: [],
    start: {"channels":[{"label":"Vocal 1","gain":0.48,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":1},{"label":"Vocal 2","gain":0.42,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":2},{"label":"Bass","gain":0.77,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.65,"inputTrim":1,"id":3},{"label":"Keys","gain":0.23,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.02,"inputTrim":1,"id":4},{"label":"5/6","gain":0.20,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.7,"inputTrim":1,"id":5,"stereo":true}],"mixer":{"on":true},"master":{"fader":0.75,"mute":false,"aux1":0.75,"aux2":0.75},"outputs":{"pa_l":{"on":true,"mute":false,"volume":0.7},"pa_r":{"on":true,"mute":false,"volume":0.7},"wedge":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":15},"wedge2":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":12},"amp":{"on":true}},"cables":{"vocal":1,"vocal2":2,"guitar":3,"laptop":4},"outFan":{"1":"mainL","2":"mainR","3":"aux1","4":"aux2"},"outPatch":{"pa_l":1,"pa_r":2,"wedge":3,"wedge2":4},"fanOut":[1,2,3,4],"sourceMute":{"vocal":false,"guitar":false,"laptop":false,"vocal2":false,"playback":false},"playbackMode":"music","testing":"vocal","inspect":"pa","topology":{"mixerLocation":"side-stage","paRig":"powered","wedgeLocation":"stage"}},
  },
];

// ============================================================
// MONITOR WORLD - the members' course on building monitor mixes (STAGING).
// A monitor engineer builds a SEPARATE mix per performer on the aux sends:
// their own source loud, references underneath, a sensible level, rung out
// so it won't feed back. Source keys: vocal (Vocal Mic 1), guitar (Bass),
// laptop (Keyboard). Win targets are kept at ~0.35 (the proven ring-safe
// level used by the Run-the-show Monitor Mix lesson); "Ring it out" runs
// the wedge hot (0.7) so it must be EQ'd. These thresholds are first-pass
// and meant to be playtested.
// ============================================================
function mwBoard(s) {
  // A healthy, fully patched show: PA up, all FOUR wedges on and powered, every
  // aux send zeroed so the student builds each monitor mix from nothing. The
  // bass DI is active, so it needs phantom on to be live.
  s.master.fader = 0.75; s.master.mute = false;
  s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
  s.outputs.wedge.on  = true; s.outputs.wedge.volume  = 0.6; s.outputs.wedge.mute  = false;
  s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
  s.outputs.wedge3.on = true; s.outputs.wedge3.volume = 0.6; s.outputs.wedge3.mute = false;
  s.outputs.wedge4.on = true; s.outputs.wedge4.volume = 0.6; s.outputs.wedge4.mute = false;
  s.channels[1].phantom = true; // condenser (Vocal 2) needs phantom for the show
  s.channels[2].phantom = true; // bass is an active DI; power it for the show
  s.channels.forEach((c) => { c.aux1 = 0; c.aux2 = 0; c.aux3 = 0; c.aux4 = 0; });
  return s;
}
window.MONITOR_WORLD = [
  {
    id: 'mw1',
    title: 'The second mix',
    task: true,
    symptom: 'A wedge is a separate mix from the room. Send Vocal 1 to Wedge 1.',
    hint: 'Wedge 1 is on and turned up. Send Vocal 1 to it with AUX 1 on the Vocal 1 channel. The room mix does not change.',
    hints: [
      { title: 'Vocal 1 in Wedge 1', target: 'ch1-aux', teach: 'A wedge is a separate mix for the stage. AUX 1 feeds Wedge 1, so opening it on a channel adds that channel to Wedge 1 without touching the room.', text: 'Send Vocal 1 to Wedge 1 with AUX 1 on the Vocal 1 channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.35) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.35 },
    ],
    sabotage: (s) => mwBoard(s),
    solution: 'AUX 1 up on the Vocal 1 channel sends it to Wedge 1. The monitor send is a separate mix from the room.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw2',
    title: 'A bit of everyone',
    task: true,
    symptom: 'A wedge is more than one channel. Vocal 1 is already in Wedge 1. Add Vocal 2 and a little keys, both under Vocal 1.',
    hint: 'Vocal 1 is already in Wedge 1. Add Vocal 2 with AUX 1 on the Vocal 2 channel, and a touch of keys with AUX 1 on the Keyboard channel. Keep both under Vocal 1.',
    hints: [
      { title: 'Add Vocal 2', target: 'ch2-aux', teach: 'A monitor usually needs a bit of each vocal. AUX 1 on Vocal 2 adds it to Wedge 1, tucked under Vocal 1.', text: 'Add Vocal 2 to Wedge 1: AUX 1 on the Vocal 2 channel.', done: (ctx) => hintReaches(ctx, 'vocal2', 'wedge', 0.22) },
      { title: 'Add a little keys', target: 'ch4-aux', teach: 'A little of a tuned instrument helps with pitch. Keep the keys well under the vocals.', text: 'Add a touch of keys: AUX 1 on the Keyboard channel.', done: (ctx) => hintReaches(ctx, 'laptop', 'wedge', 0.18) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.35 },
      { source: 'vocal2', dest: 'wedge', min: 0.22 },
      { source: 'laptop', dest: 'wedge', min: 0.18 },
    ],
    sabotage: (s) => { mwBoard(s); s.channels[0].aux1 = 0.55; return s; },
    solution: 'Wedge 1 is Vocal 1 up front, with Vocal 2 and a little keys underneath.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw3',
    title: 'Build Wedge 2',
    task: true,
    symptom: 'Build Wedge 2 on the AUX 2 sends: Vocal 2 up front, Vocal 1 underneath, and a little keys.',
    hint: 'Wedge 2 runs off AUX 2. Bring up AUX 2 on the Vocal 2 channel, then add Vocal 1 and a little keys on AUX 2.',
    hints: [
      { title: 'Vocal 2 up front', target: 'ch2-aux', teach: 'Wedge 2 runs off AUX 2. Vocal 2 goes up first and loudest in its own wedge.', text: 'Vocal 2 up front: AUX 2 on the Vocal 2 channel.', done: (ctx) => hintReaches(ctx, 'vocal2', 'wedge2', 0.35) },
      { title: 'Add Vocal 1', target: 'ch1-aux', teach: 'Same as Wedge 1, in reverse: add the other vocal, tucked under this one.', text: 'Add Vocal 1: AUX 2 on the Vocal 1 channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge2', 0.22) },
      { title: 'A little keys', target: 'ch4-aux', teach: 'A touch of keys under the vocals helps with pitch, same as Wedge 1. Keep it well under Vocal 2.', text: 'Add a little keys: AUX 2 on the Keyboard channel.', done: (ctx) => hintReaches(ctx, 'laptop', 'wedge2', 0.18) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal2', dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'wedge2', min: 0.35 },
      { source: 'vocal', dest: 'wedge2', min: 0.22 },
      { source: 'laptop', dest: 'wedge2', min: 0.18 },
    ],
    sabotage: (s) => mwBoard(s),
    solution: 'Wedge 2 is Vocal 2 up front, with Vocal 1 and a little keys underneath. Same idea as Wedge 1, on its own send.',
    defaultInspect: 'wedge2',
  },
  {
    id: 'mw4',
    title: 'The band gets monitors',
    task: true,
    symptom: 'Now the instrument wedges. Wedge 3 (AUX 3) is the bass wedge; Wedge 4 (AUX 4) is the keys wedge. Each one gets its own instrument up, with the vocals underneath.',
    hint: 'Wedge 3 on AUX 3: bass up, a bit of the lead vocal. Wedge 4 on AUX 4: keys up, a bit of the lead vocal. The instrument is loudest in its own wedge.',
    hints: [
      { title: 'The bass wedge', target: 'ch3-aux', teach: 'Wedge 3 is the bass wedge, on AUX 3. The bass is loudest, with a little Vocal 1 underneath.', text: 'Bass wedge (Wedge 3): AUX 3 on the Bass channel, plus a little Vocal 1 on AUX 3.', done: (ctx) => hintReaches(ctx, 'guitar', 'wedge3', 0.35) && hintReaches(ctx, 'vocal', 'wedge3', 0.18) },
      { title: 'The keys wedge', target: 'ch4-aux', teach: 'Same for the keys wedge: Wedge 4 on AUX 4, keys up, a little Vocal 1 underneath.', text: 'Keys wedge (Wedge 4): AUX 4 on the Keyboard channel, plus a little Vocal 1 on AUX 4.', done: (ctx) => hintReaches(ctx, 'laptop', 'wedge4', 0.35) && hintReaches(ctx, 'vocal', 'wedge4', 0.18) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'guitar', dest: 'pa', min: 0.3 },
      { source: 'guitar', dest: 'wedge3', min: 0.35 },
      { source: 'vocal', dest: 'wedge3', min: 0.18 },
      { source: 'laptop', dest: 'wedge4', min: 0.35 },
      { source: 'vocal', dest: 'wedge4', min: 0.18 },
    ],
    sabotage: (s) => mwBoard(s),
    solution: 'Four wedges. Each one has its own source loudest, with the vocals tucked under.',
    defaultInspect: 'wedge3',
  },
  {
    id: 'mw5',
    title: 'Keep the stage quiet',
    task: true,
    symptom: 'Wedge 1 is cranked: loud enough to start a volume war and ring. Bring Vocal 1 back to a useful level, loud enough to hear, not blasting.',
    hint: 'Pull AUX 1 on the Vocal 1 channel down to where it is clear without dominating the stage. If it is ringing, bringing it down stops that too.',
    hints: [
      { title: 'Pull Wedge 1 back', target: 'ch1-aux', teach: 'A quieter stage means less feedback and a cleaner room mix. Bring the send down to where it is still audible, not so far it is gone. As it drops, the ringing stops.', text: 'Bring AUX 1 on the Vocal 1 channel down to a sensible level, not cranked and not gone.', done: (ctx) => { var a = ctx && ctx.audio; var c = a && a.contributions && a.contributions.vocal; var l = c ? (c.wedge || 0) : 0; return l >= 0.22 && l <= 0.40; } },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.22, max: 0.40 },
    ],
    sabotage: (s) => { mwBoard(s); s.channels[0].aux1 = 0.9; return s; },
    solution: 'Pull the send back to a useful level. A quieter stage means less feedback and a cleaner mix.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw6',
    title: 'Ring it out',
    task: true,
    symptom: 'Vocal 1 rings in Wedge 1 as soon as you push it. Get it up to a strong level and ring out the feedback on the monitor EQ.',
    hint: 'Bring AUX 1 on the Vocal 1 channel up. When it rings, open the Wedge 1 Monitor EQ: the ringing band glows. Pull that band down far enough to stop the ring, no more.',
    hints: [
      { title: 'Push it until it rings', target: 'ch1-aux', teach: 'To ring a wedge out, first find its limit. Push AUX 1 up until the wedge is strong and starts to feed back.', text: 'Push AUX 1 on the Vocal 1 channel until Wedge 1 is strong and starts to ring.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.5) },
      { title: 'Ring it out', target: 'out-wedge1', teach: 'The ring is one frequency, and that band glows on the Wedge 1 Monitor EQ. Cut just that band, enough to kill the ring, and the level stays up.', text: 'Ring it out: pull the glowing band down on the Wedge 1 Monitor EQ, enough to stop it.', done: (ctx) => !ctx.feedback },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.5 },
    ],
    sabotage: (s) => {
      mwBoard(s);
      s.outputs.wedge.volume = 0.7;
      s.channels[0].aux1 = 0.2;
      s.channels[0].highpass = false;
      return s;
    },
    solution: 'Push Vocal 1 up, then ring it out: pull the glowing band down on the monitor EQ to cut the ringing frequency. A few small cuts buy a lot of level.',
    defaultInspect: 'wedge',
    // Tighter than the old 0.6 (which let a player cut 40% of the wedge and
    // still "pass" tone — exactly the shotgun-cutting the ring-out teaches
    // against). 0.8 still leaves an intro lesson room for a few real cuts.
    toneGate: 0.8,
  },
];
