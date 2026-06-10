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
//   - symptom  : one sentence, what the engineer would observe in the room
//   - hint     : one sentence, gentle nudge if they're stuck
//   - solution : one sentence, what the fix was (shown on solve)
//   - conditions, sabotage, defaultInspect, topology, involves: engine fields
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
    // Cold rig: console, amp, and powered wedges all off, master at unity
    // (the engineer left it up between shows). Two DISTINCT hazards:
    //   - POP (electrical): power the console on while an amp it feeds is
    //     already live and the switch-on transient pops the speakers. Happens
    //     even with the master muted. Caught by wouldPopOnMixerOn ->
    //     cause 'mixer_pop'. Fix is the order: console ON before any amp.
    //   - BLAST (loud signal): power the amp on with the master up and a
    //     full-level mix slams the room. Caught by wouldBlastOnAmpOn ->
    //     cause 'amp_loud'. Fix is master DOWN before the amp.
    // Safe order: console on, master down, amp on, master back up.
    symptom: 'Cold rig. Console, amp, and wedges all off, master left at unity. Bring the system up the right way.',
    hint: "Console on first. Powering the console into a live amp pops the speakers. Then pull the master down before the amp, so a hot mix doesn't slam the room. Order: console, master down, amp, master up.",
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    topology: { paRig: 'amp+passive' },
    sabotage: (s) => {
      // Cold rig: console off, amp off, powered wedges off. Master left at
      // default unity (0.55) so the user must actively pull it before the amp.
      s.mixer = { on: false };
      s.outputs.amp.on = false;
      s.outputs.wedge = { ...s.outputs.wedge, on: false };
      s.outputs.wedge2 = { ...s.outputs.wedge2, on: false };
      return s;
    },
    solution: 'Console on first, then master down, amp on, master back up.',
    defaultInspect: 'pa',
  },
  {
    id: 2,
    title: 'Test the System',
    // The 5/6 playback channel (FOH line input, channel 5) carries music for
    // testing. Verify every destination gets signal: both PA sides via the
    // fader, both wedges via AUX 1/AUX 2 plus the wedge volume knobs on
    // stage (wedge volume defaults to 0). The min+max corridor on the PA
    // conditions is the room-level beat: loud enough to verify, not blasting.
    // normalizeChannels mutes channels 1-4 since only playback is involved.
    symptom: 'Rig is powered. Before anyone steps on stage, send playback music to every speaker: both sides of the PA and both wedges. Keep the room level comfortable.',
    hint: 'Bring up the 5/6 playback channel for the mains, then open AUX 1 and AUX 2 to feed the wedges. The wedge volume knobs are on stage. Watch the room SPL while you set the level.',
    conditions: [
      { source: 'playback', dest: 'pa_l',   min: 0.25, max: 0.6 },
      { source: 'playback', dest: 'pa_r',   min: 0.25, max: 0.6 },
      { source: 'playback', dest: 'wedge',  min: 0.25 },
      { source: 'playback', dest: 'wedge2', min: 0.25 },
    ],
    sabotage: (s) => {
      // Playback channel silent: muted, fader down, sends closed. Wedge
      // volumes are 0 by default, so the stage walk is part of the lesson.
      s.channels[4].mute = true;
      s.channels[4].fader = 0;
      s.channels[4].aux1 = 0;
      s.channels[4].aux2 = 0;
      return s;
    },
    solution: 'Unmute 5/6 and bring the fader up for the mains, open AUX 1 and AUX 2, then bring up both wedge volumes on stage.',
    defaultInspect: 'pa',
  },
  {
    id: 3,
    title: 'Patch & Cable Check',
    symptom: 'Vocal channel is silent. Other channels look fine.',
    hint: 'Check the physical connections before you touch a knob. The source card shows which channel each cable lands on.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.cables.vocal = 0; return s; },
    solution: 'Plug the vocal mic into Ch 1.',
    defaultInspect: 'pa',
  },
  {
    id: 4,
    title: 'Phantom Power',
    // The condenser mic is Vocal Mic 2 (source 'vocal2', patched to channel 2).
    // It's dark because phantom is off. Dynamics (Vocal Mic 1) don't need +48V,
    // so this lesson is where the condenser is introduced. Sabotage targets
    // channels[1] because deriveInvolves maps vocal2 -> port 2 -> channel 2.
    symptom: 'New condenser mic, no signal. The mic LED is dark.',
    hint: 'Condenser mics need +48V. Never engage it on a hot channel. Pull the fader or mute first.',
    conditions: [{ source: 'vocal2', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[1].phantom = false; return s; },
    solution: 'Mute the channel, engage +48V, then unmute.',
    defaultInspect: 'pa',
  },
  {
    id: 5,
    // The mic-preamp gain beat. Room level was set with playback back in
    // Test the System; this is the other half: set the preamp per channel.
    title: 'Gain Staging',
    symptom: 'Playback tested fine, but the vocal mic is barely moving the channel meter, even with the fader up.',
    hint: 'Set the preamp first. Open GAIN until the channel meter sits in the healthy zone. The fader stays near unity.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[0].gain = 0; s.channels[0].fader = 0.75; return s; },
    solution: 'Push GAIN up on the vocal channel until the meter sits healthy.',
    defaultInspect: 'pa',
  },
  {
    id: 6,
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
    symptom: 'New vocal channel is patched in. Before you bring it up in front of the audience, verify in your cans that the channel is hot.',
    hint: 'Engage PFL on the vocal channel. Your ears switch to the cans. If you see signal on the PFL meter, release it and bring the channel up.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    requirePflCheck: true,
    sabotage: (s) => { s.channels[0].fader = 0; return s; },
    solution: 'PFL the vocal, verify signal in the cans, release PFL, push the fader up.',
    defaultInspect: 'pa',
  },
  {
    id: 7,
    // Sits after PFL on purpose: by now every stage has been taught on its
    // own, and this one is the synthesis. Walk the whole path.
    title: 'Signal Path',
    symptom: 'The console is at zero. Nothing is coming out of the PA.',
    hint: 'Walk from the mic to the speaker. Every stage between has to be open.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[0].fader = 0; s.channels[0].gain = 0; s.master.fader = 0; return s; },
    solution: 'Open the channel gain, fader, and master fader.',
    defaultInspect: 'pa',
  },
  {
    id: 8,
    title: 'Mute Check',
    // Two beats: a channel mute and a master mute, both engaged. The student
    // catches the channel mute first (more obvious), then has to find the
    // master mute when the room is still silent.
    symptom: 'The vocal channel meter is moving, but the room is silent.',
    hint: 'Mute is the cheapest first check. Look at the channel mutes, then the master.',
    conditions: [{ source: 'vocal', dest: 'pa', min: 0.3 }],
    sabotage: (s) => { s.channels[0].mute = true; s.master.mute = true; return s; },
    solution: 'Unmute the vocal channel and the master bus.',
    defaultInspect: 'pa',
  },
  {
    id: 9,
    title: 'Monitor Mix',
    symptom: "Singer can't hear herself in the wedge. The PA is fine.",
    hint: "Send the vocal to her wedge with AUX 1. Don't forget the wedge volume on stage.",
    conditions: [
      { source: 'vocal', dest: 'pa',    min: 0.3 },
      { source: 'vocal', dest: 'wedge', min: 0.35 },
    ],
    sabotage: (s) => {
      s.outputs.wedge.on = true; s.outputs.wedge.volume = 0; s.outputs.wedge.mute = false;
      s.channels.forEach(c => c.aux1 = 0);
      return s;
    },
    solution: 'Open AUX 1 on the vocal channel and bring up the wedge volume.',
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
    symptom: 'Wedge is ringing. The mic is hearing itself through the wedge and the loop is feeding back.',
    hint: 'Three knobs in the loop: the channel aux send, the wedge volume, and HPF on the channel. Any one of them low enough breaks the loop.',
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
    solution: 'Pull AUX 1 (or wedge volume) down. HPF on the vocal channel pulls stage rumble out of the loop.',
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
