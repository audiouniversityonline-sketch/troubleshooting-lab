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
//                (the I/O LIST): sources on snake inputs 1-4, input tails on
//                their console channels, console outputs into snake returns
//                5-8 (outFan), and speaker lines on their numbered out ports
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
    // the system gets CONNECTED, per paperwork (the I/O LIST in the top
    // bar), the way a pro does it. One 8-channel snake: inputs ride
    // channels 1-4, outputs (returns) ride 5-8, colors per the standard
    // code (1 brown, 2 red, 3 orange, 4 yellow, 5 green, 6 blue, 7 violet,
    // 8 gray). Four drag-and-drop jobs, all with the power off:
    //   1. INPUTS - each source's cable into its numbered stage-box port.
    //   2. INPUT TAILS - the FOH fan-out tails 1-4 onto their console
    //      channels, matched by color.
    //   3. RETURN TAILS - the console outputs into snake 5-8 at FOH
    //      (MAIN L -> 5, MAIN R -> 6, AUX 1 -> 7, AUX 2 -> 8).
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
    symptom: 'Connect the whole system from the paperwork, with everything still powered off. Open the I/O LIST in the top bar for the plan, then patch each cable to the port it calls for.',
    hint: 'Drag a cable end and drop it on a port or an output chip. Dropping on a taken spot swaps the two cables. The colors follow the standard 8-channel snake code: 1 brown, 2 red, 3 orange, 4 yellow, 5 green, 6 blue, 7 violet, 8 gray. Patch with the power off so nothing can pop while the system is dead.',
    hints: [
      { title: 'Patch the inputs', target: null, teach: 'Patching is just following the paperwork. Open the I/O LIST in the top bar and wire what it tells you, starting at the stage.', text: 'Inputs first: drag each source cable onto its numbered stage-box port. Drop on a taken spot to swap.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[0] && ctx.patchStatus[0].pass },
      { title: 'Land the snake at the console', target: null, teach: 'The snake carries those inputs from the stage back to you at front of house. Each tail lands on its own channel.', text: 'Drop snake tails 1-4 onto their matching console channels.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[1] && ctx.patchStatus[1].pass },
      { title: 'Send the outputs down the snake', target: null, teach: 'The same snake carries your mix back out. The console outputs ride channels 5-8.', text: 'Console outs into snake 5-8: L to 5, R to 6, AUX 1 to 7, AUX 2 to 8.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[2] && ctx.patchStatus[2].pass },
      { title: 'Connect the speakers', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2'], teach: 'Last, the speakers pick up those same snake channels at the stage end. Match each speaker to the output feeding it.', text: 'Each speaker line to its out port: PA L to 5, PA R to 6, Wedge 1 to 7, Wedge 2 to 8.', done: (ctx) => ctx.patchStatus && ctx.patchStatus[3] && ctx.patchStatus[3].pass },
    ],
    sabotage: (s) => {
      // Load-in state: nothing connected anywhere. Input cables loose above
      // the stage box, speaker lines loose below it, input tails coiled
      // below the fan-out (fanOut 0 = unplugged), return tails coiled next
      // to them (outFan nulls). Rig fully off, console zeroed
      // (normalizeChannels covers the channels via involves []).
      s.cables = { vocal: 0, vocal2: 0, guitar: 0, laptop: 0 };
      s.fanOut = [0, 0, 0, 0];
      s.outFan = { 5: null, 6: null, 7: null, 8: null };
      s.outPatch = { pa_l: null, pa_r: null, wedge: null, wedge2: null };
      s.master = { ...s.master, mute: true, fader: 0 };
      s.mixer = { on: false };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false, volume: 0 };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false, volume: 0 };
      s.outputs.wedge = { ...s.outputs.wedge, on: false, volume: 0 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false, volume: 0 };
      return s;
    },
    solution: 'Everything connected per the I/O list: inputs on snake 1 to 4, outputs on 5 to 8, every color matched. The system is connected and still off. Next, power on.',
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
    symptom: 'Everything is connected and the console is zeroed: every channel is back at its starting position. Power the system up in the right order. The wrong order pops the speakers.',
    hint: 'Power on the console first, then the powered speakers last. If you turn a PA speaker or wedge on first and then switch the console on, the console sends a pop to the speakers. So: console first, then the wedges and the PA speakers.',
    hints: [
      { title: 'Console on first', target: 'mixer-power', teach: 'Always power up from the source outward. The console goes on first so its own switch-on thump has nowhere to go yet, no speaker is live to play it.', text: 'Turn the console on first.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.console },
      { title: 'Then the speakers', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2', 'out-wedge3', 'out-wedge4'], teach: 'With the console already on and settled, the speakers come up last. Nothing pops, because the thump already passed.', text: 'Now bring up the rest: both PA speakers and all four wedges.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.paStage && ctx.powerStatus.wedges },
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
    // corridor (0.30-0.50 ~= 84-90 dB SPL) is the room level set with the
    // speaker volume. involves: [5] keeps playback live and mutes the mics.
    task: true,
    involves: [5],
    requirePflCheck: true,
    gainStructure: { refChannel: 5, unity: 0.75, faderTol: 0.06, inputBand: [0.80, 1.00] },
    conditions: [
      { source: 'playback', dest: 'pa', min: 0.30, max: 0.50 },
    ],
    symptom: 'The system is on and the console is fully zeroed, with your playback connected. Set your gain structure start to finish: check it in PFL, set the gain, bring the faders to unity, then set the room level with the PA.',
    hint: 'Press PFL on the playback to hear it in your headphones. Set the GAIN so the meter sits in the healthy zone. Release PFL, unmute the playback and the master, and bring both faders up to unity. Then bring up the PA speaker volume until the room sits at a good level on the loudness meter.',
    hints: [
      { title: 'Check it in PFL', target: 'ch5-pfl', teach: 'PFL lets you hear and meter a channel in your headphones before the room does. Always set a level in PFL first.', text: 'PFL the playback so you can set it in your headphones first.', done: (ctx) => ctx.pflChecked || (ctx.state.channels[4] && ctx.state.channels[4].solo) },
      { title: 'Set the gain', target: 'ch5-gain', teach: 'Gain sets how hard the source hits the console. You want it strong on the meter with a little room to spare, set by the meter, not by ear.', text: 'Set the GAIN so the input meter sits in the healthy zone.', done: (ctx) => ctx.gainStatus && ctx.gainStatus.input },
      { title: 'Faders to unity', target: ['ch5-fader', 'master-fader'], teach: 'With the gain right, the channel and master faders live at unity, the U mark. That is the spot they are built to run, with the most control under your hand.', text: 'Release PFL, unmute the playback and the master, and bring both faders up to unity.', done: (ctx) => ctx.gainStatus && ctx.gainStatus.fader && ctx.gainStatus.master },
      { title: 'Set the room level', target: ['out-pa-l', 'out-pa-r'], teach: 'Gain is set and the faders are at unity, so now you set how loud the room is with the PA volume, not by shoving a fader.', text: 'Set how loud the room is with the PA volume, watching the loudness meter.', done: (ctx) => { var c = ctx.audio && ctx.audio.contributions && ctx.audio.contributions.playback; if (!c) return false; var l = Math.max(c.pa_l || 0, c.pa_r || 0); return l >= 0.30 && l <= 0.50; } },
    ],
    sabotage: (s) => {
      // Continuous with Power-On: rig on, console fully zeroed. Channel muted,
      // fader 0, GAIN all the way down. Master muted, fader 0. PA speaker volume
      // all the way down too, since the student sets the room level here.
      s.channels[4].mute = true;
      s.channels[4].fader = 0;
      s.channels[4].gain = 0;
      s.channels[4].aux1 = 0; s.channels[4].aux2 = 0;
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
    // aux feeds which: AUX 1 -> Wedge 1, AUX 2 -> Wedge 2. The student sends the
    // reference out each aux and brings up each wedge volume until it plays.
    // verifyEach latches each wedge once it gets signal. The PA, gain and faders
    // stay as set in Level 2. The wedge volumes the student sets here are kept
    // for the rest of the build (Levels 4-7 start with them up).
    task: true,
    involves: [5],
    verifyEach: [
      { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 plays' },
      { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 plays' },
    ],
    conditions: [],
    symptom: 'The PA is set. Now bring up your monitor wedges. AUX 1 feeds Wedge 1, AUX 2 feeds Wedge 2.',
    hint: 'Turn up AUX 1 on the playback channel and bring up the Wedge 1 volume on stage until it plays. Do the same with AUX 2 for Wedge 2. Each wedge gets checked off once it is playing.',
    hints: [
      { title: 'Wedge 1', target: ['ch5-aux', 'out-wedge1'], teach: 'A wedge only plays what you send it. AUX 1 is the feed to Wedge 1, and the wedge has its own volume on stage.', text: 'Wedge 1: turn up AUX 1 on the playback, then raise the Wedge 1 volume until it plays.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.wedge },
      { title: 'Wedge 2', target: ['ch5-aux', 'out-wedge2'], teach: 'Same idea on the next monitor: AUX 2 feeds Wedge 2. Proving each speaker now means no surprises once the band is on.', text: 'Wedge 2: same again with AUX 2 and the Wedge 2 volume.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.wedge2 },
    ],
    sabotage: (s) => {
      // Carried from Set the Input Level: good input, faders at unity, PA set.
      // The wedges are not up yet: sends closed, wedge volumes down.
      s.channels[4].mute = false;
      s.channels[4].gain = 0.5;
      s.channels[4].fader = 0.75;
      s.channels[4].aux1 = 0; s.channels[4].aux2 = 0;
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.6; s.outputs.pa_r.volume = 0.6;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0; s.outputs.wedge2.mute = false;
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
      { title: 'Channel 1: the dynamic', target: 'ch1-strip', teach: 'A dynamic mic needs no power, so it is the simple one. Same routine as the playback: check, set, bring up.', text: 'Channel 1 (dynamic, no power): PFL it, set the gain, unmute, and bring it up.', done: (ctx) => hintReaches(ctx, 'vocal', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[1] },
      { title: 'Power the condenser', target: 'ch2-phantom', teach: 'A condenser mic needs +48V phantom power to work. Switch it on while the channel is muted so the turn-on thump never reaches the speakers.', text: 'Channel 2 is a condenser: it needs +48V phantom. Switch it on while muted.', done: (ctx) => ctx.state.channels[1] && ctx.state.channels[1].phantom },
      { title: 'Bring up channel 2', target: 'ch2-strip', teach: 'With phantom on, the condenser behaves like any other channel. Check it, set the gain, bring it up.', text: 'Then check channel 2 in PFL, set its gain, and bring it up.', done: (ctx) => hintReaches(ctx, 'vocal2', 'pa', 0.3) && ctx.pflChannels && ctx.pflChannels[2] },
    ],
    sabotage: (s) => {
      // System set up (master at unity, PA at a good level, wedges still up from
      // Test the Wedges). The two vocal channels start muted, faders down, gain
      // low. The condenser's phantom is off so the student has to know it needs
      // +48V. PFL each channel to check it before bringing it up.
      s.channels[0].mute = true; s.channels[0].fader = 0; s.channels[0].gain = 0.2; s.channels[0].phantom = false;
      s.channels[1].mute = true; s.channels[1].fader = 0; s.channels[1].gain = 0.2; s.channels[1].phantom = false;
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
      // Mics from the last level kept as set, but muted so the audio stops.
      s.channels[0].mute = true; s.channels[0].fader = 0.72; s.channels[0].gain = 0.5; s.channels[0].phantom = false;
      s.channels[1].mute = true; s.channels[1].fader = 0.72; s.channels[1].gain = 0.5; s.channels[1].phantom = true;
      // Both DI channels start muted, faders down, gain low. The active DI
      // (bass, ch3) has phantom off so the student has to power it.
      s.channels[2].mute = true; s.channels[2].fader = 0; s.channels[2].gain = 0.2; s.channels[2].phantom = false;
      s.channels[3].mute = true; s.channels[3].fader = 0; s.channels[3].gain = 0.2; s.channels[3].phantom = false;
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
    symptom: 'Send the singer\'s vocal to her wedge so she can hear herself on stage.',
    hint: 'Her wedge is on and turned up. Send her vocal to it by turning up AUX 1 on the vocal channel.',
    hints: [
      { title: 'Send her vocal to her wedge', target: 'ch1-aux', teach: 'The band hears a different mix than the room: their own wedges. AUX 1 on her vocal channel feeds her monitor, and it does not touch the PA at all.', text: 'Her wedge is up. Send her vocal to it with AUX 1 on the vocal channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.35) },
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
    solution: 'Turn up AUX 1 on the vocal channel to send her vocal to her wedge.',
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
    // (>= 0.6) AND no feedback, so pulling the send back down won't do it.
    // For now HPF clears it (drops the low-end loop gain ~40% while the wedge
    // level stays up). NEXT TURN: add an EQ on the aux outputs as the real,
    // surgical fix; HPF is the stopgap so the level is solvable today.
    symptom: 'Turn the singer\'s vocal up in her wedge so she can hear herself. Careful: monitors feed back when you push them too hard.',
    hint: 'Turn up AUX 1 on the vocal to give her more in her wedge. When it starts to ring, look at the monitor EQ on her wedge: the ringing frequency glows. Pull that band down just far enough to stop the ring. Cuts cost a little monitor level, so keep them small. (HPF only helps low-frequency ring, not this one.)',
    hints: [
      { title: 'Give her more', target: 'ch1-aux', teach: 'She wants more of herself on stage, so push AUX 1 up. As a wedge gets loud it can start to ring, which is the monitor feeding back on itself.', text: 'Bring AUX 1 on the vocal up so her wedge reaches a strong level.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.6) },
      { title: 'Ring it out', target: 'out-wedge1', teach: 'Feedback rings at one frequency. On the wedge\'s Monitor EQ that band glows. Pull just that band down a touch and the ring stops while she keeps her level.', text: 'When it rings, pull the glowing band down on her Monitor EQ, just enough to stop it.', done: (ctx) => !ctx.feedback },
    ],
    // Wedge min sits at 0.6 (was 0.7) since 2026-06-11 PM: EQ cuts now cost
    // level (eqLevelGain), so the ring-out's own cut eats a little of the
    // send level — exactly like a real desk.
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.6 },
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
    solution: 'Turn up the vocal in her wedge, then ring it out: pull the glowing band down on her monitor EQ to cut the ringing frequency.',
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
    requirePflEach: [1, 2, 3, 4, 5],
    gainStructure: { unity: 0.75, faderTol: 0.06 },
    involves: [1, 2, 3, 4, 5],
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
      { source: 'vocal',  dest: 'wedge', min: 0.35 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'Final exam. Run the whole job from a cold system, in order: power on, test every speaker with playback, then bring the band in. Keep it clean the whole way.',
    hint: 'Everything you have already done, in order. Console on first, then the speakers. PFL the playback, set its gain, and send it to the PA and both wedges: each speaker checks off once it plays and stays checked, so you can turn the playback back down afterward. Then the band: PFL each input, set its gain, and bring it up with the fader at unity. Turn on +48V for the condenser and the active DI while the channel is muted and before you PFL it. Open AUX 1 on the vocal for her wedge.',
    hints: [
      { title: 'Power up in order', target: 'mixer-power', teach: 'Same as you practiced: source outward. Console first so its thump has nowhere to go, then the speakers.', text: 'Power on in order: console first, then both PA speakers and all four wedges.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.console && ctx.powerStatus.paStage && ctx.powerStatus.wedges },
      { title: 'Prove every speaker', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2'], teach: 'Before a single mic matters, send playback to each speaker and confirm it plays. Catch a dead box now, not during the first song.', text: 'Test every speaker with playback: send it to the PA and both wedges.', done: (ctx) => ctx.verifyStatus && ctx.verifyStatus.pa && ctx.verifyStatus.wedge && ctx.verifyStatus.wedge2 },
      { title: 'Power what needs it', target: ['ch2-phantom', 'ch3-phantom'], teach: 'The condenser and the active DI both need +48V. Switch them on while their channels are muted.', text: 'Turn +48V on (while muted) for the condenser (ch 2) and active DI (ch 3).', done: (ctx) => ctx.state.channels[1] && ctx.state.channels[1].phantom && ctx.state.channels[2] && ctx.state.channels[2].phantom },
      { title: 'Check every input', target: null, teach: 'Walk the band one channel at a time. PFL each input and meter it before you ever bring it into the room.', text: 'Check every input in PFL before you bring it up: channels 1 through 5.', done: (ctx) => ctx.pflChannels && [1, 2, 3, 4, 5].every((ch) => ctx.pflChannels[ch]) },
      { title: 'Bring the band up', target: null, teach: 'Now open them into the room, faders at unity, levels already set with the gain. The whole band, clean in the PA.', text: 'Bring the band up clean, faders at unity: vocals, bass, and keys in the PA.', done: (ctx) => hintReaches(ctx, 'vocal', 'pa', 0.25) && hintReaches(ctx, 'vocal2', 'pa', 0.25) && hintReaches(ctx, 'guitar', 'pa', 0.25) && hintReaches(ctx, 'laptop', 'pa', 0.25) },
      { title: 'Give the singer her wedge', target: 'ch1-aux', teach: 'Last touch: the lead singer needs herself on stage. Open AUX 1 on her vocal and the show is ready.', text: 'Give the singer her wedge: open AUX 1 on her vocal.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.35) },
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
        s.channels[i].gain = i === 4 ? 0 : 0.2;
        s.channels[i].phantom = false;
        s.channels[i].aux1 = 0;
        s.channels[i].aux2 = 0;
      }
      return s;
    },
    solution: 'The whole setup, start to finish: power in order, every speaker proven with playback, every input line checked in PFL and brought up clean, and the singer hearing herself in her wedge.',
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
      { title: 'Speakers off first', target: ['out-pa-l', 'out-pa-r', 'out-wedge1', 'out-wedge2', 'out-wedge3', 'out-wedge4'], teach: 'Power-down is power-up in reverse. The speakers go off first so they are dead before the console makes its switch-off thump.', text: 'Power off in reverse: PA speakers and wedges off first.', done: (ctx) => ctx.powerStatus && ctx.powerStatus.paOff && ctx.powerStatus.wedgesOff },
      { title: 'Console off last', target: 'mixer-power', teach: 'With every speaker already dead, the console goes off last and its thump plays to nobody.', text: 'Console off last (it pops on shutoff, and a live speaker would play it).', done: (ctx) => ctx.powerStatus && !ctx.powerStatus.console },
    ],
    sabotage: (s) => {
      // End-of-night state: live mix at modest levels (clean), with realistic
      // show leftovers for the zero-out: off-center pans on the DIs, HPF in
      // on the vocal, phantom on the condenser + active DI.
      s.channels[0].mute = false; s.channels[0].fader = 0.55; s.channels[0].gain = 0.3; s.channels[0].phantom = false; s.channels[0].aux1 = 0.45; s.channels[0].aux2 = 0; s.channels[0].highpass = true;
      s.channels[1].mute = false; s.channels[1].fader = 0.55; s.channels[1].gain = 0.3; s.channels[1].phantom = true;  s.channels[1].aux1 = 0;    s.channels[1].aux2 = 0;
      s.channels[2].mute = false; s.channels[2].fader = 0.4;  s.channels[2].gain = 0.3; s.channels[2].phantom = true;  s.channels[2].aux1 = 0;    s.channels[2].aux2 = 0; s.channels[2].pan = 0.3;
      s.channels[3].mute = false; s.channels[3].fader = 0.4;  s.channels[3].gain = 0.3; s.channels[3].phantom = false; s.channels[3].aux1 = 0;    s.channels[3].aux2 = 0; s.channels[3].pan = 0.7;
      s.channels[4].mute = true;  s.channels[4].fader = 0;    s.channels[4].gain = 0;   s.channels[4].aux1 = 0;        s.channels[4].aux2 = 0;
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
// Numbers (power-summed engine): gain 0.4 -> chanIn 0.79, fader 0.6 ->
// post 0.474 -> per-source, per-side PA contribution 0.277 (conditions
// min 0.2 with margin); main bus 0.711, well under the 1.22 clip threshold.
function bandUp(s) {
  for (let i = 0; i < 4; i++) {
    s.channels[i].mute = false;
    s.channels[i].fader = 0.6;
    s.channels[i].gain = 0.4;
    // Condenser (ch2) and active DI (ch3) need +48V to pass signal.
    s.channels[i].phantom = (i === 1 || i === 2);
  }
  s.channels[4].mute = true; s.channels[4].fader = 0; s.channels[4].gain = 0;
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
  { key: 'cable',        label: 'Cable unplugged',   blurb: "A channel's input cable is unplugged.",                  par: 3, apply: (s, rng) => { s.cables[BAND_SOURCES[Math.floor(rng() * 4)]] = 0; } },
  { key: 'gain',         label: 'Gain at zero',      blurb: "A channel's gain is at zero, so its meter never moves.",  par: 1, apply: (s, rng) => { s.channels[Math.floor(rng() * 4)].gain = 0; } },
  { key: 'fader',        label: 'Fader down',        blurb: 'A channel fader is all the way down.',                    par: 1, apply: (s, rng) => { s.channels[Math.floor(rng() * 4)].fader = 0; } },
  { key: 'mute',         label: 'Channel muted',     blurb: 'A channel is muted.',                                    par: 1, apply: (s, rng) => { s.channels[Math.floor(rng() * 4)].mute = true; } },
  { key: 'pan',          label: 'Hard pan',          blurb: 'A channel is panned hard to one side.',                   par: 1, apply: (s, rng) => { s.channels[Math.floor(rng() * 4)].pan = rng() < 0.5 ? 0 : 1; } },
  { key: 'phantom',      label: 'Phantom power off', blurb: 'Phantom power is off, so a condenser or active DI is silent.', par: 3, apply: (s, rng) => { s.channels[POWERED_IDX[Math.floor(rng() * 2)]].phantom = false; } },
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
      if (!s.inputPatch) s.inputPatch = [1, 2, 3, 4, 5];
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
  // FEEDBACK — a singer's wedge pushed into ringing (hot send + hot wedge).
  // The extra condition keeps her monitor level REQUIRED, so the fix is the
  // Feedback Awareness skill: pull the glowing band down on that wedge's EQ.
  // Numbers: chanIn 0.79 x send 1.0 x aux master 0.75 x vol 0.8 x 1.6 =
  // 0.758 at the wedge -> rings (threshold 0.55). A full -12 dB band cut
  // drops the loop to ~0.19 (clear) while the monitor level stays 0.758.
  { key: 'feedback', label: 'Wedge feeding back', blurb: 'A wedge starts ringing and only an EQ cut fixes it.', par: 2, weight: 2, apply: (s, rng) => {
    if (rng() < 0.5) {
      s.channels[0].aux1 = 1.0;
      s.outputs.wedge.volume = 0.8;
      return { conditions: [{ source: 'vocal', dest: 'wedge', min: 0.5 }] };
    }
    s.channels[1].aux2 = 1.0;
    s.outputs.wedge2.volume = 0.8;
    return { conditions: [{ source: 'vocal2', dest: 'wedge2', min: 0.5 }] };
  } },
  // CROSSPATCH — two cables traded places. The console's channel labels and
  // the patch row in the brief are the evidence; one drag (swap) fixes it.
  // Stage-box version trades two sources' input ports; snake version trades
  // two fan-out tails at FOH. Practice always requires the patch to match
  // the input list (PRACTICE.requirePatch), so these can't hide even when
  // both swapped channels happen to stay audible. Par 3 because changing a
  // patch on a live channel POPS: the safe fix is master down (one move,
  // covers both channels) -> swap -> master back up.
  { key: 'crosspatch-stage', label: 'Crosspatch at the stage box', blurb: 'Two inputs are swapped at the stage box.', par: 3, apply: (s, rng) => {
    const i = Math.floor(rng() * 4);
    let j = Math.floor(rng() * 3); if (j >= i) j += 1;
    const a = BAND_SOURCES[i], b = BAND_SOURCES[j];
    const t = s.cables[a]; s.cables[a] = s.cables[b]; s.cables[b] = t;
  } },
  { key: 'crosspatch-snake', label: 'Crosspatch at the snake', blurb: 'Two channels are swapped at the snake.', par: 3, apply: (s, rng) => {
    const i = Math.floor(rng() * 4);
    let j = Math.floor(rng() * 3); if (j >= i) j += 1;
    const t = s.fanOut[i]; s.fanOut[i] = s.fanOut[j]; s.fanOut[j] = t;
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
      // The bass came in weak: its gain got cracked way down and the fader was
      // ridden up to compensate. Set the gain healthy and the fader to unity.
      s.channels[2].gain = 0.12; s.channels[2].fader = 0.45;
      return {
        conditions: [{ source: 'guitar', dest: 'pa', min: 0.3 }],
        gainStructure: { refChannel: 3, unity: 0.75, faderTol: 0.08, inputBand: [0.75, 1.0] },
        symptom: 'The bass gain is set far too low, with the fader pushed up to make up for it. That is backwards. Set the gain structure properly: gain healthy on the meter, fader back at unity.',
        title: 'Fix the Gain Structure',
        hint: 'PFL the bass (channel 3) and bring its GAIN up until the input meter sits in the healthy zone, then drop the fader back to the unity mark.',
        solution: "Bass gain set healthy in PFL, fader at unity. That's proper gain structure, level set at the top of the chain, not the bottom.",
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
      s.channels[4].mute = false; s.channels[4].gain = 0.5; s.channels[4].fader = 0.75; s.channels[4].aux1 = 0; s.channels[4].aux2 = 0;
      s.outputs.wedge = { ...s.outputs.wedge, on: true, mute: false, volume: 0.6 };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: true, mute: false, volume: 0.6 };
      return {
        conditions: [],
        verifyEach: [
          { source: 'playback', dest: 'pa',     min: 0.30, label: 'PA passes signal' },
          { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 passes signal' },
          { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 passes signal' },
        ],
        symptom: 'Confirm every speaker is passing signal: the PA and both wedges. Send the playback to each one. They check off as they play.',
        title: 'Check the Speakers',
        hint: 'Send the playback to the PA on its fader, then open AUX 1 for Wedge 1 and AUX 2 for Wedge 2. Each speaker checks off once it plays, so you can move on.',
        solution: 'Playback sent to the PA and both wedges: every speaker proven to pass signal, before a single input matters.',
      };
    },
  },
];

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
    bandUp(s);
    const r = rng || (() => 0);
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
        window.PRACTICE_LAST = { par: fpar, faults: ffaults, extraConditions: fcond };
        return s;
      }
    }
    // Sometimes nothing is broken. The band is playing and the system is
    // healthy; the call is to recognize that and sign off, not to invent a
    // fault and start fiddling with a working mix. Knowing when to leave it
    // alone is half of real troubleshooting judgment, and no other sim trains
    // it. Seeded like everything else, so Reset replays the same clean rep.
    // Drawn before the fault loop so the seed stays deterministic.
    // The app can raise this when a member is training the sign-off rung of the
    // drill ladder (window.PRACTICE_ZEROFAULT_CHANCE), so healthy systems show
    // up often enough to drill the call. Unset by default, so normal reps keep
    // the 12% surprise rate.
    const ZERO_FAULT_CHANCE = (typeof window.PRACTICE_ZEROFAULT_CHANCE === 'number') ? window.PRACTICE_ZEROFAULT_CHANCE : 0.12;
    if (r() < ZERO_FAULT_CHANCE) {
      window.PRACTICE_LAST = { par: 0, faults: [], zeroFault: true, extraConditions: [] };
      return s; // bandUp() already left it healthy
    }
    // Sometimes the call is a positive task, not a fault: build a monitor mix,
    // fix the gain, check the speakers. These ignore the FAULTS count (a task is
    // a task), carry their own win conditions + prompt text (winSpec), and make
    // Practice train the whole job instead of only diagnosis.
    // Also overridable (window.PRACTICE_GOAL_CHANCE): the sign-off drill sets it
    // to 0 so a rep is a clean "broken or fine?" call, not a build-a-mix task.
    const GOAL_TASK_CHANCE = (typeof window.PRACTICE_GOAL_CHANCE === 'number') ? window.PRACTICE_GOAL_CHANCE : 0.25;
    if (window.PRACTICE_GOALS && window.PRACTICE_GOALS.length && r() < GOAL_TASK_CHANCE) {
      const g = window.PRACTICE_GOALS[Math.floor(r() * window.PRACTICE_GOALS.length)];
      const winSpec = g.apply(s, r);
      window.PRACTICE_LAST = { par: g.par, faults: [], goalKey: g.key, goalLabel: g.label, winSpec: winSpec, extraConditions: [] };
      return s;
    }
    const n = Math.max(1, Math.min(3, window.PRACTICE_FAULT_COUNT || 1));
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
    window.PRACTICE_LAST = { par, faults, extraConditions };
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
    { source: 'vocal', dest: 'wedge', min: 0.65 },
  ],
  // The wedge must keep >= 92% of its response: a real ring-out's three or
  // four small cuts pass easily, slammed sliders or shotgun cutting fail.
  toneGate: 0.92,
  involves: [1],
  symptom: 'Ring-out training. Bring the singer\'s vocal up to the target level in her wedge. As you push, a frequency will start to ring. Back the send off a little, find the glowing band on the wedge\'s graphic EQ, and cut it a few dB, just enough that the ring stays gone. Then keep climbing. A real ring-out only takes a few cuts, so keep them small and stop when you reach the target.',
  hint: 'Raise the send a little at a time. When a frequency rings, find it on the monitor EQ and pull that band down a few dB, just past where the ring stops. Expect three or four on the way up, and keep every cut small. Once the vocal hits the target, stop.',
  sabotage: (s, rng) => {
    const r = rng || (() => 0.5);
    // The singer's vocal live at a healthy gain, her wedge on, the send low.
    s.channels[0].mute = false;
    s.channels[0].gain = 0.55;
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
    start: {"channels":[{"label":"Vocal 1","gain":0.55,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":true,"solo":false,"fader":0.72,"inputTrim":1,"id":1},{"label":"Vocal 2","gain":0.55,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":2},{"label":"Bass","gain":0.5,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.65,"inputTrim":1,"id":3},{"label":"Keys","gain":0.45,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.6,"inputTrim":1,"id":4},{"label":"5/6","gain":0.55,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.7,"inputTrim":1,"id":5,"stereo":true}],"mixer":{"on":true},"master":{"fader":0.55,"mute":false,"aux1":0.75,"aux2":0.75},"outputs":{"pa_l":{"on":true,"mute":false,"volume":0.7},"pa_r":{"on":true,"mute":false,"volume":0.7},"wedge":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":15},"wedge2":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":12},"amp":{"on":true}},"cables":{"vocal":1,"vocal2":2,"guitar":3,"laptop":4},"outFan":{"5":"mainL","6":"mainR","7":"aux1","8":"aux2"},"outPatch":{"pa_l":5,"pa_r":6,"wedge":7,"wedge2":8},"fanOut":[1,2,3,4],"sourceMute":{"vocal":false,"guitar":false,"laptop":false,"vocal2":false,"playback":false},"playbackMode":"music","testing":"vocal","inspect":"pa","topology":{"mixerLocation":"side-stage","paRig":"powered","wedgeLocation":"stage"}},
  },
  {
    id: 'pa-side-quiet',
    title: 'One side of the room is quiet',
    symptom: 'The right side of the audience is getting a lot less than the left. Even out the two main speakers so the whole room hears the same mix.',
    hint: 'This is a PA output level, not a channel. Check the two mains against each other.',
    solution: 'PA Right was turned down well below PA Left, so half the room got a thin mix. Matching the two main outputs evened out the coverage. Keep your main sides level so the whole room hears the same thing.',
    conditions: [],
    start: {"channels":[{"label":"Vocal 1","gain":0.55,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":1},{"label":"Vocal 2","gain":0.55,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":2},{"label":"Bass","gain":0.5,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.65,"inputTrim":1,"id":3},{"label":"Keys","gain":0.45,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.6,"inputTrim":1,"id":4},{"label":"5/6","gain":0.55,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.7,"inputTrim":1,"id":5,"stereo":true}],"mixer":{"on":true},"master":{"fader":0.55,"mute":false,"aux1":0.75,"aux2":0.75},"outputs":{"pa_l":{"on":true,"mute":false,"volume":0.7},"pa_r":{"on":true,"mute":false,"volume":0.35},"wedge":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":15},"wedge2":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":12},"amp":{"on":true}},"cables":{"vocal":1,"vocal2":2,"guitar":3,"laptop":4},"outFan":{"5":"mainL","6":"mainR","7":"aux1","8":"aux2"},"outPatch":{"pa_l":5,"pa_r":6,"wedge":7,"wedge2":8},"fanOut":[1,2,3,4],"sourceMute":{"vocal":false,"guitar":false,"laptop":false,"vocal2":false,"playback":false},"playbackMode":"music","testing":"vocal","inspect":"pa","topology":{"mixerLocation":"side-stage","paRig":"powered","wedgeLocation":"stage"}},
  },
  {
    id: 'keys-buried',
    title: 'Keys are buried',
    symptom: 'You can barely hear the keys in the PA. Bring them back up so they sit with the rest of the band.',
    hint: 'Look at the channel fader for the keys, not the gain.',
    solution: 'The keys fader was pulled almost all the way down, so almost nothing reached the mix. Bringing it back up to a normal level put them back in. The fader sets the level going to the mix; the gain sets it at the input.',
    conditions: [],
    start: {"channels":[{"label":"Vocal 1","gain":0.55,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":1},{"label":"Vocal 2","gain":0.55,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.72,"inputTrim":1,"id":2},{"label":"Bass","gain":0.5,"phantom":true,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.65,"inputTrim":1,"id":3},{"label":"Keys","gain":0.45,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.02,"inputTrim":1,"id":4},{"label":"5/6","gain":0.55,"phantom":false,"highpass":false,"pan":0.5,"aux1":0,"aux2":0,"mute":false,"solo":false,"fader":0.7,"inputTrim":1,"id":5,"stereo":true}],"mixer":{"on":true},"master":{"fader":0.55,"mute":false,"aux1":0.75,"aux2":0.75},"outputs":{"pa_l":{"on":true,"mute":false,"volume":0.7},"pa_r":{"on":true,"mute":false,"volume":0.7},"wedge":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":15},"wedge2":{"on":true,"mute":false,"volume":0,"eq":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ringBand":12},"amp":{"on":true}},"cables":{"vocal":1,"vocal2":2,"guitar":3,"laptop":4},"outFan":{"5":"mainL","6":"mainR","7":"aux1","8":"aux2"},"outPatch":{"pa_l":5,"pa_r":6,"wedge":7,"wedge2":8},"fanOut":[1,2,3,4],"sourceMute":{"vocal":false,"guitar":false,"laptop":false,"vocal2":false,"playback":false},"playbackMode":"music","testing":"vocal","inspect":"pa","topology":{"mixerLocation":"side-stage","paRig":"powered","wedgeLocation":"stage"}},
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
  s.channels[2].phantom = true; // bass is an active DI; power it for the show
  s.channels.forEach((c) => { c.aux1 = 0; c.aux2 = 0; c.aux3 = 0; c.aux4 = 0; });
  return s;
}
window.MONITOR_WORLD = [
  {
    id: 'mw1',
    title: 'The second mix',
    task: true,
    symptom: 'The band hears a different mix than the room: their own wedges. The lead singer cannot hear herself. Send her vocal to her wedge (Wedge 1) so she can.',
    hint: 'Her wedge is on and turned up. Send her vocal to it with AUX 1 on the Vocal 1 channel. The room mix does not change.',
    hints: [
      { title: 'Her vocal in her wedge', target: 'ch1-aux', teach: 'A wedge is a separate mix just for the stage. AUX 1 feeds Wedge 1, so opening it on her vocal puts her in her own monitor without touching the room.', text: 'Send the lead vocal to Wedge 1 with AUX 1 on the Vocal 1 channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.35) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'pa', min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.35 },
    ],
    sabotage: (s) => mwBoard(s),
    solution: 'Turn up AUX 1 on the Vocal 1 channel to send her voice to her wedge. The monitor send is a separate mix from the room.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw2',
    title: 'A bit of everyone',
    task: true,
    symptom: 'A wedge is not just one channel. The lead singer has her own voice; now she wants the other singer next to her and a little keys to stay in tune. Build out her wedge (Wedge 1).',
    hint: 'Her own vocal is already in Wedge 1. Add the second singer with AUX 1 on the Vocal 2 channel, and a touch of keys with AUX 1 on the Keyboard channel. Keep both under her own voice.',
    hints: [
      { title: 'Add the other singer', target: 'ch2-aux', teach: 'Every performer wants a bit of each vocal. AUX 1 on the second singer puts her in the lead\'s wedge too, tucked under the lead\'s own voice.', text: 'Add the second singer to her wedge: AUX 1 on the Vocal 2 channel.', done: (ctx) => hintReaches(ctx, 'vocal2', 'wedge', 0.22) },
      { title: 'Add a little keys', target: 'ch4-aux', teach: 'A touch of a tuned instrument helps a singer stay on pitch. Just a little keys, well under the vocals.', text: 'Add a touch of keys: AUX 1 on the Keyboard channel.', done: (ctx) => hintReaches(ctx, 'laptop', 'wedge', 0.18) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.35 },
      { source: 'vocal2', dest: 'wedge', min: 0.22 },
      { source: 'laptop', dest: 'wedge', min: 0.18 },
    ],
    sabotage: (s) => { mwBoard(s); s.channels[0].aux1 = 0.55; return s; },
    solution: 'Every musician wants a bit of each vocal. Her wedge is her own voice, plus the other singer and a little keys underneath so she can hear the song.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw3',
    title: 'The second singer\'s wedge',
    task: true,
    symptom: 'The other singer needs her own mix in her wedge (Wedge 2): her own voice up front, the lead singer next to her, and a little keys. Build it on the AUX 2 sends.',
    hint: 'Wedge 2 runs off AUX 2. Bring up the Vocal 2 channel on AUX 2 for her own voice, then add the lead singer and a little keys on AUX 2.',
    hints: [
      { title: 'Her own voice up front', target: 'ch2-aux', teach: 'Wedge 2 is the second singer\'s monitor, and it runs off AUX 2. Her own voice goes up first and loudest in her own wedge.', text: 'Her own voice: AUX 2 on the Vocal 2 channel.', done: (ctx) => hintReaches(ctx, 'vocal2', 'wedge2', 0.35) },
      { title: 'Add the lead singer', target: 'ch1-aux', teach: 'Same as the lead\'s wedge, in reverse: she wants the other singer next to her, tucked under her own voice.', text: 'Add the lead singer: AUX 2 on the Vocal 1 channel.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge2', 0.22) },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal2', dest: 'pa', min: 0.3 },
      { source: 'vocal2', dest: 'wedge2', min: 0.35 },
      { source: 'vocal', dest: 'wedge2', min: 0.22 },
      { source: 'laptop', dest: 'wedge2', min: 0.18 },
    ],
    sabotage: (s) => mwBoard(s),
    solution: 'Wedge 2 is the second singer\'s mix: her own voice up front, the lead singer and a little keys underneath. Same idea as Wedge 1, built on its own send.',
    defaultInspect: 'wedge2',
  },
  {
    id: 'mw4',
    title: 'The band gets monitors',
    task: true,
    symptom: 'The singers are sorted. Now the players. The bass player\'s wedge sits at their feet (Wedge 3, on AUX 3); the keys player\'s wedge sits at theirs (Wedge 4, on AUX 4). Each one needs their own instrument up, with the vocals so they can follow the song.',
    hint: 'Wedge 3 on AUX 3: bass up, a bit of the lead vocal. Wedge 4 on AUX 4: keys up, a bit of the lead vocal. The instrument is loudest in its own player\'s wedge.',
    hints: [
      { title: 'The bass player\'s wedge', target: ['ch3-aux', 'out-wedge3'], teach: 'Wedge 3 is at the bass player\'s feet, on AUX 3. Their own instrument is loudest, with a little lead vocal so they can follow the song.', text: 'Bass wedge (Wedge 3): AUX 3 on the Bass channel, plus a little lead vocal on AUX 3.', done: (ctx) => hintReaches(ctx, 'guitar', 'wedge3', 0.35) && hintReaches(ctx, 'vocal', 'wedge3', 0.18) },
      { title: 'The keys player\'s wedge', target: ['ch4-aux', 'out-wedge4'], teach: 'Same for the keys player: Wedge 4 on AUX 4, their keys up, a little lead vocal underneath.', text: 'Keys wedge (Wedge 4): AUX 4 on the Keyboard channel, plus a little lead vocal on AUX 4.', done: (ctx) => hintReaches(ctx, 'laptop', 'wedge4', 0.35) && hintReaches(ctx, 'vocal', 'wedge4', 0.18) },
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
    solution: 'Four performers, four wedges. Each player\'s own instrument is loudest in their wedge, with the vocals tucked under so they can follow the song.',
    defaultInspect: 'wedge3',
  },
  {
    id: 'mw5',
    title: 'Keep the stage quiet',
    task: true,
    symptom: 'Someone kept asking for more, and now the lead singer\'s wedge is cranked: loud enough to strain her voice, start a volume war, and ring. Bring her vocal back to a useful level: loud enough to hear, not blasting.',
    hint: 'Pull AUX 1 on the Vocal 1 channel down. She should hear herself clearly without the wedge dominating the stage. If it is ringing, bringing it down stops that too.',
    hints: [
      { title: 'Pull her wedge back', target: 'ch1-aux', teach: 'A quieter stage is a better stage: less strain, less feedback, a cleaner room mix. Bring her vocal send down to where she can hear herself without it dominating.', text: 'Bring AUX 1 on the Vocal 1 channel down to a sensible level, not cranked.', done: (ctx) => { var a = ctx && ctx.audio; var c = a && a.contributions && a.contributions.vocal; return c ? (c.wedge || 0) <= 0.45 : false; } },
    ],
    involves: [1, 2, 3, 4],
    conditions: [
      { source: 'vocal', dest: 'wedge', min: 0.28, max: 0.45 },
    ],
    sabotage: (s) => { mwBoard(s); s.channels[0].aux1 = 0.9; return s; },
    solution: 'Pull her vocal send back to a useful level. Less is more: a quieter stage means less strain, less feedback, and a cleaner mix for everyone.',
    defaultInspect: 'wedge',
  },
  {
    id: 'mw6',
    title: 'Ring it out',
    task: true,
    symptom: 'The lead singer wants more of herself in her wedge, but it rings as soon as you push it. Get her vocal up to a strong level and ring out the feedback on her monitor EQ.',
    hint: 'Bring AUX 1 on the Vocal 1 channel up. When it rings, open the Monitor EQ on Wedge 1: the ringing band glows. Pull that band down just far enough to stop the ring, no more.',
    hints: [
      { title: 'Push it until it rings', target: 'ch1-aux', teach: 'To ring a wedge out you first have to find its limit. Push AUX 1 up until her monitor is strong and just starts to feed back.', text: 'Push AUX 1 on the Vocal 1 channel until her wedge is strong and starts to ring.', done: (ctx) => hintReaches(ctx, 'vocal', 'wedge', 0.5) },
      { title: 'Ring it out', target: 'out-wedge1', teach: 'The ring lives at one frequency, and that band glows on Wedge 1\'s Monitor EQ. Cut just that band, just enough to kill the ring, and she keeps her level.', text: 'Ring it out: pull the glowing band down on Wedge 1\'s Monitor EQ, just enough to stop it.', done: (ctx) => !ctx.feedback },
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
    solution: 'Push her vocal up, then ring it out: pull the glowing band down on her monitor EQ to cut the ringing frequency. A few small cuts buy a lot of level.',
    defaultInspect: 'wedge',
    toneGate: 0.6,
  },
];
