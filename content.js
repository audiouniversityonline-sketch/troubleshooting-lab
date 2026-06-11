/* ============================================================
   content.js - Troubleshooting Lab scenario data
   ------------------------------------------------------------
   The level/challenge library, split out of index.html so new
   scenarios can be dripped in by editing this one small file
   instead of the app shell. Loaded as a plain <script> BEFORE
   the app's babel blocks, so keep it plain JS (arrow functions
   are fine; no JSX).

     window.LEVELS         - the free Essentials tier, in order.
     window.CHALLENGE_BANK - paid-tier scenarios (dormant stubs).

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
//   - verifyEach : [{source, dest, min, label}] — verify outputs one at a
//                time. Each destination LATCHES checked the moment its source
//                reaches it (>= min) and stays checked, so the win does NOT
//                need them all live at once. Win when every entry is checked.
//                Use with conditions: [] and an explicit involves.
//   - gainStructure : { refChannel, unity, faderTol, inputBand? } — gain-
//                structure lesson. Win also requires the reference channel's
//                fader AND the master fader to sit at unity (within faderTol).
//                Optional inputBand [lo, hi] also requires the ref channel's
//                input (chanIn baseline) to sit in a healthy band, so the
//                student sets the input gain by hand (pair with requirePflCheck
//                to make them verify it in PFL first).
//   - conditions, sabotage, defaultInspect, topology, involves: engine fields
//
// Prose rule (Kyle, 2026-06-10): write simple and clear, not "in character."
// Don't reach for engineer slang or scene-setting to sound like the niche.
// Plain sentences that say what's happening beat flavor every time, and
// they're easier for beginners.
//
// REFOCUSED 2026-06-10 PM (Kyle): the free Essentials are now setting up a
// system and learning the standard input types, as a continuous on-site build.
// The 9 lessons, in order:
//   1 Power-On Sequence   - bring the rig up in the right order (active speakers)
//   2 Set the Input Level - PFL the playback, set gain, faders to unity
//   3 Test the System     - send to each output, set the room level
//   4 Mic Inputs          - dynamic (no power) + condenser (+48V)
//   5 DI Boxes            - passive (no power) + active (+48V)
//   6 Monitor Mix         - send a wedge mix
//   7 Feedback Awareness  - keep the monitor loop under control
//   8 The Gig             - final exam: the whole setup from a cold start
//   9 Power-Down          - shut the system down in the right order
// The early levels build on each other (each starts where the last ended).
// Troubleshooting faults (Patch, Gain, PFL, Signal Path, Mute, Pan) live in the
// paid CHALLENGE_BANK, where "something's broken, fix it" is the point.
// Source types: Vocal Mic 1 = dynamic, Vocal Mic 2 = condenser (+48V); Bass DI
// = passive, Keyboard DI = active (diActive, needs +48V like a condenser). The
// 5/6 playback is a FOH line input on channel 5 (no snake port).
// Ids renumbered for this arc on 2026-06-10, pre-launch. After launch the
// append-only rule is absolute.
window.LEVELS = [
  {
    id: 1,
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
    symptom: 'Everything is connected and the console is zeroed out (every setting is set to its default state). It\'s time to power on the whole system: the console, the wedges, and the two PA speakers.',
    hint: 'Power on from the console end first, then the powered speakers last. If you turn a PA speaker or wedge on first and then switch the console on, the console sends a pop to the speakers. So: console first, then the wedges and the PA speakers.',
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
      return s;
    },
    solution: 'Turn the console on first, then the wedges and the two PA speakers.',
    defaultInspect: 'pa',
  },
  {
    id: 2,
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
    symptom: 'The rig is on and the console is fully zeroed. Your playback device is connected. PFL the playback, set the input gain healthy in your headphones, unmute and bring the channel and master faders to unity, then set the PA speaker level for a good loudness in the room.',
    hint: 'Press PFL on the playback to hear it in your headphones. Set the GAIN so the meter sits in the healthy zone. Release PFL, unmute the playback and the master, and bring both faders up to unity. Then bring up the PA speaker volume until the room sits at a good level on the loudness meter.',
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
    id: 3,
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
    symptom: 'The PA is set. Now bring up your monitor wedges. Send the reference out to each wedge and confirm it plays. AUX 1 feeds Wedge 1, AUX 2 feeds Wedge 2.',
    hint: 'Turn up AUX 1 on the playback channel and bring up the Wedge 1 volume on stage until it plays. Do the same with AUX 2 for Wedge 2. Each wedge gets checked off once it is playing.',
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
    id: 4,
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
    id: 5,
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
    id: 6,
    title: 'Monitor Mix',
    // A positive setup task, not a problem: build the singer her monitor mix.
    // The wedge volume is already up (set in Test the Wedges and kept), so this
    // is purely the aux send: open AUX 1 on the vocal to feed her wedge.
    symptom: 'The singer needs to hear themselves on stage. Send her vocal to her wedge so she can hear herself.',
    hint: 'Her wedge is on and turned up. Send her vocal to it by turning up AUX 1 on the vocal channel.',
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
    id: 7,
    title: 'Feedback Awareness',
    // Does NOT start ringing. The singer has a little of herself in the wedge
    // (aux 1 low) and asks for more. As the student turns AUX 1 up to give her
    // more, the loop gain crosses the ring threshold and the wedge starts to
    // feed back. To win, the student needs the vocal LOUD in the wedge
    // (>= 0.6) AND no feedback, so pulling the send back down won't do it.
    // For now HPF clears it (drops the low-end loop gain ~40% while the wedge
    // level stays up). NEXT TURN: add an EQ on the aux outputs as the real,
    // surgical fix; HPF is the stopgap so the level is solvable today.
    symptom: 'The singer still can\'t hear herself well in her wedge. Turn her vocal up in the monitor for her. Careful, monitors feed back when you push them too hard.',
    hint: 'Turn up AUX 1 on the vocal to give her more in her wedge. When it starts to ring, look at the monitor EQ on her wedge: the ringing frequency glows. Pull that band down to cut it. The ring stops and her level stays up. (HPF only helps low-frequency ring, not this one.)',
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.7 },
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
    id: 8,
    title: 'The Gig',
    // FINAL EXAM. Everything from Levels 1-7 performed start to finish from a
    // cold venue, with no new skills. This is a LINE CHECK, the objective
    // version of soundcheck: nobody judges the blend, the student proves every
    // signal arrives clean. Win = power-on order (requirePowerOn) + playback
    // reference at unity with healthy input gain (gainStructure) + room level
    // (playback PA corridor, same numbers as Set the Input Level) + every
    // input PFL'd (requirePflEach 1-5) + every source present in the PA + the
    // singer's wedge running, all with no pop / clip / ring (built-in gates).
    // The per-source PA minimum is 0.08, deliberately lower than the 0.3 used
    // when inputs were brought up alone: five inputs share one mix bus, and
    // the desk clips if they all sit at solo level. Managing that summing is
    // part of the exam. Feasibility was tuned against the engine: playback at
    // unity (post 0.60-0.75) + four inputs at post 0.16-0.24 each keeps the
    // main bus under the 1.22 clip threshold with envelope headroom, and the
    // per-channel fader window (roughly 0.29-0.45 at gain 0.2) is wide enough
    // to find without pixel-hunting.
    task: true,
    requirePowerOn: true,
    requirePflEach: [1, 2, 3, 4, 5],
    gainStructure: { refChannel: 5, unity: 0.75, faderTol: 0.06, inputBand: [0.80, 1.00] },
    conditions: [
      { source: 'playback', dest: 'pa', min: 0.30, max: 0.50 },
      { source: 'vocal',    dest: 'pa', min: 0.08 },
      { source: 'vocal2',   dest: 'pa', min: 0.08 },
      { source: 'guitar',   dest: 'pa', min: 0.08 },
      { source: 'laptop',   dest: 'pa', min: 0.08 },
      { source: 'vocal',    dest: 'wedge', min: 0.35 },
    ],
    topology: { paRig: 'powered' },
    symptom: 'Final exam. You are opening the venue alone today. Everything is connected, the system is off, and the console is zeroed. Do the whole job: power on in the right order, set the playback level and the room level, check every input and bring it into the PA, and give the singer her vocal in her wedge. Keep it clean the whole way.',
    hint: 'It is everything you have already done, in the order you learned it. Console on first, then the speakers. PFL the playback, set its gain, faders to unity, then the room level. PFL each input, set its gain, bring it up. Turn on +48V for the condenser and the active DI while the channel is muted and before you PFL it. Open AUX 1 on the vocal for her wedge. If the console clips with everything up, bring the channel faders down a little: five inputs share one mix.',
    sabotage: (s) => {
      // Cold venue. Everything off, console zeroed, nothing set.
      s.mixer = { on: false };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: false, volume: 0, mute: false };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: false, volume: 0, mute: false };
      s.outputs.wedge = { ...s.outputs.wedge, on: false, volume: 0, mute: false };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false, volume: 0, mute: false };
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
    solution: 'The whole setup, start to finish: power in order, playback reference at unity, room level, every input checked in PFL and brought up clean, and the singer hearing herself in her wedge. That was a full line check. This is the job.',
    defaultInspect: 'pa',
  },
  {
    id: 9,
    title: 'Power-Down',
    // The bookend. Power-off is power-on in reverse: master fader down,
    // powered boxes off FIRST, console off LAST. Turning the console off
    // while a powered speaker is still live plays the console's power-off
    // transient through it (cause 'mixer_off_pop' — same physics as the
    // Level 1 pop, opposite direction). The win is requirePowerOff: master
    // fader down + both wedges off + both PA speakers off + console off.
    // Start state is the end of the night: the band's inputs still live at
    // modest levels (tuned so the standing mix doesn't clip or ring), master
    // at unity, everything powered. conditions: [] — this is a power lesson,
    // not a signal lesson. involves keeps channels 1-4 live for the sabotage.
    task: true,
    requirePowerOff: true,
    involves: [1, 2, 3, 4],
    conditions: [],
    topology: { paRig: 'powered' },
    symptom: 'The show is over and the band has gone home. Shut the system down: pull the master fader all the way down, turn off the wedges and the PA speakers, then turn the console off last.',
    hint: 'Power-off is power-on in reverse. The speakers go off first and the console goes off last: a console makes a pop when it switches off, and any powered speaker still on will play that pop. Pull the master all the way down first so the console is zeroed for the next show.',
    sabotage: (s) => {
      // End-of-night state: the band's inputs live at modest show levels
      // (main bus ~0.97, under the 1.22 clip threshold with envelope
      // headroom; vocal-to-wedge ~0.22, well under the 0.55 ring threshold).
      s.channels[0].mute = false; s.channels[0].fader = 0.55; s.channels[0].gain = 0.3; s.channels[0].phantom = false; s.channels[0].aux1 = 0.45; s.channels[0].aux2 = 0;
      s.channels[1].mute = false; s.channels[1].fader = 0.55; s.channels[1].gain = 0.3; s.channels[1].phantom = true;  s.channels[1].aux1 = 0;    s.channels[1].aux2 = 0;
      s.channels[2].mute = false; s.channels[2].fader = 0.4;  s.channels[2].gain = 0.3; s.channels[2].phantom = true;  s.channels[2].aux1 = 0;    s.channels[2].aux2 = 0;
      s.channels[3].mute = false; s.channels[3].fader = 0.4;  s.channels[3].gain = 0.3; s.channels[3].phantom = false; s.channels[3].aux1 = 0;    s.channels[3].aux2 = 0;
      s.channels[4].mute = true;  s.channels[4].fader = 0;    s.channels[4].gain = 0;   s.channels[4].aux1 = 0;        s.channels[4].aux2 = 0;
      s.master = { ...s.master, mute: false, fader: 0.75 };
      s.mixer = { on: true };
      s.outputs.pa_l = { ...s.outputs.pa_l, on: true, volume: 0.6, mute: false };
      s.outputs.pa_r = { ...s.outputs.pa_r, on: true, volume: 0.6, mute: false };
      s.outputs.wedge = { ...s.outputs.wedge, on: true, volume: 0.6, mute: false };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: true, volume: 0.6, mute: false };
      return s;
    },
    solution: 'Master down, speakers off, console off last. The system is safe, and the console is zeroed for whoever powers it on next.',
    defaultInspect: 'pa',
  },
];

// CHALLENGE_BANK — paid-tier launch inventory.
//
// Cut from the free tutorial set: harder presentations of the consolidated
// concepts (Master Mute, Powered Speakers, Second Monitor, Pre-Show,
// FOH Master, Both Wedges, Soft Vocal) plus the always-paid combos (Multiple
// Faults, Crossed at Stage Box, Crossed at Fan-Out). Currently dormant —
// they're preserved here so Phase D can wire them into challenge mode without
// re-authoring each config.
//
// Voice has NOT been swept on these yet; that happens when they become
// challenges (the room/meters split changes what the prose looks like).
window.CHALLENGE_BANK = [
  // Moved out of the Essentials 2026-06-10 PM when the free tier refocused on
  // setup + standard input types (per Kyle). These are troubleshooting faults
  // that belong in the paid Challenges, where "something's broken, fix it" is
  // the point. Preserved verbatim; dormant until challenge mode ships.
  {
    id: 'C-patch-cable',
    title: 'Patch & Cable Check',
    symptom: 'The vocal mic channel is silent. The other channels are working.',
    hint: 'Check the cables before you touch any knobs. Each source card shows which channel its cable is plugged into.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.cables.vocal = 0; return s; },
    solution: 'Plug the vocal mic back into channel 1.',
    defaultInspect: 'pa',
  },
  {
    id: 'C-gain-staging',
    title: 'Gain Staging',
    symptom: 'The vocal mic is barely registering on the channel meter, even though the fader is up.',
    hint: 'Volume starts at the GAIN knob, not the fader. Turn up GAIN until the channel meter sits in the healthy zone. Leave the fader where it is.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[0].gain = 0; s.channels[0].fader = 0.75; return s; },
    solution: 'Turn up GAIN on the vocal channel until the meter sits in the healthy zone.',
    defaultInspect: 'pa',
  },
  {
    id: 'C-check-pfl',
    title: 'Check in PFL',
    task: true,
    symptom: 'A new vocal channel is plugged in. Before you bring it up for the audience, use PFL to check in your headphones that the channel is getting signal.',
    hint: 'Press PFL on the vocal channel. You are now listening through the headphones. If you see and hear signal, release PFL and bring the fader up.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    requirePflCheck: true,
    sabotage: (s) => { s.channels[0].fader = 0; return s; },
    solution: 'Press PFL to check the channel in your headphones, release it, then bring the fader up.',
    defaultInspect: 'pa',
  },
  {
    id: 'C-signal-path',
    title: 'Signal Path',
    symptom: 'Nothing is coming out of the PA. Every level on the console is turned all the way down.',
    hint: 'Follow the signal from the mic to the speaker and turn up each stage along the way.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[0].fader = 0; s.channels[0].gain = 0; s.master.fader = 0; return s; },
    solution: 'Turn up the channel gain, the channel fader, and the master fader.',
    defaultInspect: 'pa',
  },
  {
    id: 'C-pan-vocal',
    title: 'Pan the Vocal',
    // Cut from the Essentials 2026-06-10 when Test the System took its slot.
    // Dormant until challenge mode ships; prose not yet reworked for the
    // challenge presentation (symptom-only, hidden solution).
    symptom: 'Vocal is loud on the left side of the room, missing on the right.',
    hint: 'Find PAN on the vocal channel and set it back to center.',
    conditions: [
      { source: 'vocal', dest: 'pa_l', min: 0.25 },
      { source: 'vocal', dest: 'pa_r', min: 0.25 },
    ],
    sabotage: (s) => { s.channels[0].pan = 0; return s; },
    solution: 'Pan the vocal to center.',
    defaultInspect: 'pa',
  },
  {
    id: 'C-mute-check',
    title: 'Mute Check',
    // Moved out of the Essentials 2026-06-10 when System Gain Structure took a
    // slot and Kyle chose to hold the free tier at 10. Dormant until challenge
    // mode ships. Two beats: a channel mute and a master mute, both engaged.
    symptom: 'The vocal channel meter is moving, but the room is silent.',
    hint: 'Check the mute buttons first. Look at the channel mutes, then the master.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[0].mute = true; s.master.mute = true; return s; },
    solution: 'Unmute the vocal channel and the master.',
    defaultInspect: 'pa',
  },
  // {
  //   id: 'C-master-mute', title: 'Master Mute', ...
  // },
  // {
  //   id: 'C-speakers-off', title: 'Speakers Off (Powered)', ...
  // },
  // {
  //   id: 'C-second-monitor', title: 'Second Monitor', ...
  // },
  // {
  //   id: 'C-silent-preshow', title: 'Silent Pre-Show', ...
  // },
  // {
  //   id: 'C-multiple-faults', title: 'Multiple Faults', ...
  // },
  // {
  //   id: 'C-wrong-channel', title: 'Wrong Channel', ...
  // },
  // {
  //   id: 'C-foh-master', title: 'From the Booth (FOH)', ...
  // },
  // {
  //   id: 'C-both-wedges', title: 'Both Wedges Live', ...
  // },
  // {
  //   id: 'C-crossed-stage-box', title: 'Crossed at the Stage Box', ...
  // },
  // {
  //   id: 'C-crossed-fan-out', title: 'Crossed at the Fan-Out', ...
  // },
  // {
  //   id: 'C-soft-vocal', title: 'Soft Vocal (source-limited)', ...
  // },
];
