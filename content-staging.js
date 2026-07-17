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
//                pulled down, every powered box (wedges + main speakers, or the
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
    //      (MAIN L -> 1, MAIN R -> 2, AUX 1 -> 3, AUX 2 -> 4).
    //   4. SPEAKER LINES - each speaker picks up its return channel at the
    //      stage box (Main L <- 1, Main R <- 2, Wedge 1 <- 3, Wedge 2 <- 4).
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
    hint: 'Drag a cable end and drop it on a port or an output chip. Dropping on a taken spot swaps the two cables. The colors follow the snake channel code, and each side of the snake counts from 1: 1 brown, 2 red, 3 orange, 4 yellow, 5 green, 6 blue. Patch with the power off so nothing can pop.',
    hints: [
      { title: 'Patch the inputs', target: null, teach: 'Patching is just following the paperwork. Open the Input List in the top bar and wire what it tells you, starting at the stage.', text: 'Inputs first: drag each source cable onto its numbered stage-box port. Drop on a taken spot to swap.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[0] && ctx.patchStatus[0].pass },
      { title: 'Land the snake at the console', target: null, teach: 'The snake carries those inputs from the stage back to you at front of house. Each tail lands on its own channel.', text: 'Drop snake tails 1-4 onto their matching console channels.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[1] && ctx.patchStatus[1].pass },
      { title: 'Connect the console outputs', target: null, teach: 'The same snake carries your mix back out on its own return side, counted from 1: channels 1 to 4.', text: 'Console outs into snake 1-4: L to 1, R to 2, AUX 1 to 3, AUX 2 to 4.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[2] && ctx.patchStatus[2].pass },
      { title: 'Connect the speakers', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2'], teach: 'Last, the speakers pick up those same return channels at the stage end. Match each speaker to the output feeding it.', text: 'Each speaker line to its out port: Main L to 1, Main R to 2, Wedge 1 to 3, Wedge 2 to 4.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[3] && ctx.patchStatus[3].pass },
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
    solution: 'Everything connected per the Input List: inputs on snake 1 to 4, outputs on the return side 1 to 4, every color matched. The system is connected and still off. Next, power on.',
    defaultInspect: 'pa',
  },
  {
    id: 2,
    title: 'Power Up in Order',
    // Pure power-on lesson on an ACTIVE-speaker rig (powered main speakers, no
    // separate power amp). The console starts zeroed and safe: faders down,
    // every channel muted, master muted (normalizeChannels handles the
    // channels since there are no conditions; the sabotage mutes the master).
    // Everything is powered off. The win is bringing the rig up in the right
    // order, NOT sending signal (that's the next lessons). Win = console on +
    // both active main speakers on + both wedges on, flagged by requirePowerOn
    // (topology-aware: active mode checks the main speakers, not an amp).
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
    symptom: 'Everything is connected and the console is zeroed: every channel is back at its starting position. Power the system up in the right order: console first, then both main speakers and both wedges. The wrong order pops the speakers.',
    hint: 'Power on the console first, then the powered speakers last. If you turn a main speaker or wedge on first and then switch the console on, the console sends a pop to the speakers. So: console first, then the wedges and the main speakers.',
    hints: [
      { title: 'Console on first', target: 'mixer-power', teach: 'Power up from the source outward. The console goes on first, so its switch-on thump has no live speaker to play it.', text: 'Turn the console on first.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.console },
      { title: 'Then the speakers', target: null, teach: 'With the console already on and settled, the speakers come up last. Nothing pops, because the thump already passed.', text: 'Now bring up the rest: both main speakers and both wedges.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.paStage && ctx.powerStatus.wedges },
    ],
    conditions: [],
    // Active speakers: powered PA boxes with their own on/off, no power amp.
    topology: { paRig: 'powered' },
    sabotage: (s) => {
      // Zeroed, safe console between shows: channels already muted with faders
      // down (normalizeChannels, no conditions). Mute the master too, then
      // power off everything with a switch: both active main speakers and both
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
    solution: 'Turn the console on first, then the wedges and the two main speakers.',
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
    // loud the room is with the main speaker volume (the SPL beat lives here now).
    // requirePflCheck = the PFL workflow happened; gainStructure.inputBand =
    // input sits healthy; unity checks require unmuted + at unity; the PA
    // corridor (0.30-0.65 ~= 86-92 dB SPL, a sane small-club show level) is the
    // room level set with the speaker volume, shown as a green target band on
    // the loudness meter. involves: [7] keeps the playback channel live, mutes the mics.
    task: true,
    involves: [7],
    requirePflCheck: true,
    // inputBand = the healthy window on the real-units meter, kept lenient:
    // -20 to -3 dBFS (anywhere from a conservative level up to just under the
    // red), in the engine's nominal-anchored linear values.
    gainStructure: { refChannel: 7, unity: 0.75, faderTol: 0.06, inputBand: [0.645, 4.566] },
    conditions: [
      { source: 'playback', dest: 'pa', min: 0.30, max: 0.65 },
    ],
    symptom: 'The system is on and the console is fully zeroed, with your playback connected. Set your gain structure start to finish: check it in PFL, set the gain, bring the faders to unity, then set the room level with the PA until the loudness meter sits in the green target band.',
    hint: 'Press PFL on the playback to hear it in your headphones. Set the gain so the meter sits in the healthy zone. Disengage PFL, unmute the playback and the master, and bring both faders up to unity. Then bring up the main speaker volume until the loudness meter reaches the green target band. A live show is louder than the all-day-safe line, so that band sits in the amber part of the meter on purpose.',
    hints: [
      { title: 'Check it in PFL', target: 'ch7-pfl', teach: 'PFL (pre-fade listen) lets you hear and meter a channel in your headphones before the audience does. Always set a level in PFL first.', text: 'PFL the playback so you can set it in your headphones first.', done: (ctx) => ctx.pflChecked || (ctx.state.channels[6] && ctx.state.channels[6].solo) },
      { title: 'Set the gain', target: 'ch7-gain', teach: 'Gain sets how hard the source hits the console. You want it strong on the meter with a little room to spare, set by the meter, not by ear.', text: 'Set the GAIN so the input meter sits in the healthy zone.', done: (ctx) => ctx.gainStatus && ctx.gainStatus.input },
      { title: 'Faders to unity', target: ['ch7-fader', 'master-fader'], teach: 'With the gain set, the channel and master faders live at unity, the U mark. That is where they are built to run.', text: 'Disengage PFL, unmute the playback and the master, and bring both faders up to unity.', done: (ctx) => ctx.gainStatus && ctx.gainStatus.fader && ctx.gainStatus.master },
      { title: 'Set the room level', target: ['out-pa-l', 'out-pa-r'], teach: 'Gain and faders are set, so set the room volume with the PA, not by pushing a fader. A show sits above the all-day-safe line by nature, so aim for the green target band on the loudness meter, not the quietest reading.', text: 'Bring the main speaker volume up until the loudness meter sits in the green target band.', done: (ctx) => { var c = ctx.audio && ctx.audio.contributions && ctx.audio.contributions.playback; if (!c) return false; var l = Math.max(c.pa_l || 0, c.pa_r || 0); return l >= 0.30 && l <= 0.65; } },
    ],
    sabotage: (s) => {
      // Continuous with Power-On: rig on, console fully zeroed. Channel muted,
      // fader 0, GAIN all the way down. Master muted, fader 0. main speaker volume
      // all the way down too, since the student sets the room level here.
      s.channels[6].mute = true;
      s.channels[6].fader = 0;
      s.channels[6].gain = 0;
      s.channels[6].aux1 = 0; s.channels[6].aux2 = 0;
      s.master.mute = true; s.master.fader = 0;
      s.outputs.pa_l.volume = 0; s.outputs.pa_r.volume = 0;
      return s;
    },
    solution: 'PFL the playback, set the input gain healthy, unmute and bring the channel and master to unity, then set the main speaker volume for a good room level.',
    defaultInspect: 'pa',
  },
  {
    id: 4,
    title: 'Test the Wedges',
    // The monitor wedges, on their own. The PA was already set in Set the Input
    // Level, so we don't re-check it here. This introduces the wedges and which
    // aux feeds which: AUX 1 -> Wedge 1, AUX 2 -> Wedge 2. The student sends
    // the reference out each aux and brings up each wedge volume until it plays.
    // verifyEach latches each wedge once it gets signal. The PA, gain and faders
    // stay as set in Level 2. The wedge volumes the student sets here are kept
    // for the rest of the build (Levels 4-7 start with them up).
    task: true,
    involves: [7],
    verifyEach: [
      { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 plays' },
      { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 plays' },
    ],
    conditions: [],
    symptom: 'The mains are set. Now bring up both monitor wedges. AUX 1 feeds Wedge 1, AUX 2 feeds Wedge 2. Each wedge checks off once it plays and stays checked.',
    hint: 'Turn up each AUX send on the playback channel and bring up that wedge on stage until it plays: AUX 1 for Wedge 1, AUX 2 for Wedge 2.',
    hints: [
      { title: 'Wedge 1', target: 'ch7-aux', teach: 'A wedge only plays what you send it. AUX 1 is the feed to Wedge 1, and the wedge has its own volume on stage.', text: 'Wedge 1: turn up AUX 1 on the playback, then raise the Wedge 1 volume until it plays.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.wedge },
      { title: 'Wedge 2', target: 'ch7-aux', teach: '', text: 'Same idea on the next monitor: AUX 2 on the playback, then raise the Wedge 2 volume.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.wedge2 },
    ],
    sabotage: (s) => {
      // Carried from Set the Input Level: good input, faders at unity, PA set.
      // The wedges are not up yet: sends closed, wedge volumes down. Playback is
      // a hot line source, so its healthy gain sits low on the knob (~0.20).
      s.channels[6].mute = false;
      s.channels[6].gain = window.HEALTHY_GAIN_BY_CH[6];
      s.channels[6].fader = 0.75;
      s.channels[6].aux1 = 0; s.channels[6].aux2 = 0;
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0; s.outputs.wedge2.mute = false;
      s.outputs.wedge3.on = false; s.outputs.wedge3.volume = 0;
      s.outputs.wedge4.on = false; s.outputs.wedge4.volume = 0;
      return s;
    },
    solution: 'Open AUX 1 and AUX 2 on the playback and bring up each wedge volume on stage until both play.',
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
      { title: 'Channel 1: the dynamic', target: 'ch1-strip', teach: '', text: 'Channel 1 is a dynamic mic, so it needs no power. PFL it, set the gain, unmute, and bring it up.', done: (ctx) => hintReaches(ctx, 'vocal', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[1] },
      { title: 'Power the condenser', target: 'ch2-phantom', teach: 'A condenser mic needs +48V phantom power to work. Switch it on while the channel is muted so the turn-on thump never reaches the speakers.', text: 'Channel 2 is a condenser: it needs +48V phantom. Switch it on while muted.', done: (ctx) => ctx.state.channels[1] && ctx.state.channels[1].phantom },
      { title: 'Bring up channel 2', target: 'ch2-strip', teach: '', text: 'With phantom on, treat it like any channel: check channel 2 in PFL, set its gain, and bring it up.', done: (ctx) => hintReaches(ctx, 'vocal2', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[2] },
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
      { title: 'Bring up the bass', target: 'ch3-strip', teach: '', text: 'With phantom on, treat it like any input: check channel 3 in PFL, set its gain, and bring it up.', done: (ctx) => hintReaches(ctx, 'guitar', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[3] },
      { title: 'Bring up the keys', target: 'ch4-strip', teach: '', text: 'Channel 4 is a passive DI on the keys, so it needs no power. PFL it, set the gain, bring it up.', done: (ctx) => hintReaches(ctx, 'laptop', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[4] },
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
      { title: 'Send Vocal 1 to Wedge 1', target: 'ch1-aux', teach: 'A wedge is a separate mix from the main outputs. AUX 1 feeds Wedge 1 and does not touch the PA.', text: 'Turn up AUX 1 on the Vocal 1 channel to send it to Wedge 1.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.3) },
    ],
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.3 },
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
    title: 'Fight the Feedback',
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
    symptom: 'Turn Vocal 1 up in Wedge 1. Push it to a strong level and the wedge starts to ring: that is feedback. Get the level up and ring the feedback out on the Monitor EQ.',
    hint: 'Turn up AUX 1 on the Vocal 1 channel to raise it in Wedge 1. When it rings, look at the Wedge 1 Monitor EQ: the ringing frequency glows. Pull that band down far enough to stop the ring. Cuts cost a little level, so keep them small.',
    hints: [
      { title: 'Raise Vocal 1 in Wedge 1', target: 'ch1-aux', teach: 'As you send more level from a microphone to a wedge, it can start to ring. That is called microphone feedback.', text: 'Bring AUX 1 on the Vocal 1 channel up until Wedge 1 reaches a strong level.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.8) },
      { title: 'Ring it out', target: 'out-wedge1', teach: 'Feedback rings at one frequency. On the wedge Monitor EQ that band glows. Pull just that band down a touch and the ring stops while the level stays up.', text: 'When it rings, pull the glowing band down on the Wedge 1 Monitor EQ, enough to stop it.', done: (ctx) => !ctx.feedback && (((ctx.state.outputs.wedge || {}).eq) || []).some((v) => v < 0) },
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
      // student has to ring it out on the Monitor EQ. Wedge volume kept with
      // headroom so the loud send doesn't clip while she's still ringing.
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.7; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      s.channels[0].aux1 = 0.2;
      s.channels[0].highpass = false;
      return s;
    },
    solution: 'Turn Vocal 1 up in Wedge 1, then ring it out: pull the glowing band down on the Monitor EQ to cut the ringing frequency.',
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
    gainStructure: { unity: 0.75, faderTol: 0.06, inputBandAll: [0.645, 4.566] },
    involves: [1, 2, 3, 4, 7],
    verifyEach: [
      { source: 'playback', dest: 'pa',     min: 0.30, label: 'PA tested with playback' },
      { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 tested with playback' },
      { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 tested with playback' },
    ],
    conditions: [
      { source: 'vocal',  dest: 'pa', min: 0.25 },
      { source: 'vocal2', dest: 'pa', min: 0.25 },
      { source: 'guitar', dest: 'pa', min: 0.25 },
      { source: 'laptop', dest: 'pa', min: 0.25 },
      { source: 'vocal',  dest: 'wedge', min: 0.3 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'Final exam. Nothing is powered on yet. Run the whole job in order: power on, test every speaker with playback, then bring the band in. Keep it clean the whole way.',
    hint: 'Everything you have already done, in order. Console on first, then the speakers. PFL the playback, set its gain, and send it to the PA and both wedges: each speaker checks off once it plays and stays checked, so you can turn the playback back down afterward. Then the band: PFL each input, set its gain, and bring it up with the fader at unity. Turn on +48V for the condenser and the active DI while the channel is muted and before you PFL it. Open AUX 1 on Vocal 1 to send it to Wedge 1.',
    hints: [
      { title: 'Power up in order', target: 'mixer-power', teach: '', text: 'Power on in order: console first, then both main speakers and both wedges.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.console && ctx.powerStatus.paStage && ctx.powerStatus.wedges },
      { title: 'Prove every speaker', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2'], teach: 'Catch a silent speaker now, not during the first song.', text: 'Test every speaker with playback: send it to the mains and both wedges.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.pa && ctx.verifyStatus.wedge && ctx.verifyStatus.wedge2 },
      { title: 'Power what needs it', target: ['ch2-phantom', 'ch3-phantom'], teach: '', text: 'Turn +48V on (while muted) for the condenser (ch 2) and active DI (ch 3).', done: (ctx) => ctx.state.channels[1] && ctx.state.channels[1].phantom && ctx.state.channels[2] && ctx.state.channels[2].phantom },
      { title: 'Check every input', target: null, teach: '', text: 'Check every input in PFL before you bring it up: the four band channels and the playback.', done: (ctx) => ctx.pflChannels && [1, 2, 3, 4, 7].every((ch) => ctx.pflChannels[ch]) },
      { title: 'Bring the band up', target: null, teach: '', text: 'Bring the band up clean, gain set by the meter: vocals, bass, and keys in the PA.', done: (ctx) => hintReaches(ctx, 'vocal', 'pa', 0.25) && hintReaches(ctx, 'vocal2', 'pa', 0.25) && hintReaches(ctx, 'guitar', 'pa', 0.25) && hintReaches(ctx, 'laptop', 'pa', 0.25) && [1, 2, 3, 4].every((ch) => { var l = (ctx.audio && ctx.audio.chanInBaseline && ctx.audio.chanInBaseline[ch - 1]) || 0; return l >= 0.645 && l <= 4.566; }) },
      { title: 'Send Vocal 1 to Wedge 1', target: 'ch1-aux', teach: '', text: 'Last step: send Vocal 1 to Wedge 1 by opening AUX 1 on the Vocal 1 channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.3) },
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
    title: 'Power Down in Order',
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
    hint: 'Work down each strip: gain down, aux sends down, HPF (high-pass filter) off, +48V off, pan back to center, fader down, mute on. Then the master: all the way down and muted. Power-off is power-on in reverse: the speakers go off first and the console goes off last. A console makes a pop when it switches off, and any powered speaker still on will play that pop.',
    hints: [
      { title: 'Zero the console', target: null, teach: 'You leave the desk the way you would want to find it. Every control back to its resting place so the next power-up is predictable.', text: 'Zero the console: gains, sends, faders down; mute; pans centered; HPF and +48V off.', done: (ctx) => ctx.zeroStatus && ctx.zeroStatus.slice(0, 7).every((z) => z.pass) },
      { title: 'Drop the master', target: 'master-fader', teach: 'The main output comes all the way down and muted, so nothing can sneak out while you shut the rest down.', text: 'Then the master: all the way down and muted.', done: (ctx) => ctx.zeroStatus && ctx.zeroStatus[7] && ctx.zeroStatus[7].pass },
      { title: 'Speakers off first', target: null, teach: 'Power-down is power-up in reverse. The speakers go off first so they are dead before the console makes its switch-off thump.', text: 'Power off in reverse: main speakers and wedges off first.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.paOff && ctx.powerStatus.wedgesOff },
      { title: 'Console off last', target: 'mixer-power', teach: '', text: 'Console off last. It pops on shutoff, and a live speaker would play that pop.', done: (ctx) => ctx.powerStatus && !ctx.powerStatus.console },
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
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: false, volume: 0, mute: false };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: false, volume: 0, mute: false };
      return s;
    },
    solution: 'Console zeroed, master down and muted, speakers off, console off last. The next engineer powers on into a predictable console.',
    defaultInspect: 'pa',
  },
];

// START HERE — the free first-impression course. A short chain of little wins
// on a system that is already patched and playing, so a newcomer gets real
// value fast without the from-scratch patch/power grind (that now lives in the
// members' Run the Show course). Lesson-style like LEVELS (guided coach + win
// detection), free, and it ends on the email opt-in + join call to action.
// Stable ids in their own 100s range so they never collide with LEVELS.
window.START_HERE = [
  {
    id: 101, task: true, requireSound: true,
    title: 'Turn On the Sound',
    involves: [1, 2, 3, 4],
    // First quick win: wake the system up. Turn the app sound on (top bar), then
    // bring the MAIN fader up so the band fills the room. Teaches the SOUND
    // button and that the main fader is the overall level to the audience.
    symptom: 'The system is silent. Turn the sound on with the SOUND button in the top bar, then bring the MAIN fader up so the band fills the room.',
    hint: 'First, hit the SOUND button in the top bar so you can hear the app. Then bring the MAIN fader in the master section up: that is your overall level to the audience.',
    hints: [
      { title: 'Turn on the sound', target: 'sound', teach: '', text: 'Hit the SOUND button in the top bar to turn the sound on.', done: (ctx) => !!ctx.audioOn },
      { title: 'Bring up the main mix', target: 'master-fader', teach: 'The MAIN fader is your overall level to the audience.', text: 'Bring the MAIN fader up so the band fills the room.', done: (ctx) => ctx.state.master && !ctx.state.master.mute && ctx.state.master.fader >= 0.6 },
    ],
    conditions: [
      { source: 'guitar', dest: 'pa', min: 0.2 },
      { source: 'laptop', dest: 'pa', min: 0.2 },
    ],
    sabotage: (s) => {
      // Instruments up and ready, but the mains are all the way down and the app
      // sound is off. The two moves: sound on, then bring the main fader up. The
      // vocals stay down until lesson 103, so this first win is bass + keys only.
      s.master.fader = 0; s.master.mute = false;
      s.outputs.pa_l.volume = 0.65; s.outputs.pa_r.volume = 0.65;
      s.channels[2].phantom = true; // active DI on bass, powered so it plays
      s.channels[0].mute = true; s.channels[0].fader = 0;
      s.channels[1].mute = true; s.channels[1].fader = 0; s.channels[1].phantom = false;
      return s;
    },
    solution: 'Sound on, MAIN fader up. The band comes up in the mains. The main fader is your overall level to the audience.',
    defaultInspect: 'pa',
  },
  {
    id: 102, task: true,
    title: 'Balance the Band',
    involves: [1, 2, 3, 4],
    // Teach the channel fader. At this point only the bass and keys are up (the
    // vocals come in the next lesson). Pull each instrument's fader down and hear
    // it drop. requireAdjust latches once a fader is >= 6 dB below its start, so
    // a beginner makes a move big enough to clearly hear.
    symptom: 'Only the bass and keyboard are up so far. Every channel has its own fader that sets that channel\'s level. Pull the KEYS fader down and hear the keyboard drop, then do the same with the BASS. That is how you balance a band, one fader at a time.',
    hint: 'Pull the KEYS fader (channel 4) down at least 6 dB and listen: the keyboard drops while everything else stays put. Then do the same with the BASS (channel 3).',
    hints: [
      { title: 'Pull the keyboard down', target: 'ch4-fader', teach: 'Each channel fader sets that one channel\'s level in the mix.', text: 'Pull the KEYS fader (channel 4) down at least 6 dB. Hear the keyboard drop out.', done: (ctx) => !!(ctx.adjustLatched && ctx.adjustLatched[4]) },
      { title: 'Now the bass', target: 'ch3-fader', teach: '', text: 'Do the same with the BASS fader (channel 3): pull it down at least 6 dB. Only the bass drops.', done: (ctx) => !!(ctx.adjustLatched && ctx.adjustLatched[3]) },
    ],
    conditions: [],
    requireAdjust: [3, 4],
    sabotage: (s) => {
      // Only bass + keys are up here (the vocals arrive next lesson). Bass DI is
      // powered so it plays; both vocals are muted and down.
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.channels[2].phantom = true; // active DI on bass, powered
      s.channels[0].mute = true; s.channels[0].fader = 0;
      s.channels[1].mute = true; s.channels[1].fader = 0;
      return s;
    },
    solution: 'Each channel fader controls the level of one channel. You balance the band by setting those levels against each other.',
    defaultInspect: 'pa',
  },
  {
    id: 103, task: true,
    title: 'Get Your Vocals in the Mix',
    involves: [1, 2, 3, 4],
    // Both vocals start muted with faders down. Vocal 1 is guided step by step;
    // Vocal 2 is the same routine on the student's own recall, plus its condenser
    // needs +48V phantom first (dead until powered). Win = both vocals in the PA.
    symptom: 'Neither vocal is in yet: both are muted with their faders down. Bring Vocal 1 in the right way: PFL (pre-fade listen) to check it, set the gain, then disengage PFL, unmute, and bring the fader up. Then do the same for Vocal 2. Vocal 2 is a condenser, so it needs +48V phantom power first.',
    hint: 'Vocal 1: press PFL, set the gain on the meter, then disengage PFL, unmute, and bring the fader to unity. Then Vocal 2 the same way, but turn its +48V phantom on first, while it is muted.',
    hints: [
      { title: 'Check Vocal 1 in PFL', target: 'ch1-pfl', teach: 'PFL stands for pre-fade listen. It lets you hear a channel in your headphones without sending it to the audience.', text: 'Press PFL on Vocal 1 to hear it in your headphones.', done: (ctx) => (ctx.pflChannels && ctx.pflChannels[1]) || (ctx.state.channels[0] && ctx.state.channels[0].solo) },
      { title: 'Set Vocal 1 gain', target: 'ch1-gain', teach: 'The gain sets the input level.', text: 'With Vocal 1 in PFL, set the gain knob and watch the meter, bringing the level up until the peaks sit near the top of the meter without hitting the very top.', done: (ctx) => ctx.state.channels[0] && ctx.state.channels[0].gain >= 0.4 },
      { title: 'Bring Vocal 1 in', target: ['ch1-fader', 'ch1-mute', 'ch1-pfl'], teach: '', text: 'Disengage PFL, unmute Vocal 1, and bring the fader up to unity, the U mark (its normal running position).', done: (ctx) => hintReaches(ctx, 'vocal', 'pa', 0.3) },
      { title: 'Power Vocal 2 (+48V)', target: 'ch2-phantom', teach: 'Vocal 2 is a condenser mic. It needs +48V phantom power to work.', text: 'Switch +48V on for Vocal 2 (channel 2) while the channel is muted (this protects the speakers).', done: (ctx) => ctx.state.channels[1] && ctx.state.channels[1].phantom },
      { title: 'Bring Vocal 2 in', target: 'ch2-strip', teach: '', text: 'Now do the same thing on Vocal 2: PFL, set the gain, disengage PFL, unmute, and bring up the fader.', done: (ctx) => hintReaches(ctx, 'vocal2', 'pa', 0.3) },
    ],
    conditions: [
      { source: 'vocal',  dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'pa', min: 0.3 },
    ],
    sabotage: (s) => {
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.65; s.outputs.pa_r.volume = 0.65;
      s.channels[2].phantom = true; // bass powered so the band plays under the vocals
      // Both vocals start muted, down, ungained; Vocal 2's phantom is off (dead).
      s.channels[0].gain = 0; s.channels[0].fader = 0; s.channels[0].mute = true; s.channels[0].solo = false;
      s.channels[1].gain = 0; s.channels[1].fader = 0; s.channels[1].mute = true; s.channels[1].solo = false; s.channels[1].phantom = false;
      return s;
    },
    solution: 'Both vocals brought in the same way: PFL, set the gain, disengage PFL, unmute, fader up. Vocal 2 needed +48V phantom first because it is a condenser.',
    defaultInspect: 'pa',
  },
  {
    id: 104, task: true,
    title: 'Build a Monitor Mix',
    involves: [1, 2, 3, 4],
    // Vocal live in the PA, her wedge up. Just the aux send: open AUX 1 on the
    // vocal to feed her monitor. (Adapts the Monitor Mix lesson.)
    symptom: 'The singer\'s voice is in the PA, but she cannot hear herself on stage. Send her voice to her monitor wedge.',
    hint: 'Wedge 1 is on and turned up. Turn up AUX 1 on the Vocal 1 channel to send her voice to it.',
    hints: [
      { title: 'Send Vocal 1 to Wedge 1', target: 'ch1-aux', teach: 'Auxiliary sends can create mixes that are separate from what goes to the main outputs. In this case, AUX 1 feeds Wedge 1, which is a monitor mix for the performer on stage.', text: 'Turn up AUX 1 on the Vocal 1 channel to send it to Wedge 1.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.3) },
    ],
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.3 },
    ],
    sabotage: (s) => {
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      s.channels.forEach(c => c.aux1 = 0);
      return s;
    },
    solution: 'AUX 1 up on the Vocal 1 channel sends it to Wedge 1. The singer can hear herself.',
    defaultInspect: 'wedge',
  },
  {
    id: 105, task: true,
    title: 'Ring Out the Feedback',
    involves: [1, 2, 3, 4],
    // The singer wants more of herself in the wedge. As the student pushes AUX 1
    // up, the wedge crosses the ring threshold and feeds back. To win: vocal
    // strong in the wedge (>= 0.8) AND no feedback, so pulling the send back
    // down will not do it. The fix is the monitor EQ: cut the glowing band.
    symptom: 'Turn Vocal 1 up in Wedge 1. Push it to a strong level and the wedge starts to ring: that is feedback. Get the level up and ring the feedback out on the Monitor EQ.',
    hint: 'Turn up AUX 1 on the Vocal 1 channel to raise it in Wedge 1. When it rings, look at the Wedge 1 Monitor EQ: the ringing frequency glows. Pull that band down far enough to stop the ring. Cuts cost a little level, so keep them small.',
    hints: [
      { title: 'Raise Vocal 1 in Wedge 1', target: 'ch1-aux', teach: 'As you send more level from a microphone to a wedge, it can start to ring. That is called microphone feedback.', text: 'Bring AUX 1 on the Vocal 1 channel up until Wedge 1 reaches a strong level.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.8) },
      { title: 'Ring it out', target: 'out-wedge1', teach: 'Feedback rings at one frequency. On the wedge Monitor EQ that band glows. Pull just that band down a touch and the ring stops while the level stays up.', text: 'When it rings, pull the glowing band down on the Wedge 1 Monitor EQ, enough to stop it.', done: (ctx) => !ctx.feedback && (((ctx.state.outputs.wedge || {}).eq) || []).some((v) => v < 0) },
    ],
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.8 },
    ],
    sabotage: (s) => {
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.7; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      s.channels[0].aux1 = 0.2;
      s.channels[0].highpass = false;
      return s;
    },
    solution: 'Turn Vocal 1 up in Wedge 1, then ring it out: pull the glowing band down on the Monitor EQ to cut the ringing frequency.',
    defaultInspect: 'wedge',
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
    // Same as bandUp: sends are per-song, zero them for identical rep starts.
    c.aux1 = 0; c.aux2 = 0; c.aux3 = 0; c.aux4 = 0;
  }
  const pb = pbPlayback(s);
  if (pb >= 0) { s.channels[pb].mute = true; s.channels[pb].fader = 0; s.channels[pb].gain = 0; }
  s.master.mute = false; s.master.fader = 0.75;
  s.master.aux1 = 0.75; s.master.aux2 = 0.75; s.master.aux3 = 0.75; s.master.aux4 = 0.75;
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
    // Monitor sends are per-song, not room tuning: zero them so every rep
    // (and every shared ?rep= link) starts identical no matter what the
    // lessons left behind (the Start Here finale exits with AUX 1 cranked).
    s.channels[i].aux1 = 0; s.channels[i].aux2 = 0; s.channels[i].aux3 = 0; s.channels[i].aux4 = 0;
  }
  s.channels[6].mute = true; s.channels[6].fader = 0; s.channels[6].gain = 0;
  s.master.mute = false; s.master.fader = 0.75;
  s.master.aux1 = 0.75; s.master.aux2 = 0.75; s.master.aux3 = 0.75; s.master.aux4 = 0.75;
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

// 16-channel patch correctness: a pro's patch matches the input list, so every
// mic sits in its listed sub-snake input (micIn) AND every input lands on its
// listed console channel (cables). Used both to gate the Practice win and to
// show the "Patched per the input list" row, so a crosspatch / wrong-input /
// unplugged fault can't hide even when the source stays audible on a wrong
// channel. The correct mapping IS the natural default: channel = order in
// BAND_KEYS, slot = order within the sub-snake.
window.big16PatchOk = function (s) {
  const keys = window.BAND_KEYS || [];
  const SRC = window.SOURCES || {};
  const cnt = {};
  for (const k of keys) {
    if ((s.cables[k] || 0) !== keys.indexOf(k) + 1) return false;
    const sn = (SRC[k] || {}).snake;
    if (!sn) continue;
    cnt[sn] = (cnt[sn] || 0) + 1;
    const naturalSlot = cnt[sn];
    if (((s.micIn && s.micIn[k]) || naturalSlot) !== naturalSlot) return false;
  }
  // FOH fan-out must be 1:1 too: snake channel i lands on console channel i. A
  // crosspatch at the console fan-out (fanOut non-identity) keeps every source
  // audible but on the wrong channel, so check it here or it would hide behind
  // a passing signal-flow win. Missing fanOut reads as identity (legacy states).
  const fan = s.fanOut || [];
  for (let i = 0; i < keys.length; i++) { if ((fan[i] || i + 1) !== i + 1) return false; }
  return true;
};
// Reject a 16-ch crosspatch that overloads a channel (a source slammed onto a
// much hotter channel reads as a distortion fault, not a crosspatch). Mirrors
// the MX-8 crosspatchBad clip guard over the whole desk.
function big16CrosspatchBad(s) {
  const a = window.computeAudio ? window.computeAudio(s) : null;
  if (a && a.chanInBaseline) {
    for (let i = 0; i < a.chanInBaseline.length; i++) { if (a.chanInBaseline[i] > 6) return true; }
  }
  return false;
}
// Ensure micIn exists (natural slots) so a wrong-input fault has something to
// swap even if the start state predates the micIn field.
function ensureMicIn16(s) {
  if (s.micIn) return s.micIn;
  const keys = window.BAND_KEYS || [];
  const SRC = window.SOURCES || {};
  const cnt = {};
  s.micIn = {};
  for (const k of keys) { const sn = (SRC[k] || {}).snake; if (!sn) continue; cnt[sn] = (cnt[sn] || 0) + 1; s.micIn[k] = cnt[sn]; }
  return s.micIn;
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
  { key: 'master-mute',  label: 'Master muted',      blurb: 'The master is muted, so nothing reaches the audience.',   par: 1, apply: (s)      => { s.master.mute = true; } },
  { key: 'master-fader', label: 'Master fader down', blurb: 'The master fader is down.',                               par: 1, apply: (s)      => { s.master.fader = 0; } },
  { key: 'pa-volume',    label: 'PA volume down',    blurb: 'One main speaker is turned down.',                          par: 1, apply: (s, rng) => { s.outputs[rng() < 0.5 ? 'pa_l' : 'pa_r'].volume = 0; } },
  { key: 'pa-mute',      label: 'Main speaker muted',          blurb: 'One main speaker is muted, so one side of the audience is silent.', par: 1, apply: (s, rng) => { s.outputs[rng() < 0.5 ? 'pa_l' : 'pa_r'].mute = true; } },
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
  { key: 'soft-patch',   label: 'Input not patched', blurb: 'A channel gets no signal because its input is unassigned in the soft patch, even though the cable is fine.', par: 2, digital: true, apply: (s, rng) => {
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
  // 16-CHANNEL crosspatch faults — enabled by the band stage's patch UI.
  // Stage-box version: two inputs land on each other's console channel (the
  // mics stay in their inputs; the tails are swapped at the box). Fix at the
  // box: drag a tail back onto its listed channel. Par 3 — patching a live
  // channel pops, so the safe fix is master down -> swap -> master up.
  { key: 'crosspatch-box-16', label: 'Crosspatch at the stage box', blurb: 'Two inputs are landing on each other\'s channel at the stage box.', par: 3, big16only: true, apply: (s, rng) => {
    const keys = window.BAND_KEYS || [];
    for (let tries = 0; tries < 24; tries++) {
      const i = Math.floor(rng() * keys.length);
      let j = Math.floor(rng() * (keys.length - 1)); if (j >= i) j += 1;
      const a = keys[i], b = keys[j];
      const t = s.cables[a]; s.cables[a] = s.cables[b]; s.cables[b] = t;
      if (!big16CrosspatchBad(s)) return;
      const u = s.cables[a]; s.cables[a] = s.cables[b]; s.cables[b] = u; // undo, retry
    }
  } },
  // Mic in the wrong input: a mic is plugged into another input on the SAME
  // sub-snake, so it comes up on that input's channel. The sub-snake slot shows
  // the wrong instrument. Fix at the STAGE: drag the mic back to its listed
  // input (that swaps both mics' inputs and channels back).
  { key: 'mic-wrong-input-16', label: 'Mic in the wrong input', blurb: 'A mic is plugged into the wrong sub-snake input, so it comes up on the wrong channel.', par: 3, big16only: true, apply: (s, rng) => {
    const keys = window.BAND_KEYS || [];
    const SRC = window.SOURCES || {};
    const bySnake = {};
    for (const k of keys) { const sn = (SRC[k] || {}).snake; if (!sn) continue; (bySnake[sn] = bySnake[sn] || []).push(k); }
    const snakes = Object.keys(bySnake).filter((sn) => bySnake[sn].length >= 2);
    if (!snakes.length) return;
    ensureMicIn16(s);
    for (let tries = 0; tries < 24; tries++) {
      const grp = bySnake[snakes[Math.floor(rng() * snakes.length)]];
      const i = Math.floor(rng() * grp.length);
      let j = Math.floor(rng() * (grp.length - 1)); if (j >= i) j += 1;
      const a = grp[i], b = grp[j];
      const ma = s.micIn[a], mb = s.micIn[b]; s.micIn[a] = mb; s.micIn[b] = ma;
      const ca = s.cables[a], cb = s.cables[b]; s.cables[a] = cb; s.cables[b] = ca;
      if (!big16CrosspatchBad(s)) return;
      s.micIn[a] = ma; s.micIn[b] = mb; s.cables[a] = ca; s.cables[b] = cb; // undo, retry
    }
  } },
  // Crossed at the CONSOLE fan-out: two snake tails land on each other's channel
  // at FOH (the fan-out map, not the stage box). Both sources stay audible but on
  // swapped channels; the console INPUT chip shows the port/CH mismatch and the
  // fan-out tails cross on the MIXER view. Fix at the CONSOLE (drag a fan-out
  // tail back), not the stage box — that's the distinct skill from the stage-box
  // crosspatch. Par 3: patching a live channel pops, so master down first.
  { key: 'crosspatch-fanout-16', label: 'Crossed at the console fan-out', blurb: 'Two snake tails are landing on each other\'s channel at the console fan-out.', par: 3, big16only: true, apply: (s, rng) => {
    if (!s.fanOut || !s.fanOut.length) return;
    const n = s.fanOut.length;
    for (let tries = 0; tries < 24; tries++) {
      const i = Math.floor(rng() * n);
      let j = Math.floor(rng() * (n - 1)); if (j >= i) j += 1;
      const t = s.fanOut[i]; s.fanOut[i] = s.fanOut[j]; s.fanOut[j] = t;
      if (!big16CrosspatchBad(s)) return;
      const u = s.fanOut[i]; s.fanOut[i] = s.fanOut[j]; s.fanOut[j] = u; // undo, retry
    }
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
        gainStructure: { refChannel: 3, inputBand: [0.645, 4.566], gainOnly: true },
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
      // passing signal, the PA and both wedges, one at a time. This checks the
      // OUTPUTS — it is NOT a line check (a line check verifies the inputs).
      for (let i = 0; i < 4; i++) { s.channels[i].mute = true; }
      s.channels[6].mute = false; s.channels[6].gain = window.HEALTHY_GAIN_BY_CH[6]; s.channels[6].fader = 0.75; s.channels[6].aux1 = 0; s.channels[6].aux2 = 0;
      s.outputs.wedge = { ...s.outputs.wedge, on: true, mute: false, volume: 0.6 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: true, mute: false, volume: 0.6 };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: false, volume: 0 };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: false, volume: 0 };
      return {
        conditions: [],
        verifyEach: [
          { source: 'playback', dest: 'pa',     min: 0.30, label: 'PA passes signal' },
          { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 passes signal' },
          { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 passes signal' },
        ],
        symptom: 'Confirm every speaker is passing signal: the mains and both wedges. Send the playback to each one. They check off as they play.',
        title: 'Check the Speakers',
        hint: 'Send the playback to the PA on its fader, then open AUX 1 and AUX 2, one per wedge. Each speaker checks off once it plays, so you can move on.',
        solution: 'Playback sent to the PA and both wedges: every speaker proven to pass signal, before a single input matters.',
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
// Calibration (verified live against the engine, staging v72): the wedge's
// tallest resonance rings once the singer's contribution to it crosses ~0.68
// (FEED_0DB / 1.22), which a vocal reaches at an aux send of ~0.60. Start send
// 0.18 sits far below that (contribution ~0.09, dead silent). Win min 0.69 is
// just ABOVE the ring onset, so the ONLY way to satisfy it is to push through the
// ring and cut it out: pulling the send back down to kill the ring drops below
// 0.69 and fails, and at the lightest valid push a surgical one-band cut leaves
// the level at ~0.70, still over the line. Push harder and a second band joins
// (~0.79) — the real "back it off and cut" lesson, never an opening wall.
// Restricted to VOCAL mics: a kick or tom can't reach 0.69 into a wedge, and a
// singer's wedge is the real feedback-and-monitor scenario.
window.MONITOR_RING = {
  key: 'monitor-ring', label: 'Ring out the monitor', par: 2,
  apply: (s, rng) => {
    const r = rng || (() => 0.5);
    let ci, auxKey, wedgeKey, wedgeLabel;
    if (s.big16) {
      // Vocal mics only: a drum/tom mic can't reach the required level into a
      // wedge, and the ring-out-a-wedge lesson is a singer's monitor.
      const vocs = pbMics(s).filter((i) => /^(vx\d|vocal)/.test(window.sourceFor(s, i) || ''));
      ci = pbPick(vocs.length ? vocs : pbMics(s), r);
      if (ci < 0) ci = 0;
    } else {
      // MX-8: Vocal 1 (ch0) or Vocal 2 (ch1).
      ci = r() < 0.5 ? 0 : 1;
    }
    const src = window.sourceFor(s, ci);
    // A singer only ever asks for more in THEIR OWN wedge — nobody asks for more
    // of themselves in another performer's monitor. Pair the picked vocalist with
    // their own wedge: vocal N -> aux N -> wedge N (perf 0..3 = wedge 1..4; the
    // MX-8 vocals map 1:1 too). This is the mono-monitor convention the whole
    // stage is built on (vocal 1 hears wedge 1, ... vocal 4 hears wedge 4).
    const perf = window.SOURCES[src] && window.SOURCES[src].perf != null ? window.SOURCES[src].perf : ci;
    const wn = Math.min(4, Math.max(1, perf + 1));
    auxKey = 'aux' + wn;
    wedgeKey = wn === 1 ? 'wedge' : 'wedge' + wn;
    wedgeLabel = 'Wedge ' + wn;
    const chLabel = (s.channels[ci] && s.channels[ci].label) || 'the vocal';
    // Latent: the singer has a little monitor, well under the ring point. The
    // wedge is live so raising the send climbs straight toward feedback.
    s.channels[ci][auxKey] = 0.18;
    if (s.outputs[wedgeKey]) { s.outputs[wedgeKey].on = true; s.outputs[wedgeKey].mute = false; s.outputs[wedgeKey].volume = 0.78; }
    return {
      conditions: [{ source: src, dest: wedgeKey, min: 0.69 }],
      symptom: 'The singer on ' + chLabel + ' wants more of themselves in their monitor, ' + wedgeLabel + '. Bring that send up to a strong level. As you push it, the wedge starts to ring. Find the glowing band on ' + wedgeLabel + '\'s Monitor EQ, cut it a touch to stop the ring, and leave the level up.',
      title: 'Give the Monitor More',
      hint: 'Raise the ' + auxKey.toUpperCase() + ' send on ' + chLabel + ' toward a strong level. When it rings, open ' + wedgeLabel + '\'s Monitor EQ, find the glowing band, and pull it down a few dB, just enough to stop the ring. Keep the level up, do not pull the send back down.',
      solution: 'The monitor on ' + chLabel + ' brought up to a strong level with the ring cut out on the wedge EQ. Pulling the send back down would lose the singer the monitor; ringing out the one glowing band keeps the level and kills the feedback.',
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
      // The MX-8 crosspatch faults use the 4-input model, so skip on the band;
      // the band has its own crosspatch/wrong-input faults (big16only), which in
      // turn only make sense on the 16-ch board with its stage patch UI.
      if (f.big8only && s.big16) continue;
      if (f.big16only && !s.big16) continue;
      // Free tier never gets patch / crosspatch faults: patching is the members'
      // Run the Show course, so a free Practice rep must always be solvable
      // without touching the stage patch. The app sets window.PRACTICE_FREE.
      if (window.PRACTICE_FREE && /crosspatch|wrong-input|soft-patch/.test(f.key)) continue;
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
  title: 'Ear Training',
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
  symptom: 'Push Vocal 1 up in Wedge 1 to the target level. When a frequency rings, cut it on the wedge EQ, then keep climbing. Small cuts, not big ones.',
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
    // Ring out against an open mic with no one singing, like a real soundcheck.
    // The vocal's sample is muted (no loop hammering the ear), but the mic stays
    // open so the wedge still rings as the send comes up.
    s.programMute = { ...s.programMute, vocal: true };
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
    title: 'Lead vocal is missing',
    symptom: 'The lead vocal is not coming through the PA. Get it back into the mix.',
    hint: 'Everything upstream looks fine. Check the channel itself before you touch the gain.',
    solution: 'Channel 1 was muted, so the lead vocal never reached the mix. Unmuting it put it back in the PA. When one source is missing and the rest sound fine, check the channel mute first.',
    conditions: [],
    start: {"channels":[{"label":"Vocal 1","gain":0.48,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":true,"solo":false,"fader":0.72,"inputTrim":1,"id":1},{"label":"Vocal 2","gain":0.42,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":2},{"label":"Bass","gain":0.77,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.65,"inputTrim":1,"id":3},{"label":"Keys","gain":0.23,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.6,"inputTrim":1,"id":4},{"label":"5/6","gain":0.20,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.7,"inputTrim":1,"id":5,"stereo":true}],"mixer":{"on":true},"master":{"fader":0.75,"mute":false,"aux1":0.75,"aux2":0.75},"outputs":{"pa_l":{"on":true,"mute":false,"volume":0.7},"pa_r":{"on":true,"mute":false,"volume":0.7},"wedge":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":15},"wedge2":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":12},"amp":{"on":true}},"cables":{"vocal":1,"vocal2":2,"guitar":3,"laptop":4},"outFan":{"1":"mainL","2":"mainR","3":"aux1","4":"aux2"},"outPatch":{"pa_l":1,"pa_r":2,"wedge":3,"wedge2":4},"fanOut":[1,2,3,4],"sourceMute":{"vocal":false,"guitar":false,"laptop":false,"vocal2":false,"playback":false},"playbackMode":"music","testing":"vocal","inspect":"pa","topology":{"mixerLocation":"side-stage","paRig":"powered","wedgeLocation":"stage"}},
  },
  {
    id: 'pa-side-quiet',
    title: 'One side of the audience is quiet',
    symptom: 'The right side of the audience is getting a lot less than the left. Even out the two main speakers so the whole audience hears the same mix.',
    hint: 'This is a PA output level, not a channel. Check the two mains against each other.',
    solution: 'Main R was turned down well below Main L, so half the audience got a thin mix. Matching the two main outputs evened out the coverage. Keep your main sides level so the whole audience hears the same thing.',
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
  // A healthy, fully patched show: PA up, both wedges on and powered, every
  // aux send zeroed so the student builds each monitor mix from nothing. The
  // bass DI is active, so it needs phantom on to be live.
  s.master.fader = 0.75; s.master.mute = false;
  s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
  s.outputs.wedge.on  = true; s.outputs.wedge.volume  = 0.6; s.outputs.wedge.mute  = false;
  s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
  s.outputs.wedge3.on = false; s.outputs.wedge3.volume = 0;
  s.outputs.wedge4.on = false; s.outputs.wedge4.volume = 0;
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
    symptom: 'A wedge is a separate mix from the main outputs. Send Vocal 1 to Wedge 1.',
    hint: 'Wedge 1 is on and turned up. Send Vocal 1 to it with AUX 1 on the Vocal 1 channel. The main mix does not change.',
    hints: [
      { title: 'Vocal 1 in Wedge 1', target: 'ch1-aux', teach: 'A wedge is a separate mix for the stage. AUX 1, an aux send, feeds Wedge 1, so opening it on a channel adds that channel to Wedge 1 without touching the main outputs.', text: 'Send Vocal 1 to Wedge 1 with AUX 1 on the Vocal 1 channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.3) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.3 },
    ],
    sabotage: (s) => mwBoard(s),
    solution: 'AUX 1 up on the Vocal 1 channel sends it to Wedge 1. The monitor send is a separate mix from the main outputs.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw2',
    title: 'A bit of everyone',
    task: true,
    symptom: 'A wedge is more than one channel. Vocal 1 is already in Wedge 1. Add Vocal 2 and a little keys, both under Vocal 1.',
    hint: 'Vocal 1 is already in Wedge 1. Add Vocal 2 with AUX 1 on the Vocal 2 channel, and a touch of keys with AUX 1 on the Keys channel. Keep both under Vocal 1.',
    hints: [
      { title: 'Add Vocal 2', target: 'ch2-aux', teach: 'A monitor usually needs a bit of each vocal. AUX 1 on Vocal 2 adds it to Wedge 1, tucked under Vocal 1: audible, not competing.', text: 'Add Vocal 2 to Wedge 1, under Vocal 1: AUX 1 on the Vocal 2 channel.', done: (ctx) => { var a = ctx && ctx.audio && ctx.audio.contributions; var c = a && a.vocal2; var l = c ? (c.wedge || 0) : 0; return l >= 0.22 && l <= 0.30; } },
      { title: 'Add a little keys', target: 'ch4-aux', teach: 'A little of a tuned instrument helps with pitch. Keep the keys well under the vocals.', text: 'Add a touch of keys, well under the vocals: AUX 1 on the Keys channel.', done: (ctx) => { var a = ctx && ctx.audio && ctx.audio.contributions; var c = a && a.laptop; var l = c ? (c.wedge || 0) : 0; return l >= 0.18 && l <= 0.26; } },
    ],
    involves: [1, 2, 3, 4],
    // "Under Vocal 1" is graded, not just described: Vocal 1 rests at ~0.33,
    // so the supporting sends carry ceilings that keep them genuinely under.
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.3 },
      { source: 'vocal2', dest: 'wedge', min: 0.22, max: 0.30 },
      { source: 'laptop', dest: 'wedge', min: 0.18, max: 0.26 },
    ],
    sabotage: (s) => { mwBoard(s); s.channels[0].aux1 = 0.6; return s; },
    solution: 'Wedge 1 is Vocal 1 up front, with Vocal 2 and a little keys underneath. The performer\'s own source leads; everything else sits under it.',
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
      { title: 'Add Vocal 1', target: 'ch1-aux', teach: '', text: 'Add the other vocal, tucked under this one: AUX 2 on the Vocal 1 channel.', done: (ctx) => { var a = ctx && ctx.audio && ctx.audio.contributions; var c = a && a.vocal; var l = c ? (c.wedge2 || 0) : 0; return l >= 0.22 && l <= 0.30; } },
      { title: 'A little keys', target: 'ch4-aux', teach: '', text: 'Add a little keys, well under the vocals: AUX 2 on the Keys channel.', done: (ctx) => { var a = ctx && ctx.audio && ctx.audio.contributions; var c = a && a.laptop; var l = c ? (c.wedge2 || 0) : 0; return l >= 0.18 && l <= 0.26; } },
    ],
    involves: [1, 2, 3, 4],
    // Same graded hierarchy as mw2: Vocal 2 leads at 0.35+, the support stays under.
    conditions: [
      { source: 'vocal2', dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'wedge2', min: 0.35 },
      { source: 'vocal', dest: 'wedge2', min: 0.22, max: 0.30 },
      { source: 'laptop', dest: 'wedge2', min: 0.18, max: 0.26 },
    ],
    sabotage: (s) => mwBoard(s),
    solution: 'Wedge 2 is Vocal 2 up front, with Vocal 1 and a little keys underneath. Same idea as Wedge 1, on its own send.',
    defaultInspect: 'wedge2',
  },
  {
    id: 'mw4',
    title: 'Both vocal monitors',
    task: true,
    symptom: 'Both vocal monitors at once. Wedge 1 is Vocal 1\'s monitor; Wedge 2 is Vocal 2\'s. Get each singer up in their own wedge.',
    hint: 'Wedge 1 runs off AUX 1, Wedge 2 off AUX 2. Bring Vocal 1 up on AUX 1 for their wedge, and Vocal 2 up on AUX 2 for theirs. Each singer is loudest in their own monitor.',
    hints: [
      { title: 'Vocal 1 in Wedge 1', target: 'ch1-aux', teach: 'Each singer hears their own monitor. Vocal 1 is loudest in Wedge 1, on AUX 1.', text: 'Vocal 1 in Wedge 1: AUX 1 on the Vocal 1 channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.3) },
      { title: 'Vocal 2 in Wedge 2', target: 'ch2-aux', teach: '', text: 'Same on the other monitor: AUX 2 on the Vocal 2 channel.', done: (ctx) => hintReaches(ctx, 'vocal2', 'wedge2', 0.35) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.3 },
      { source: 'vocal2', dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'wedge2', min: 0.35 },
    ],
    sabotage: (s) => mwBoard(s),
    solution: 'Two wedges, two singers. Vocal 1 up in Wedge 1, Vocal 2 up in Wedge 2. Each performer hears themselves loudest in their own monitor.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mwHpf',
    title: 'The Low Ring',
    task: true,
    requireHpfOn: [1],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.3 },
    ],
    toneGate: 0.85,
    symptom: 'Vocal 1\'s wedge is growling right now: a low, boomy ring, far below her voice, at a level she actually needs. Stop the ring without giving up her level.',
    hint: 'Pulling the send down stops the ring but loses her the monitor, and it rings again the moment you bring her back. The ring lives below the voice, so the tool is the high-pass filter (HPF): it cuts everything under a set low point. Engage it on channel 1 and the ring stops with the level still up.',
    hints: [
      { title: 'Cut the lows, keep the level', target: 'ch1-hpf', teach: 'Pulling the send down stops the ring and loses her the monitor. This ring lives far below her voice, so take the lows out of the loop instead: the high-pass filter (HPF) cuts everything under a set low point, and her voice is not down there.', text: 'Engage HPF on channel 1 and keep the send where she needs it.', done: (ctx) => !!(ctx.state.channels[0] && ctx.state.channels[0].highpass && !ctx.feedback) },
    ],
    sabotage: (s) => {
      // This wedge's resonance sits at 100 Hz, exactly where an HPF works.
      // +8.9 dB (2.8x) puts the ring onset at ~0.30 contribution: the level
      // the win demands cannot be held without the HPF (pull the send down
      // and it rings again on the way back up). The board loads mid-ring at
      // ~0.35, inside the band where the HPF's -4.4 dB of low relief kills
      // even a sustained ring, and with the HPF in there is comfortable room
      // up to ~0.49 before it can ring again. Every other band sits at -6 dB
      // and can never ring here, so the ring is always the low one.
      mwBoard(s);
      const prof = new Array(25).fill(0.5); prof[2] = 2.8;
      s.outputs.wedge.fbProfile = prof;
      s.channels[0].aux1 = 0.62;
      s.channels[0].highpass = false;
      return s;
    },
    solution: 'The ring lived below the voice, so the HPF killed it without touching a single send: everything under the filter point dropped out of the loop, and her voice was never down there. When a wedge rings low and boomy, reach for the HPF before the EQ. On a bass or kick channel those lows are the instrument, so the filter stays off there.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw5',
    title: 'Keep the stage quiet',
    task: true,
    symptom: 'Wedge 1 is cranked: loud enough to start a volume war and ring with feedback. Bring Vocal 1 back to a useful level, loud enough to hear, not blasting.',
    hint: 'Pull AUX 1 on the Vocal 1 channel down to where it is clear without dominating the stage. If it is ringing, bringing it down stops that too.',
    hints: [
      { title: 'Pull Wedge 1 back', target: 'ch1-aux', teach: 'A quieter stage means less feedback and a cleaner main mix. Bring the send down to where it is still audible, not so far it is gone. As it drops, the ringing stops.', text: 'Bring AUX 1 on the Vocal 1 channel down to a sensible level, not cranked and not gone.', done: (ctx) => { var a = ctx && ctx.audio; var c = a && a.contributions && a.contributions.vocal; var l = c ? (c.wedge || 0) : 0; return l >= 0.22 && l <= 0.40; } },
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
    id: 'mwMoreMe',
    title: 'More me',
    task: true,
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.3, max: 0.4 },
      { source: 'vocal2', dest: 'wedge', min: 0, max: 0.12 },
      { source: 'guitar', dest: 'wedge', min: 0, max: 0.12 },
      { source: 'laptop', dest: 'wedge', min: 0, max: 0.12 },
    ],
    symptom: 'The singer turns around mid-song and mouths "more me." Her wedge is already loud: the whole band is in it. Give her what she is asking for without making the wedge any louder.',
    hint: 'When a wedge is already working hard, "more me" rarely means push the vocal up. It means everything else comes down. Her send is already strong; leave it where it is and pull the other sends out of Wedge 1 until her voice sits on top.',
    hints: [
      { title: 'Everyone else down', target: ['ch2-aux', 'ch3-aux', 'ch4-aux'], teach: 'A wedge only has so much level to give before it rings. Her voice is buried because the band is using all of it. Pull the other sends down and her voice stands out, without the wedge working any harder.', text: 'Pull AUX 1 down on channels 2, 3, and 4 until they are barely there, well under the voice.', done: (ctx) => { var a = ctx && ctx.audio && ctx.audio.contributions; if (!a) return false; var g = (a.guitar && a.guitar.wedge) || 0; var l = (a.laptop && a.laptop.wedge) || 0; var v2 = (a.vocal2 && a.vocal2.wedge) || 0; return g <= 0.12 && l <= 0.12 && v2 <= 0.12; } },
    ],
    sabotage: (s) => {
      // Her send starts strong (0.6 ~ a 0.33 contribution, already inside the
      // win corridor) so the ONLY work is subtraction: the band comes down.
      // The vocal corridor's max refuses the crank-her-up path outright.
      mwBoard(s);
      s.channels[0].aux1 = 0.6;
      s.channels[1].aux1 = 0.3;
      s.channels[2].aux1 = 0.4;
      s.channels[3].aux1 = 0.4;
      return s;
    },
    solution: '"More me" was everyone else coming down. The voice ended on top, the wedge got no louder, and the stage got cleaner. Push the singer up only after the rest is out of the way.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mwShare',
    title: 'One wedge, two singers',
    task: true,
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.2, max: 0.38 },
      { source: 'vocal2', dest: 'wedge', min: 0.2, max: 0.38 },
      { source: 'guitar', dest: 'wedge', min: 0, max: 0.1 },
      { source: 'laptop', dest: 'wedge', min: 0, max: 0.1 },
    ],
    symptom: 'Wedge 2 went down during load-in, so both singers work off Wedge 1 tonight. Vocal 1 is set like she owns it, and Vocal 2 cannot hear herself at all. Make one wedge work for two people.',
    hint: 'A shared wedge is a budget. Two voices fit only if each takes less than it would alone. Bring Vocal 1 down from full, bring Vocal 2 up beside her, and keep the band out of the way.',
    hints: [
      { title: 'Vocal 1 makes room', target: 'ch1-aux', teach: 'Set like a solo wedge, her level leaves no space for a second voice. Sharing means she comes down to make room, not because she matters less.', text: 'Bring AUX 1 on the Vocal 1 channel down from cranked to a moderate level.', done: (ctx) => { var a = ctx && ctx.audio && ctx.audio.contributions; var c = a && a.vocal; var l = c ? (c.wedge || 0) : 0; return l >= 0.2 && l <= 0.38; } },
      { title: 'Vocal 2 joins', target: 'ch2-aux', teach: 'Now there is budget for the second voice, at a level that sits beside the first.', text: 'Bring AUX 1 on the Vocal 2 channel up beside Vocal 1, not past her.', done: (ctx) => { var a = ctx && ctx.audio && ctx.audio.contributions; var c = a && a.vocal2; var l = c ? (c.wedge || 0) : 0; return l >= 0.2 && l <= 0.38; } },
      { title: 'Keep the band out', target: ['ch3-aux', 'ch4-aux'], teach: 'On a shared vocal wedge, the band is a guest at best. Every bit of bass and keys in it is space the voices no longer have.', text: 'Pull the bass send down and keep the keys out of Wedge 1.', done: (ctx) => { var a = ctx && ctx.audio && ctx.audio.contributions; if (!a) return false; var g = (a.guitar && a.guitar.wedge) || 0; var l = (a.laptop && a.laptop.wedge) || 0; return g <= 0.1 && l <= 0.1; } },
    ],
    sabotage: (s) => {
      mwBoard(s);
      s.outputs.wedge2.on = false; s.outputs.wedge2.volume = 0;
      s.channels[0].aux1 = 0.75;
      s.channels[1].aux1 = 0;
      s.channels[2].aux1 = 0.5;
      s.channels[3].aux1 = 0;
      return s;
    },
    solution: 'Vocal 1 came down to make room, Vocal 2 came up beside her, and the band stayed out. A shared wedge is a budget: two voices fit when each takes less than it would alone.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw6',
    title: 'Ring it out',
    task: true,
    symptom: 'Vocal 1 rings in Wedge 1 as soon as you push it. Get it up to a strong level and ring out the feedback on the monitor EQ.',
    hint: 'Bring AUX 1 on the Vocal 1 channel up. When it rings, open the Wedge 1 Monitor EQ: the ringing band glows. Pull that band down far enough to stop the ring, no more.',
    hints: [
      { title: 'Push it until it rings', target: 'ch1-aux', teach: '', text: 'Find its limit: push AUX 1 on the Vocal 1 channel until Wedge 1 is strong and starts to ring.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.5) },
      { title: 'Ring it out', target: 'out-wedge1', teach: 'The monitor EQ splits the wedge\'s sound into narrow frequency bands, low to high. The ring lives in one of them, and that band glows. Cut just that band, enough to kill the ring, and the level stays up.', text: 'Ring it out: pull the glowing band down on the Wedge 1 Monitor EQ, enough to stop it.', done: (ctx) => !ctx.feedback && (((ctx.state.outputs.wedge || {}).eq) || []).some((v) => v < 0) },
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
    solution: 'Push Vocal 1 up, then ring it out: pull the glowing band down on the Monitor EQ to cut the ringing frequency. A few small cuts buy a lot of level: when the free headroom is spent, the monitor EQ is how you buy more.',
    defaultInspect: 'wedge',
    // Tighter than the old 0.6 (which let a player cut 40% of the wedge and
    // still "pass" tone — exactly the shotgun-cutting the ring-out teaches
    // against). 0.8 still leaves an intro lesson room for a few real cuts.
    toneGate: 0.8,
  },
];

// ============================================================
// PATCHING (members' course) — Kyle 2026-07-11
// Breaks the one overwhelming "Patch the System" lesson into digestible
// pieces and adds fault-finding. The whole course is objective: a cable is in
// the right port or it isn't. Setup lessons grade with requirePatch (the
// identity check at staging.html); the disconnected-cable lesson grades with a
// signal condition (the source has to reach the PA again). All MX-8.
// Board note: every lesson runs on the MX-8 (loadLevel passes defaultState as
// the sabotage base). requirePatch asserts the identity map (vocal->1,
// vocal2->2, guitar->3, laptop->4, identity fan-out, home returns), so a setup
// lesson can disconnect PART of that map and leave the rest intact: the user
// restores their part and the whole map reads identity again and the win
// latches. First slice (read the list, patch the outputs, disconnected cable);
// cross-patch, snakes and sub-snakes, and a whole sub-snake down come next.
// ============================================================
window.PATCHING = [
  {
    id: 'pt0',
    title: 'Meet the Snake',
    task: true,
    requirePatch: true,
    // The lesson's wrap-up step is "disengage PFL" — the win waits for it.
    requireNoPfl: true,
    involves: [],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'Every cable on stage plugs into a numbered port on the stage box, and one thick cable, the snake, carries them all to the console. The snake is patched one-to-one: stage port 1 feeds console input 1, port 2 feeds input 2, all the way down. That promise is what lets you trust the board. Learn to follow it, then repatch the two inputs that broke it.',
    hint: 'Open the Input List for the plan, then follow channel 1: Vocal 1 plugs into stage port 1, the snake carries port 1 up to the console as tail 1, and tail 1 patches into console input 1. PFL channel 1 and the input meter proves it. Inputs 3 and 4 broke the promise: their tails are crossed at the console. Drag either tail onto its matching input and the two swap back.',
    hints: [
      { title: 'Open the Input List', target: 'iolist', teach: 'The Input List tells you which mixer channel each input and output should be connected to.', text: 'Open the Input List in the top bar.', done: (ctx) => { const f = ctx.state.fanOut || []; return !!(ctx.ioListOpen || (f[2] === 3 && f[3] === 4)); } },
      { title: 'Follow channel 1 home', target: ['src-vocal', 'conn-stage-in-1', 'conn-in-0', 'ch1-pfl'], flow: { source: 'vocal' }, teach: 'This is what CORRECT looks like. Vocal 1 plugs into stage box port 1. The snake carries port 1 up to the console and fans out as tail 1, and tail 1 patches into console input 1. One straight line, stage to board. Watch it light up.', text: 'Press PFL (pre-fade listen) on channel 1 and watch its input meter move. That is Vocal 1 arriving on console input 1.', done: (ctx) => !!((ctx.pflChannels && ctx.pflChannels[1]) || (ctx.state.channels[0] && ctx.state.channels[0].solo)) },
      { title: 'Disengage PFL', target: 'ch1-pfl', teach: 'The meter moved, so Vocal 1 is exactly where the Input List says. Disengage PFL and move on.', text: 'Press PFL on channel 1 again to disengage it.', done: (ctx) => !!(ctx.pflChannels && ctx.pflChannels[1] && ctx.state.channels.every((c) => !c.solo)) },
      { title: 'Repatch inputs 3 and 4', target: ['conn-in-2', 'conn-in-3'], teach: 'Channels 3 and 4 broke the promise: at the console, tail 3 landed on channel 4 and tail 4 on channel 3, so the bass is arriving on the keys\' channel. You can see it on the connection points: channel 3 reads INPUT 4 and channel 4 reads INPUT 3. The fix happens right there: drag either tail onto its matching channel and the two swap back.', text: 'Drag tail 3 onto the connection point marked CH 3. The two crossed tails swap back in one move.', done: (ctx) => { const f = ctx.state.fanOut || []; return f[0] === 1 && f[1] === 2 && f[2] === 3 && f[3] === 4; } },
    ],
    sabotage: (s) => {
      // The concept lesson. Everything at the stage is patched right; the
      // snake's fan-out at the console has tails 3 and 4 crossed, so channels
      // 1 and 2 demonstrate the one-to-one promise WORKING (step 2's PFL
      // proof) while 3 and 4 show it broken. Console ON so the input meters
      // are alive for the follow-it-home step; every speaker OFF and master
      // down, so no repatch here can pop anything (the pop discipline is
      // taught later, in Fader Up, No Signal).
      s.fanOut = [1, 2, 4, 3];
      s.mixer = { on: true };
      // involves: [] zeroes every strip (mute on, fader and gain at 0) — the
      // right resting state for this lesson, except channels 1-2 get their
      // input GAINS back so channel 1's meter reads and PFL has something to
      // play (step 2's proof is watching that meter move). Channels 3-4 stay
      // at zero gain: the crossed tails put the hot keys line on the bass
      // channel, and the bass channel's healthy gain would drive it into the
      // red — a distraction this lesson does not need.
      s.channels.forEach((c, i) => { if (i < 2) c.gain = (window.HEALTHY_GAIN_BY_CH && window.HEALTHY_GAIN_BY_CH[i]) || c.gain; });
      // Vocal 2 is a condenser: its +48V comes back with its gain (normalize
      // stripped it), so a student who PFLs channel 2 to compare sees the
      // promise working there too, not a second mystery fault.
      s.channels[1].phantom = true;
      s.master = { ...s.master, mute: true, fader: 0 };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false, volume: 0 };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false, volume: 0 };
      s.outputs.wedge = { ...s.outputs.wedge, on: false, volume: 0 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false, volume: 0 };
      return s;
    },
    solution: 'The snake is simple and honest: port N rides tail N into input N. Patched one-to-one, the stage box numbers ARE the console numbers, and the Input List reads true end to end. The outputs keep the same promise in reverse: each console output rides a numbered return back down to the stage box. Any time a channel arrives somewhere unexpected, follow it back along the snake.',
    defaultInspect: 'pa',
  },
  {
    id: 'pt1',
    title: 'Read the Input List',
    task: true,
    requirePatch: true,
    involves: [],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'The input list is your plan for the whole system: every channel, the source on it, and the port it patches to. Open the Input List in the top bar, then patch each source to the port it calls for. The outputs are already connected; patching those yourself is the next lesson.',
    hint: 'Open the Input List in the top bar. Drag each source cable onto a numbered port on the stage box, the box on stage where every cable plugs in. From there one thick cable, the snake, carries them all to the console. The port colors follow the snake code: 1 brown, 2 red, 3 orange, 4 yellow. Dropping on a taken port swaps the two.',
    hints: [
      { title: 'Open the input list', target: 'iolist', teach: 'The input list is your plan, not the live cabling. It names the source on every channel and the port it patches to. Open it first, every time.', text: 'Open the Input List in the top bar.', done: (ctx) => !!(ctx.ioListOpen || (ctx.state.cables && ctx.state.cables.vocal === 1)) },
      { title: 'Patch Vocal 1', target: ['iolist-ch1', 'src-vocal', 'conn-stage-in-1'], teach: 'The list puts Vocal 1 on channel 1, so its cable goes to stage-box port 1. The port colors follow the snake code: 1 brown, 2 red, 3 orange, 4 yellow.', text: 'Drag Vocal 1\'s cable onto stage-box port 1. You can also click its PATCH button to move it to the next port.', done: (ctx) => !!(ctx.state.cables && ctx.state.cables.vocal === 1) },
      { title: 'Patch the rest of the list', target: ['src-vocal2', 'src-guitar', 'src-laptop', 'conn-stage-in-2', 'conn-stage-in-3', 'conn-stage-in-4'], teach: 'Same move three more times, against the list: Vocal 2 on port 2, the bass on port 3, the keys on port 4.', text: 'Patch Vocal 2, the Bass, and the Keys to the ports the list calls for.', done: (ctx) => !!(ctx.state.cables && ctx.state.cables.vocal2 === 2 && ctx.state.cables.guitar === 3 && ctx.state.cables.laptop === 4) },
    ],
    sabotage: (s) => {
      // Only the inputs are loose. The snake fan-out, the returns, and the
      // speakers stay connected, so requirePatch reads identity again the moment
      // the four input cables land on their ports. Rig off while patching: you
      // connect a dead system, so nothing pops (patching live is taught later).
      s.cables = { vocal: 0, vocal2: 0, guitar: 0, laptop: 0 };
      s.mixer = { on: false };
      s.master = { ...s.master, mute: true, fader: 0 };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false, volume: 0 };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false, volume: 0 };
      s.outputs.wedge = { ...s.outputs.wedge, on: false, volume: 0 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false, volume: 0 };
      return s;
    },
    solution: 'Each source on the port the list calls for: Vocal 1 to 1, Vocal 2 to 2, Bass to 3, Keys to 4. The input list is the plan you patch against every time.',
    defaultInspect: 'pa',
  },
  {
    id: 'pt2',
    title: 'Patch the Outputs',
    task: true,
    requirePatch: true,
    involves: [],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'The inputs are patched, but the mix has no way out yet. The lines that carry the mix from the console back out to the speakers are called returns. Start at the speakers so you know which return feeds which one, then connect the matching console output to that return.',
    hint: 'At the stage box, patch each speaker line to its out port: Main L to out 1, Main R to out 2, Wedge 1 to out 3, Wedge 2 to out 4. Then connect each console output to the same-numbered return: Main L to return 1, Main R to return 2, AUX 1 to return 3, AUX 2 to return 4.',
    hints: [
      { title: 'Open the input list', target: 'iolist', teach: 'The input list also maps the outputs: which console output feeds which speaker, and the snake return it rides. Open it for the plan.', text: 'Open the Input List in the top bar.', done: (ctx) => !!(ctx.ioListOpen || (ctx.patchStatus && ctx.patchStatus[3] && ctx.patchStatus[3].pass)) },
      { title: 'Connect the speakers', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2', 'conn-stage-out-1', 'conn-stage-out-2', 'conn-stage-out-3', 'conn-stage-out-4', 'iolist-out-mainL', 'iolist-out-mainR', 'iolist-out-aux1', 'iolist-out-aux2'], teach: 'Each speaker line plugs into a numbered out port on the stage box. The input list shows which output feeds which speaker.', text: 'Patch each speaker line to its out port: Main L to out 1, Main R to out 2, Wedge 1 to out 3, Wedge 2 to out 4.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[3] && ctx.patchStatus[3].pass },
      { title: 'Connect the console outputs', target: ['conn-out-MAIN L', 'conn-out-MAIN R', 'conn-out-AUX 1', 'conn-out-AUX 2'], teach: 'Now the console end. These four connection points are where the mix leaves the board: each output plugs into the same snake return that feeds its speaker, so the mix can travel back out.', text: 'Connect each console output to its snake return: Main L to return 1, Main R to return 2, AUX 1 to return 3, AUX 2 to return 4.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[2] && ctx.patchStatus[2].pass },
    ],
    sabotage: (s) => {
      // Inputs stay patched; only the return side the MX-8 actually uses is loose:
      // Main L/R + the two wedges (outFan returns 1-4, outPatch pa_l/pa_r/wedge/
      // wedge2). Returns 5-6 (aux3/aux4) and wedges 3-4 stay on their default
      // connection, so requirePatch (which checks all six) still latches once the
      // four real outputs are patched, and the user is never asked to touch 5-6.
      // Rig off while patching, so connecting a speaker line cannot pop.
      s.outFan = { ...s.outFan, 1: null, 2: null, 3: null, 4: null };
      s.outPatch = { ...s.outPatch, pa_l: null, pa_r: null, wedge: null, wedge2: null };
      s.mixer = { on: false };
      s.master = { ...s.master, mute: true, fader: 0 };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false, volume: 0 };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false, volume: 0 };
      s.outputs.wedge = { ...s.outputs.wedge, on: false, volume: 0 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false, volume: 0 };
      return s;
    },
    solution: 'Every speaker line on its out port and each console output on the matching return, one-to-one, just like the input snake. That is the whole system patched end to end. When you are not sure which line feeds which speaker, start at the speaker and trace it back. From here on, the course changes gears: the system is built, and the lessons are about what to do when something goes wrong.',
    defaultInspect: 'pa',
  },
  {
    id: 'pt3',
    title: 'Fader Up, No Signal',
    task: true,
    requirePatch: true,
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
    ],
    symptom: 'A new night on the same system. The band is playing, but the lead vocal is missing. Channel 1 looks right: gain up, fader up, not muted. But the input meter shows nothing. Find why, and get her back.',
    hint: 'No signal at the input meter on channel 1. That means the signal isn\'t reaching the console. Check Vocal 1 against the Input List and verify it\'s connected correctly: the cable is out at the stage box. If you plug it straight into the live channel, the pop will teach you the rule. The safe order is mute the channel, connect the cable, then unmute.',
    hints: [
      { title: 'Find why channel 1 is silent', target: ['src-vocal', 'conn-stage-in-1'], teach: 'No signal at the input meter on channel 1. That means the signal isn\'t reaching the console. Check Vocal 1 against the Input List and verify it\'s connected correctly.', text: 'Find the problem, then plug the Vocal 1 cable back in.', done: (ctx) => !!(ctx.hasPopped || (ctx.state.cables && ctx.state.cables.vocal === 1)) },
      { title: 'Repatch it safely', target: 'ch1-mute', teach: 'Plugging into a live channel sends a contact pop through the main speakers at show level. The safe order, every time: mute the channel, connect the cable, then unmute.', text: 'Mute channel 1, reconnect the cable, then unmute it.', done: (ctx) => hintReaches(ctx, 'vocal', 'pa', 0.3) },
    ],
    sabotage: (s) => {
      // A healthy, fully patched show, then the lead vocal's cable pulled loose.
      // The lesson INVITES the mistake: step 1 says plug it back in, the pop
      // block fires (plug into a live channel), and the reset hands the board
      // back with the cable out again. Step 1 stays checked through the reset
      // via ctx.hasPopped (the popped latch survives Reset), so step 2 can
      // teach the safe order to someone who now knows why it exists. A player
      // who mutes first and never pops sails through both steps clean.
      mwBoard(s);
      s.cables.vocal = 0;
      return s;
    },
    solution: 'The lead vocal\'s cable was out at the stage box. Plugging into a live channel pops the main speakers: mute the channel, connect the cable, then unmute. When a channel is set right but shows no signal, check the patch first.',
    defaultInspect: 'pa',
  },
  {
    id: 'pt4',
    title: 'The Wrong Voice on Channel 1',
    task: true,
    requirePatch: true,
    // The lesson's wrap-up step is "disengage PFL" — the win waits for it.
    requireNoPfl: true,
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'pa', min: 0.3 },
    ],
    symptom: 'Soundcheck, the band playing. Push channel 1\'s fader and the other singer gets louder. Something is crossed between the stage and the console. Find it and fix it without popping the speakers.',
    hint: 'PFL channel 1 and listen: that is not Vocal 1. The two vocal cables are in each other\'s ports at the stage box. Changing a patch on a live channel pops the speakers, so mute both channels, then move the cables so they are connected according to the input list, and unmute.',
    hints: [
      { title: 'Find who is really on channel 1', target: 'ch1-pfl', teach: 'The strip only knows its label. PFL (pre-fade listen) plays what is actually on the channel, and the Input List says what should be there. A cross-patch is invisible until you check one against the other.', text: 'PFL channel 1 and listen, then open the Input List and compare it to the stage box.', done: (ctx) => !!((ctx.pflChannels && ctx.pflChannels[1]) || (ctx.state.channels[0] && ctx.state.channels[0].solo) || (ctx.state.cables && ctx.state.cables.vocal === 1 && ctx.state.cables.vocal2 === 2)) },
      { title: 'Repatch the inputs safely', target: ['ch1-mute', 'ch2-mute', 'src-vocal', 'conn-stage-in-1', 'conn-stage-in-2'], teach: 'Changing a patch on a live channel pops the speakers. Mute the channels, then move the cables so they are connected according to the input list: drag either vocal cable onto its right port and the two swap back in one move.', text: 'Mute channels 1 and 2, then drag Vocal 1\'s cable onto port 1.', done: (ctx) => !!(ctx.state.cables && ctx.state.cables.vocal === 1 && ctx.state.cables.vocal2 === 2) },
      { title: 'Bring them back', target: ['ch1-pfl', 'ch1-mute', 'ch2-mute'], teach: 'Cables right, channels safe: open them back up and the board matches the plan again. Disengage PFL on channel 1: that check is done.', text: 'Disengage PFL on channel 1, then unmute channels 1 and 2.', done: (ctx) => !!(ctx.state.cables && ctx.state.cables.vocal === 1 && ctx.state.cables.vocal2 === 2 && hintReaches(ctx, 'vocal', 'pa', 0.3) && hintReaches(ctx, 'vocal2', 'pa', 0.3) && ctx.state.channels.every((c) => !c.solo)) },
    ],
    sabotage: (s) => {
      // A live soundcheck with the two VOCAL cables crossed at the stage box.
      // The two vocal channels run near-identical healthy gains, so nothing
      // distorts and nothing starves: the board sounds fine, and the only
      // tells are the wrong voice under each fader and the patch itself. That
      // keeps all the attention on the skill this lesson practices, the
      // patch. Swapping cables on live channels pops (patch_live), so the fix
      // is the safe repatch from the last lesson, scaled up to two channels:
      // mute both, swap, unmute.
      mwBoard(s);
      s.cables.vocal = 2;
      s.cables.vocal2 = 1;
      // +48V stays on across both vocal strips (the way last night's engineer
      // left them): Vocal 2 is a condenser, and without phantom on channel 1
      // the crossed mic would arrive silent instead of as the wrong voice.
      s.channels[0].phantom = true;
      return s;
    },
    solution: 'The two vocal cables were in each other\'s ports. The wrong voice under a fader is how a cross-patch announces itself: check the patch against the Input List and move the cables back with both channels muted. Catch it at soundcheck and the show never knows.',
    defaultInspect: 'pa',
  },
  {
    id: 'ptSwap',
    title: 'Check Every Output',
    task: true,
    requirePatch: true,
    involves: [],
    // The check ends with the test signal back out of the system: sends down
    // or the channel muted. The win cannot fire mid-test.
    conditions: [
      { source: 'playback', dest: 'pa', min: 0, max: 0.05 },
      { source: 'playback', dest: 'wedge', min: 0, max: 0.05 },
      { source: 'playback', dest: 'wedge2', min: 0, max: 0.05 },
    ],
    // Each output latches the moment the playback reaches it, so the win
    // requires every output to have actually played the test signal. The two
    // mains are one-sided checks (othersMax): Main L only counts while Main R
    // is silent, so a center-pan blast cannot tick both at once — and the
    // engine clears every latch when the output patch moves, so checks made
    // through the crossed lines do not survive the fix.
    verifyEach: [
      { source: 'playback', dest: 'pa_l', min: 0.2, othersMax: { pa_r: 0.05 }, label: 'Main L checked' },
      { source: 'playback', dest: 'pa_r', min: 0.2, othersMax: { pa_l: 0.05 }, label: 'Main R checked' },
      { source: 'playback', dest: 'wedge', min: 0.2, label: 'Wedge 1 checked' },
      { source: 'playback', dest: 'wedge2', min: 0.2, label: 'Wedge 2 checked' },
    ],
    // The check ends with every speaker back on: a board whose mains never
    // came back is not a verified board.
    requireOutputsOn: ['pa_l', 'pa_r', 'wedge', 'wedge2'],
    symptom: 'The system is patched and the band has not arrived. Before anyone trusts it, test every output with the playback device, one at a time: left main speaker, right main speaker, then each wedge. Something is not where it claims to be.',
    hint: 'Unmute PLAYBACK: it is already panned hard left (the BAL knob on the PLAYBACK strip), so only the left main speaker should answer. Here the right side plays instead, because the two main speaker lines are crossed at the stage box. Speakers off, swap the lines, speakers back. Then run the whole test again on the fixed lines: pan hard left, pan hard right, then send the playback to Wedge 1 and Wedge 2 with its AUX sends, one at a time. Zero the sends and mute the playback when you are done.',
    hints: [
      { title: 'Playback to the left main speaker', target: 'ch7-mute', teach: 'The playback device is your test signal: it plays on cue and nobody has to sing. It is already panned hard left, so only the left main speaker should answer. Watch the SIG lights on the two main speakers: if the right side plays, the main lines are crossed.', text: 'Unmute PLAYBACK. Watch which main speaker plays.', done: (ctx) => !!((ctx.verifyStatus && (ctx.verifyStatus.pa_l || ctx.verifyStatus.pa_r)) || (ctx.patchStatus && ctx.patchStatus[3] && ctx.patchStatus[3].pass) || (ctx.state.outPatch && !(ctx.state.outPatch.pa_l === 2 && ctx.state.outPatch.pa_r === 1))) },
      { title: 'Repatch the outputs safely', target: ['out-pa-l', 'out-pa-r', 'conn-stage-out-1', 'conn-stage-out-2'], teach: 'Panning the signal to the left should have sent it to the left speaker, but it came out of the right speaker. That means the connections to the main speakers are crossed. Moving a live speaker\'s line pops it, so switch both main speakers off, swap the lines, then bring the speakers back on.', text: 'Switch both main speakers off, swap the two main speaker lines, then switch them back on.', done: (ctx) => !!(ctx.patchStatus && ctx.patchStatus[3] && ctx.patchStatus[3].pass && ctx.state.outputs.pa_l.on && ctx.state.outputs.pa_r.on) },
      { title: 'Prove left and right', target: 'ch7-pan', teach: 'After any fix, run the same test again so you hear what CORRECT sounds like: pan hard left and the left main speaker answers, pan hard right and the right one does. Left is left, right is right.', text: 'Pan the playback hard left with the BAL knob, listen, then hard right.', done: (ctx) => !!(ctx.patchStatus && ctx.patchStatus[3] && ctx.patchStatus[3].pass && ctx.verifyStatus && ctx.verifyStatus.pa_l && ctx.verifyStatus.pa_r) },
      { title: 'Check the wedges, one at a time', target: 'ch7-aux', teach: 'Every output gets the same treatment. AUX 1 sends the playback to Wedge 1, AUX 2 to Wedge 2: bring one up, hear it, pull it back, then the next.', text: 'Send the playback to Wedge 1 with AUX 1, then to Wedge 2 with AUX 2.', done: (ctx) => !!(ctx.verifyStatus && ctx.verifyStatus.wedge && ctx.verifyStatus.wedge2) },
      { title: 'Zero the test', target: 'ch7-strip', teach: 'The check is done, so the test signal comes back out: sends down, pan centered, playback muted. The board is verified and quiet, every speaker still on, ready for the band.', text: 'Pull the AUX sends back down, center the pan, and mute PLAYBACK, with every speaker still on.', done: (ctx) => { const v = ctx.verifyStatus; if (!(v && v.pa_l && v.pa_r && v.wedge && v.wedge2)) return false; const o = ctx.state.outputs; if (!(o.pa_l.on && o.pa_r.on && o.wedge.on && o.wedge2.on)) return false; const a = ctx.audio && ctx.audio.contributions && ctx.audio.contributions.playback; if (!a) return false; return Math.max(a.pa_l || 0, a.pa_r || 0, a.wedge || 0, a.wedge2 || 0) <= 0.05; } },
    ],
    sabotage: (s) => {
      // The pre-show output check, the way it actually happens: the band's
      // channels stay muted and the playback device is the test signal. The
      // two PA lines are crossed at the stage box; the left-pan test exposes
      // it (both PA meters read the same on a left-right swap, so only a
      // one-side test can catch it). verifyEach latches each output as the
      // playback reaches it, and the max conditions demand the test signal is
      // zeroed again before the win, so the whole check has to happen.
      mwBoard(s);
      s.channels[0].mute = true;
      s.channels[1].mute = true;
      s.channels[2].mute = true;
      s.channels[3].mute = true;
      const pb = s.channels[6];
      if (pb) {
        // Pan starts HARD LEFT so the very first unmute IS the one-side test:
        // at center pan both mains carry the signal and the crossed lines
        // would be invisible (and both verify latches would tick at once).
        pb.mute = true; pb.fader = 0.72; pb.pan = 0; pb.aux1 = 0; pb.aux2 = 0;
        // The playback line arrives pre-gained (this lesson checks outputs,
        // not gain staging): hard-panned it reaches ~0.46, comfortably over
        // the 0.2 verify latches.
        pb.gain = (window.HEALTHY_GAIN_BY_CH && window.HEALTHY_GAIN_BY_CH[6]) || 0.2;
      }
      s.outPatch = { ...s.outPatch, pa_l: 2, pa_r: 1 };
      return s;
    },
    solution: 'Test the outputs before the show, one at a time: playback panned left, panned right, then each wedge on its send. The check caught the crossed main speaker lines the meters never would (both sides read the same on a left-right swap). Speakers off, swap, speakers back, and zero the test signal when you are done.',
    defaultInspect: 'pa',
  },
  {
    id: 'pt5',
    title: 'Loose at the Sub-Snake',
    task: true,
    requirePatch: true,
    involves: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    conditions: [],
    symptom: 'This is the full 16-channel system. The band\'s mics reach the console in bundles called sub-snakes: the drums on one, the vocals on another, the instruments on a third. At the patch check, one drum line never made it down to the stage box. Find it and reconnect it.',
    hint: 'A sub-snake gathers a group of mics and carries them to the console on the main snake. The Input List says which channel each mic belongs on; it does not show the sub-snakes, so you follow the connections yourself: from each mic, into its sub-snake, down to the stage box. The loose one is the kick, which belongs on channel 1: its line stops at the drum sub-snake and never reaches the stage box. Reconnect its cable, or click its PATCH button.',
    hints: [
      { title: 'Open the input list', target: 'iolist', teach: 'The input list gives every mic its channel; it does not show the sub-snakes. To find a problem on a big system you follow the connections: from the source, into its sub-snake, down to the stage box, and up to the console.', text: 'Open the Input List to see what belongs on each channel.', done: (ctx) => !!(ctx.ioListOpen || (ctx.state.cables && ctx.state.cables.kick === 1)) },
      { title: 'Find the loose line', target: ['src-kick', 'conn-stage-in-1'], teach: 'One loose line means one mic is out; if a whole sub-snake were disconnected, the entire section would go with it. Walk the drum sub-snake down to the stage box and find the line that never got connected.', text: 'Find the loose drum line and reconnect it. You can also click its PATCH button.', done: (ctx) => !!(ctx.state.cables && ctx.state.cables.kick === 1) },
    ],
    sabotage: (s) => {
      // The full 16-channel band. Rig off (line check before the show), and the
      // kick drum's tail is loose at the drum sub-snake, so channel 1 is dead.
      // requirePatch (big16PatchOk) latches when the kick is back on channel 1.
      const b = bandState();
      b.cables.kick = 0;
      b.mixer = { on: false };
      b.master = { ...b.master, mute: true, fader: 0 };
      ['pa_l', 'pa_r', 'wedge', 'wedge2', 'wedge3', 'wedge4'].forEach((k) => { if (b.outputs[k]) b.outputs[k] = { ...b.outputs[k], on: false, volume: 0 }; });
      return b;
    },
    solution: 'The kick\'s line was loose where the drum sub-snake meets the stage box, so nothing from the kick would ever reach channel 1. One loose line takes out one mic; a disconnected sub-snake takes out its whole section. On a big system the mics reach the console in groups, one sub-snake per section.',
    defaultInspect: 'pa',
  },
];

// ── POWER course (staging prototype) ─────────────────────────────────────
// Power Up / Power Down as its own mini-course: the order discipline first
// (up, then down), a recovery lesson for finding a system half-powered in the
// wrong order, then two dead-system fault hunts (MX-8, then the 16-channel
// board). Wins ride requirePowerOn / requirePowerOff, which are board-aware.
// Step checks read ctx.powerStatus, the same board-aware map the objective
// checklist renders from, so the steps and the win can never disagree.
window.POWER = [
  {
    id: 'pw1',
    title: 'Power Up in Order',
    task: true,
    requirePowerOn: true,
    involves: [1, 2, 3, 4],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'A system powers up from the console outward: console first, speakers last. The console makes a small thump when it switches on, and with the speakers still off, that thump has nothing to play through. Bring the whole system up in order.',
    hint: 'Console first. Then the wedges, then the two main speakers. The MAIN fader stays down the whole time: power is its own step, and levels come later at soundcheck.',
    hints: [
      { title: 'Console on first', target: 'mixer-power', teach: 'This console thumps when it powers on. Some are quieter, but you never bet the speakers on it: console first, every time, while every speaker is still off.', text: 'Turn the console on.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.console) },
      { title: 'Wedges on', target: ['out-wedge1', 'out-wedge2'], teach: 'With the console on and settled, the speakers come up. Wedges or mains first does not matter: the rule is console before any speaker.', text: 'Turn on Wedge 1 and Wedge 2.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.wedges) },
      { title: 'Main speakers on', target: ['out-pa-l', 'out-pa-r'], teach: 'The main speakers are the loudest speakers in the system, so they get the same care: they only switch on once the console is up.', text: 'Turn on both main speakers.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.paStage) },
    ],
    sabotage: (s) => {
      // Load-in, fully patched, everything dark. The MAIN fader rests down and
      // muted: that is the correct resting state, and this lesson ends with it
      // still down. Levels are soundcheck's job, not power-up's.
      s.mixer = { on: false };
      s.master = { ...s.master, mute: true, fader: 0 };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false };
      s.outputs.wedge = { ...s.outputs.wedge, on: false };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: false };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: false };
      return s;
    },
    solution: 'Console on first, then the wedges and the two main speakers. The console\'s switch-on thump happened while no speaker could play it. The MAIN fader stays down until soundcheck.',
    defaultInspect: 'pa',
  },
  {
    id: 'pw2',
    title: 'Power Down in Order',
    task: true,
    requirePowerOff: true,
    involves: [1, 2, 3, 4],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'The show is over and the band has packed up. Power down in the reverse order you powered up: level down first, then the speakers, and the console last.',
    hint: 'Pull the MAIN fader down, switch off every speaker, then switch the console off last. Speakers go first on the way down for the same reason the console went first on the way up: the console thumps when it switches, and no live speaker should be around to play it.',
    hints: [
      { title: 'MAIN fader down', target: 'master-fader', teach: 'Level down first. It drops the mains before you switch anything off. The wedges run off their own sends, so they come down when you switch them off.', text: 'Pull the MAIN fader all the way down.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.masterDown) },
      { title: 'Speakers off', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2'], teach: 'Speakers switch off first on the way down. Once they are dead, nothing the console does on its way out can reach the audience.', text: 'Switch off both main speakers and both wedges.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.wedgesOff && ctx.powerStatus.paOff) },
      { title: 'Console off last', target: 'mixer-power', teach: 'The console goes last for the same reason it went first this morning: its switch thump needs a dead system around it.', text: 'Switch the console off.', done: (ctx) => !!(ctx.powerStatus && !ctx.powerStatus.console) },
    ],
    sabotage: (s) => {
      // End of the night: system up and healthy, ready to be taken down.
      s.mixer = { on: true };
      s.master = { ...s.master, mute: false, fader: 0.75 };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: true, volume: 0.6 };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: true, volume: 0.6 };
      s.outputs.wedge = { ...s.outputs.wedge, on: true, volume: 0.6 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: true, volume: 0.6 };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: false, volume: 0 };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: false, volume: 0 };
      return s;
    },
    solution: 'MAIN fader down, speakers off, console off last: power-up in reverse.',
    defaultInspect: 'pa',
  },
  {
    id: 'pw3',
    title: 'The Wrong Order',
    task: true,
    requirePowerOn: true,
    involves: [1, 2, 3, 4],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'You walk in and someone has already switched the main speakers on, with the console still off. If you switch the console on now, its thump goes straight through the live main speakers. Get the system fully powered without the pop.',
    hint: 'Make it safe first: main speakers off. Then the console on. Then bring the speakers back up: wedges and mains.',
    hints: [
      { title: 'Make it safe', target: ['out-pa-l', 'out-pa-r'], teach: 'A live speaker downstream of a dead console is a trap: the console\'s switch-on thump would play straight through it. Switch the main speakers off before you touch anything else.', text: 'Switch both main speakers off.', done: (ctx) => !!(ctx.powerStatus && (ctx.powerStatus.paOff || ctx.powerStatus.console)) },
      { title: 'Console on', target: 'mixer-power', teach: 'Now the console switches on into a dead system, the same as a normal power-up.', text: 'Turn the console on.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.console) },
      { title: 'Speakers back', target: ['out-wedge1', 'out-wedge2', 'out-pa-l', 'out-pa-r'], teach: 'Finish the normal order: speakers last.', text: 'Turn on the wedges and both main speakers.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.wedges && ctx.powerStatus.paStage) },
    ],
    sabotage: (s) => {
      // Someone else's half-done power-up, in the wrong order: PA live,
      // console dark. Flipping the console on from here pops the mains,
      // and the engine will say so. That warning is the lesson.
      s.mixer = { on: false };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: true, volume: 0.6 };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: true, volume: 0.6 };
      s.outputs.wedge = { ...s.outputs.wedge, on: false };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false };
      s.outputs.wedge3 = { ...s.outputs.wedge3, on: false };
      s.outputs.wedge4 = { ...s.outputs.wedge4, on: false };
      return s;
    },
    solution: 'Speakers off, console on, speakers back on. When you find a system half-powered in the wrong order, make it safe first: nothing switches on upstream of a live speaker.',
    defaultInspect: 'pa',
  },
  {
    id: 'pw4',
    title: 'Show Time, No Sound',
    task: true,
    requirePowerOn: true,
    involves: [1, 2, 3, 4],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'Show time. The band is playing and every meter on the console is moving, but the audience hears nothing. Find out why and fix it.',
    hint: 'The console meters are alive, so the mix is reaching the master. Work downstream from there: the problem is power at the speakers.',
    hints: [
      { title: 'Find the dead link', target: null, teach: 'Meters are the map. Signal on every channel and the master means the mix is making it through the console. Whatever is wrong lives at the console\'s outputs or after them.', text: 'The band plays, the meters move, the audience hears nothing. Walk the path downstream from the console.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.paStage) },
    ],
    sabotage: (s) => {
      // The band is up and playing; both main speakers were never switched on.
      // Everything upstream is healthy, so the meters tell the whole story.
      bandUp(s);
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false };
      return s;
    },
    solution: 'The console meters were alive, so the mix was making it through the console. Both main speakers were switched off. When the console looks healthy and the audience hears nothing, check power at the speakers first.',
    defaultInspect: 'pa',
  },
  {
    id: 'pw5',
    title: 'Dead Stage',
    task: true,
    requirePowerOn: true,
    involves: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    conditions: [],
    symptom: 'Sixteen channels, full band, mid-show. One side of the audience has nothing at all, and the drummer says her wedge is dead. Find every dead speaker and bring it back.',
    hint: 'Two separate speakers are off. Check the main pair first, then walk the wedges. A power problem reads as a healthy console and a silent speaker.',
    hints: [
      { title: 'Bring every speaker back', target: null, teach: 'On a bigger stage the same rule holds: healthy console, silent speaker, check its power. And there can be more than one.', text: 'Find both dead speakers: one main speaker, one wedge.', done: (ctx) => !!(ctx.powerStatus && ctx.powerStatus.paStage && ctx.powerStatus.wedges) },
    ],
    sabotage: (s) => {
      // The 16-channel board, band playing, two independent power faults:
      // the right main speaker and the drummer's wedge (Wedge 4).
      const b = window.bandState();
      bandUp(b);
      b.outputs.pa_r = { ...b.outputs.pa_r, on: false };
      b.outputs.wedge4 = { ...b.outputs.wedge4, on: false };
      return b;
    },
    solution: 'Both speakers came back with a switch: the right main speaker and the drummer\'s wedge. Nothing upstream was ever wrong. On any size stage, a healthy console plus a silent speaker means check power first.',
    defaultInspect: 'pa',
  },
];

// ── INPUT SETUP course (staging prototype) ───────────────────────────────
// Bringing an input up the right way, every time: PFL first, gain by the
// meter, know what needs power. Foundation first (the discipline, mics,
// DIs), then two fault hunts (a channel gained by ear, a condenser that
// lost its phantom mid-set). Wins ride the same gates Run the Show uses:
// requirePflCheck / requirePflEach, gainStructure -> ctx.gainStatus, and
// audibility conditions, so the steps and the win share predicates.
window.INPUT_SETUP = [
  {
    id: 'is1',
    title: 'Gain by the Meter',
    task: true,
    requirePflCheck: true,
    gainStructure: { refChannel: 1, unity: 0.75, faderTol: 0.06, inputBand: [0.645, 4.566] },
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'One channel, done right. The lead vocal is patched and the system is up, but the channel is muted with its gain low. Bring it in the way you will bring in every input from now on: check it in PFL (pre-fade listen), set the gain by the meter, then open the channel at unity, the U mark on the fader.',
    hint: 'PFL the channel first and set the GAIN so the input meter sits strong in the healthy zone with room to spare before the red. Then disengage PFL, unmute, and bring the fader up to unity, the U mark. Gain is set by the meter, not by ear.',
    hints: [
      { title: 'Check it in PFL', target: 'ch1-pfl', teach: 'PFL sends the channel to your headphones and its meter before the audience hears anything. Every input starts here.', text: 'Press PFL on channel 1.', done: (ctx) => !!(ctx.pflChecked || (ctx.state.channels[0] && ctx.state.channels[0].solo)) },
      { title: 'Set the gain', target: 'ch1-gain', teach: 'GAIN sets how hard the source hits the console. Watch the input meter: strong in the healthy zone, room to spare before the red. The meter decides, not your ear.', text: 'Turn GAIN until the input meter sits in the healthy zone.', done: (ctx) => !!(ctx.gainStatus && ctx.gainStatus.input) },
      { title: 'Open the channel at unity', target: 'ch1-fader', teach: 'With the gain right, the fader lives at unity, the U mark. That is the position the console is built to run at, and it leaves you room to ride up or down during the show.', text: 'Disengage PFL, unmute channel 1, and bring the fader to unity.', done: (ctx) => !!(ctx.gainStatus && ctx.gainStatus.fader && hintReaches(ctx, 'vocal', 'pa', 0.3)) },
    ],
    sabotage: (s) => {
      // System up and healthy; only the lead vocal is down. Gain starts low so
      // the meter work is real, not a formality.
      s.channels[0].mute = true; s.channels[0].fader = 0; s.channels[0].gain = window.HEALTHY_GAIN_BY_CH[0] * 0.4; s.channels[0].phantom = false;
      s.master.mute = false; s.master.fader = 0.75;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      return s;
    },
    solution: 'PFL first, gain by the meter, then the fader to unity. That order is the whole discipline: the meter proves the level before the audience ever hears the channel.',
    defaultInspect: 'pa',
  },
  {
    id: 'is2',
    title: 'Power What Needs It',
    task: true,
    requirePflEach: [1, 2],
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'pa', min: 0.3 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'Two vocal mics, two kinds of mic. Channel 1 is a dynamic and works on its own. Channel 2 is a condenser and gives no signal until it gets +48V phantom power. Know your source before you bring it up.',
    hint: 'The dynamic on channel 1 needs no power: PFL (pre-fade listen), gain, bring it up. The condenser on channel 2 needs +48V first. Switch phantom on while the channel is muted and out of PFL, so the turn-on thump reaches neither the speakers nor your headphones. Then treat it like any input.',
    hints: [
      { title: 'The dynamic first', target: 'ch1-strip', teach: 'A dynamic mic makes its own signal, no power needed. The everyday workhorse: bring it up the normal way.', text: 'Channel 1: PFL, set the gain by the meter, unmute, fader to unity.', done: (ctx) => !!(hintReaches(ctx, 'vocal', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[1]) },
      { title: 'Power the condenser', target: 'ch2-phantom', teach: 'A condenser has electronics inside that need +48V phantom power. Until it gets power, the channel meter reads nothing at all. Switch phantom while the channel is muted, so the turn-on thump never reaches the speakers.', text: 'Channel 2 is a condenser. With the channel muted, switch on +48V.', done: (ctx) => !!(ctx.state.channels[1] && ctx.state.channels[1].phantom) },
      { title: 'Bring in channel 2', target: 'ch2-strip', teach: 'Powered, a condenser is just another input: PFL, gain by the meter, up to unity.', text: 'Channel 2: PFL, set the gain, unmute, fader to unity.', done: (ctx) => !!(hintReaches(ctx, 'vocal2', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[2]) },
    ],
    sabotage: (s) => {
      // System up; both vocal channels down with half-healthy gain, phantom off
      // everywhere, so the condenser difference is discovered, not assumed.
      s.channels[0].mute = true; s.channels[0].fader = 0; s.channels[0].gain = window.HEALTHY_GAIN_BY_CH[0] * 0.5; s.channels[0].phantom = false;
      s.channels[1].mute = true; s.channels[1].fader = 0; s.channels[1].gain = window.HEALTHY_GAIN_BY_CH[1] * 0.5; s.channels[1].phantom = false;
      s.master.mute = false; s.master.fader = 0.75;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      return s;
    },
    solution: 'The dynamic came up the normal way. The condenser needed +48V first, switched on while the channel was muted. Know the source: dynamics power themselves, condensers do not.',
    defaultInspect: 'pa',
  },
  {
    id: 'is3',
    title: 'The Direct Boxes',
    task: true,
    requirePflEach: [3, 4],
    conditions: [
      { source: 'guitar', dest: 'pa', min: 0.3 },
      { source: 'laptop', dest: 'pa', min: 0.3 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'Instruments do not plug into a mic input on their own: a DI box (direct injection) converts their signal to what the console expects. The bass on channel 3 and the keys on channel 4 both come in through DIs. One of them has electronics inside and needs power; the other does not. The source cards on stage say which is which.',
    hint: 'An active DI has electronics inside that need power; this one takes the console\'s +48V phantom, exactly like a condenser. A passive DI needs nothing. Find the active one on the source cards, switch phantom on while its channel is muted, then bring both channels up by the meter.',
    hints: [
      { title: 'Find the DI that needs power', target: 'ch3-phantom', teach: 'An active DI has electronics inside that need power. This one takes it from the console\'s +48V, exactly like the condenser did. Some active DIs run on a battery instead, so check the box when you meet a new one. Muted first, then phantom.', text: 'Find the active DI on the source cards. With its channel muted, switch on +48V.', done: (ctx) => !!(ctx.state.channels[2] && ctx.state.channels[2].phantom) },
      { title: 'Bring in the bass', target: 'ch3-strip', teach: 'Powered, the active DI is just another input now: gain to the meter, fader to unity.', text: 'Channel 3: PFL (pre-fade listen), set the gain by the meter, unmute, fader to unity.', done: (ctx) => !!(hintReaches(ctx, 'guitar', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[3]) },
      { title: 'Bring in the keys', target: 'ch4-strip', teach: 'A passive DI is just a transformer in a box: no power, no fuss. Straight up the normal way.', text: 'Channel 4 is a passive DI: PFL, gain, unmute, unity. No power needed.', done: (ctx) => !!(hintReaches(ctx, 'laptop', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[4]) },
    ],
    sabotage: (s) => {
      // System up; both DI channels down, phantom off, half-healthy gain. The
      // vocals sit set-but-muted so the board reads like a build in progress.
      s.channels[0].mute = true; s.channels[0].fader = 0.72; s.channels[0].gain = window.HEALTHY_GAIN_BY_CH[0]; s.channels[0].phantom = false;
      s.channels[1].mute = true; s.channels[1].fader = 0.72; s.channels[1].gain = window.HEALTHY_GAIN_BY_CH[1]; s.channels[1].phantom = true;
      s.channels[2].mute = true; s.channels[2].fader = 0; s.channels[2].gain = window.HEALTHY_GAIN_BY_CH[2] * 0.5; s.channels[2].phantom = false;
      s.channels[3].mute = true; s.channels[3].fader = 0; s.channels[3].gain = window.HEALTHY_GAIN_BY_CH[3] * 0.5; s.channels[3].phantom = false;
      s.master.mute = false; s.master.fader = 0.75;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      return s;
    },
    solution: 'The active DI on the bass needed +48V, switched on while muted. The passive DI on the keys needed nothing. Active means electronics, and electronics need power: this one takes it from the console, some take a battery.',
    defaultInspect: 'pa',
  },
  {
    id: 'is4',
    title: 'Weak Keys, Cranked Fader',
    task: true,
    requirePflCheck: true,
    gainStructure: { refChannel: 4, unity: 0.75, faderTol: 0.06, inputBand: [0.645, 4.566] },
    conditions: [
      { source: 'laptop', dest: 'pa', min: 0.3 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'The keys are weak in the mix even though the fader is pushed way past unity. Someone set this channel by ear: the input gain is nearly off, and the fader is cranked to make up for it. That trick also turns up the console\'s own noise. Set the channel right, by the meter.',
    hint: 'Look at where the level is actually made: the input meter on channel 4 is barely registering while the fader sits near the top. Fix it at the source. PFL (pre-fade listen) the channel, bring the GAIN up until the input meter sits healthy, then bring the fader back down to unity.',
    hints: [
      { title: 'Read the strip', target: 'ch4-strip', teach: 'A fader near the top with an input meter near the bottom is the signature of a channel gained by ear. The fader is amplifying a starved signal, and the console\'s own noise comes up with it.', text: 'Check channel 4: input meter low, fader cranked. PFL it and look. The problem is at the GAIN.', done: (ctx) => !!(ctx.pflChecked || (ctx.state.channels[3] && ctx.state.channels[3].solo)) },
      { title: 'Gain up, by the meter', target: 'ch4-gain', teach: 'The level belongs at the input. PFL the channel and raise the GAIN until the meter sits strong in the healthy zone.', text: 'PFL channel 4 and bring the GAIN up to the healthy zone.', done: (ctx) => !!(ctx.gainStatus && ctx.gainStatus.input) },
      { title: 'Fader back to unity', target: 'ch4-fader', teach: 'With the input healthy, the fader comes back to the U mark. Same loudness in the audience, none of the extra noise, and you have your fader travel back.', text: 'Bring the channel 4 fader back down to unity.', done: (ctx) => !!(ctx.gainStatus && ctx.gainStatus.fader) },
    ],
    sabotage: (s) => {
      // The classic by-ear compensation: gain starved, fader slammed. The
      // channel is audible enough that nothing looks "broken" from the audience,
      // which is exactly why the meter is the tell.
      s.channels[3].mute = false; s.channels[3].fader = 1.0; s.channels[3].gain = 0.06; s.channels[3].phantom = false;
      s.master.mute = false; s.master.fader = 0.75;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      return s;
    },
    solution: 'The level was being made at the fader instead of the gain. GAIN up until the input meter sat healthy, fader back to unity. The input meter, not the fader position, tells you where a channel\'s level really comes from.',
    defaultInspect: 'pa',
  },
  {
    id: 'is5',
    title: 'Vocal 2 Drops Out',
    task: true,
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'pa', min: 0.3 },
      { source: 'guitar', dest: 'pa', min: 0.3 },
      { source: 'laptop', dest: 'pa', min: 0.3 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'Mid-set, Vocal 2 drops out of the mix. The band plays on. Channel 2\'s input meter reads nothing while every other channel is moving. Get her back without popping anything.',
    hint: 'An input meter with no signal on a live board points at the channel itself, not the mix. Channel 2 is a condenser: check its +48V. Mute the channel before you switch phantom, then unmute. Switching +48V on an open channel pops the system.',
    hints: [
      { title: 'Find her channel', target: null, teach: 'The input meter on channel 2 shows nothing while the rest of the board moves. A meter with no signal on a live board points at the channel itself. Fix it without a pop: anything you switch on an open channel plays through every speaker.', text: 'Get Vocal 2 back in the mix without popping the speakers.', done: (ctx) => !!hintReaches(ctx, 'vocal2', 'pa', 0.3) },
    ],
    sabotage: (s) => {
      // The whole band live and healthy, except channel 2's phantom is off:
      // a condenser with no +48V reads nothing at all. The one-channel-dead,
      // meters-as-map hunt, with the pop discipline built into the fix.
      s.channels[0].mute = false; s.channels[0].fader = 0.72; s.channels[0].gain = window.HEALTHY_GAIN_BY_CH[0]; s.channels[0].phantom = false;
      s.channels[1].mute = false; s.channels[1].fader = 0.72; s.channels[1].gain = window.HEALTHY_GAIN_BY_CH[1]; s.channels[1].phantom = false;
      s.channels[2].mute = false; s.channels[2].fader = 0.72; s.channels[2].gain = window.HEALTHY_GAIN_BY_CH[2]; s.channels[2].phantom = true;
      s.channels[3].mute = false; s.channels[3].fader = 0.72; s.channels[3].gain = window.HEALTHY_GAIN_BY_CH[3]; s.channels[3].phantom = false;
      s.master.mute = false; s.master.fader = 0.75;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0.6; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0.6; s.outputs.wedge2.mute = false;
      return s;
    },
    solution: 'Channel 2\'s +48V was off, and a condenser without phantom reads nothing at all. Muted, powered, unmuted: back in the mix without a pop. No signal at the input meter on a live board means look at the channel, and on a condenser, look at its power first.',
    defaultInspect: 'pa',
  },
];
