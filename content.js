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
// Ordered as a building-block arc that mirrors Live Sound 101's intro tasks:
// power on → test the system with playback music → patch → phantom → gain →
// PFL → signal path → mute → monitor → feedback. Two gain beats by design:
// room level early (Test the System, the 5/6 playback channel) and the mic
// preamp later (Gain Staging).
// Mic kinds matter here: Vocal Mic 1 is a DYNAMIC (the everyday live vocal, no
// phantom needed) and is the default in the foundational lessons; Vocal Mic 2
// is a CONDENSER, introduced in the Phantom Power lesson because condensers are
// the ones that need +48V. The 5/6 playback channel is a FOH line input
// hardwired to channel 5 (no snake port). See handoff doc for history.
// Ids were renumbered for this arc on 2026-06-10, pre-launch. After launch the
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
      s.master = { ...s.master, mute: true };
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
    // off: the rig is on but the console is still zeroed (every channel muted,
    // faders down, master muted). The playback is connected with a too-low
    // input gain. The student PFLs the playback (listening in the cans), sets
    // the input GAIN so the meter sits in the healthy zone, then unmutes and
    // brings the channel and the master up to unity. That's the gain
    // structure: a good input flowing through unity faders, live and ready.
    // requirePflCheck = the PFL workflow happened; gainStructure.inputBand =
    // the input sits healthy; the unity checks require unmuted + at unity.
    // involves: [5] keeps playback live and mutes the mics. The start state
    // matches Power-On's end so the early lessons build on each other.
    task: true,
    involves: [5],
    requirePflCheck: true,
    gainStructure: { refChannel: 5, unity: 0.75, faderTol: 0.06, inputBand: [0.80, 1.00] },
    conditions: [],
    symptom: 'The rig is powered on and the console is still zeroed. Your playback device is connected. PFL the playback channel, set the input gain so the meter sits healthy in your headphones, then unmute and bring the channel and master faders up to unity.',
    hint: 'Press PFL on the playback channel to hear it in your headphones. Turn the GAIN knob until the input meter sits in the healthy zone, not too low, not in the red. Release PFL, unmute the playback channel and the master, then bring both faders up to unity (the 0 dB mark).',
    sabotage: (s) => {
      // Continuous with Power-On: rig on, console still zeroed. Channels muted
      // with faders down (normalizeChannels for 1-4; this handles 5). Master
      // muted. The only thing set is a too-low input gain on the playback so
      // the gain set is hands-on. PA volume left low so the room stays quiet
      // when the input finally comes up.
      s.channels[4].mute = true;
      s.channels[4].fader = 0;
      s.channels[4].gain = 0.25;
      s.channels[4].aux1 = 0; s.channels[4].aux2 = 0;
      s.master.mute = true; s.master.fader = 0.55;
      s.outputs.pa_l.volume = 0.3; s.outputs.pa_r.volume = 0.3;
      return s;
    },
    solution: 'PFL the playback, set the input gain to the healthy zone, then unmute and bring the channel and master faders up to unity.',
    defaultInspect: 'pa',
  },
  {
    id: 3,
    title: 'Test the System',
    // Step 2 of the real-show setup, building on Set the Input Level: the gain
    // structure is already set (good input, channel + master faders at unity),
    // so now test each output and set the room level. Send the reference to
    // each output and confirm it works, then set the level of each. The PA gets
    // a good-room-level corridor on BOTH sides (0.30-0.50 contribution ~= 84-90
    // dB SPL, set with each speaker's own volume knob in active mode). The
    // wedges just need to play (verifyEach latches each once it gets signal).
    // The faders stay at unity, so the room is set with the speaker volumes.
    // involves: [5] keeps playback live and mutes the mics.
    task: true,
    involves: [5],
    verifyEach: [
      { source: 'playback', dest: 'wedge',  min: 0.25, label: 'Wedge 1 plays' },
      { source: 'playback', dest: 'wedge2', min: 0.25, label: 'Wedge 2 plays' },
    ],
    conditions: [
      { source: 'playback', dest: 'pa_l', min: 0.30, max: 0.50 },
      { source: 'playback', dest: 'pa_r', min: 0.30, max: 0.50 },
    ],
    symptom: 'The input is set and the faders are at unity. Now test the system: send the reference to each speaker, confirm it works, and set a good level in the room on both PA speakers. Check both wedges too.',
    hint: 'The PA speakers and wedges each have their own volume. Bring up each PA speaker until the room sits at a good level on the loudness meter. Send the reference to the wedges with AUX 1 and AUX 2 and bring up each wedge volume so it plays. Leave the faders at unity.',
    sabotage: (s) => {
      // Gain structure already set: good input, channel + master at unity. The
      // outputs are not set yet: PA speakers too quiet, wedges silent.
      s.channels[4].mute = false;
      s.channels[4].gain = 0.5;
      s.channels[4].fader = 0.75;
      s.channels[4].aux1 = 0; s.channels[4].aux2 = 0;
      s.master.fader = 0.75; s.master.mute = false;
      s.outputs.pa_l.volume = 0.3; s.outputs.pa_r.volume = 0.3;
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0; s.outputs.wedge.mute = false;
      s.outputs.wedge2.on = true; s.outputs.wedge2.volume = 0; s.outputs.wedge2.mute = false;
      return s;
    },
    solution: 'Bring up each PA speaker for a good room level, and send the reference to both wedges on AUX 1 and AUX 2 with their volumes up.',
    defaultInspect: 'pa',
  },
  {
    id: 4,
    title: 'Patch & Cable Check',
    symptom: 'The vocal mic channel is silent. The other channels are working.',
    hint: 'Check the cables before you touch any knobs. Each source card shows which channel its cable is plugged into.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.cables.vocal = 0; return s; },
    solution: 'Plug the vocal mic back into channel 1.',
    defaultInspect: 'pa',
  },
  {
    id: 5,
    title: 'Phantom Power',
    // The condenser mic is Vocal Mic 2 (source 'vocal2', patched to channel 2).
    // It's dark because phantom is off. Dynamics (Vocal Mic 1) don't need +48V,
    // so this lesson is where the condenser is introduced. Sabotage targets
    // channels[1] because deriveInvolves maps vocal2 -> port 2 -> channel 2.
    symptom: 'The condenser mic has no signal. Its LED is dark.',
    hint: 'Condenser mics need +48V phantom power. Never turn it on while the channel is live. Mute the channel first, turn on +48V, then unmute.',
    conditions: [{ source: 'vocal2', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[1].phantom = false; return s; },
    solution: 'Mute the channel, turn on +48V, then unmute.',
    defaultInspect: 'pa',
  },
  {
    id: 6,
    // The mic-preamp gain beat. The whole-system gain structure was set with
    // the playback reference back in System Gain Structure (level 3); this is
    // the other half: set the preamp gain per mic channel.
    title: 'Gain Staging',
    symptom: 'The vocal mic is barely registering on the channel meter, even though the fader is up.',
    hint: 'Volume starts at the GAIN knob, not the fader. Turn up GAIN until the channel meter sits in the healthy zone. Leave the fader where it is.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[0].gain = 0; s.channels[0].fader = 0.75; return s; },
    solution: 'Turn up GAIN on the vocal channel until the meter sits in the healthy zone.',
    defaultInspect: 'pa',
  },
  {
    id: 7,
    title: 'Check in PFL',
    // Procedural lesson: real engineers solo (PFL) a new channel into the
    // headphones, listen to verify signal, then bring the fader up. Doing
    // it in the other order means the room hears anything that's wrong
    // (hum, wrong source, missed phantom) before you do.
    //
    // Sabotage: vocal channel fader pulled to 0. Everything else healthy.
    // The student has to PFL the channel first (which auto-routes "your
    // ears" to the cans, and the channel meter shows incoming signal),
    // then release PFL and push the fader up.
    //
    // Win requires: vocal → PA ≥ 0.3 AND requirePflCheck (the workflow
    // tracker latched true at some point during this attempt).
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
    id: 8,
    // Sits after PFL on purpose: by now every stage has been taught on its
    // own, and this one is the synthesis. Walk the whole path.
    title: 'Signal Path',
    symptom: 'Nothing is coming out of the PA. Every level on the console is turned all the way down.',
    hint: 'Follow the signal from the mic to the speaker and turn up each stage along the way.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[0].fader = 0; s.channels[0].gain = 0; s.master.fader = 0; return s; },
    solution: 'Turn up the channel gain, the channel fader, and the master fader.',
    defaultInspect: 'pa',
  },
  {
    id: 9,
    title: 'Monitor Mix',
    symptom: "The singer can't hear herself in her wedge. The PA sounds fine.",
    hint: "Send the vocal to her wedge by turning up AUX 1 on the vocal channel. Don't forget the wedge's own volume knob on stage.",
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.35 },
    ],
    sabotage: (s) => {
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0; s.outputs.wedge.mute = false;
      s.channels.forEach(c => c.aux1 = 0);
      return s;
    },
    solution: 'Turn up AUX 1 on the vocal channel and turn up the wedge volume on stage.',
    defaultInspect: 'wedge',
  },
  {
    id: 10,
    title: 'Feedback Awareness',
    // Vocal channel is up, sending to AUX 1, wedge is cranked. Loop gain
    // is past unity; the wedge is ringing the moment the level loads.
    // Three valid fixes per the detectFeedback math:
    //   - pull channel.aux1 down (most direct, takes the channel out of the
    //     loop without changing what the audience hears)
    //   - pull outputs.wedge.volume down (kills it but the singer loses the
    //     wedge entirely)
    //   - engage channel.hpf (knocks the low-frequency stage rumble out of
    //     the loop; effective loop gain drops ~40% so the wedge sits under
    //     the ring threshold)
    // Win condition still requires vocal → wedge ≥ 0.3, so just yanking
    // the wedge volume to zero won't solve. Has to be a real fix.
    symptom: 'The system is feeding back. The mic is picking up its own sound from the wedge, and it keeps getting louder.',
    hint: 'Three ways to stop it: turn down AUX 1 on the vocal channel, turn down the wedge volume, or turn on HPF to cut the low end out of the loop.',
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.3 },
    ],
    sabotage: (s) => {
      s.outputs.wedge.on = true; s.outputs.wedge.mute = false;
      s.outputs.wedge.volume = 0.85;
      s.channels[0].aux1 = 0.8;
      s.channels[0].highpass = false;
      return s;
    },
    solution: 'Turn down AUX 1 or the wedge volume, or turn on HPF on the vocal channel.',
    defaultInspect: 'wedge',
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
