// ============================================================================
//  IFRA: THE FINAL VERDICT — central, editable configuration
//  Every line of dialogue, accusation, exhibit and the final letter lives here.
// ============================================================================

export const FRIEND_NAME = 'Ifra'
export const FRIEND_FULL_NAME = 'Ifra Ashraf'
export const GAME_TITLE = 'Ifra: The Final Verdict'
export const GAME_SUBTITLE = 'Every case has a story. This one has a little attitude.'

// INTERNAL ONLY — identifies the anonymous helper character in code.
// This value is never rendered on screen or used in dialogue.
export const HELPER_NAME = 'Hamza Ali (Tipu)'
export const HELPER_ROLE = 'anonymous-helper'

// The helper's consistent visual identity (used by every appearance).
export const HELPER_LOOK = {
  jacket: '#1f2430', // simple dark jacket
  shirt: '#ece3d0',
  trousers: '#2a2620',
  hair: '#120d0a',
  skin: '#c89474',
  watch: '#d9b86a', // gold watch on the left wrist
  pin: '#d9b86a', // small gold star pin on the lapel
}
// The small mark he leaves on every note (and on the gift).
export const HELPER_MARK = '✦'

export const COURT_NAME = 'THE HIGH COURT OF MAIN CHARACTERS'

export const OPENING = {
  lines: [COURT_NAME, 'An unusual case has just arrived.'],
  summonsTitle: `SUMMONS FOR: ${FRIEND_FULL_NAME.toUpperCase()}`,
  summonsLead: 'Your presence is required immediately.',
  chargesTitle: 'Charges filed against you:',
  charges: [
    'Excessive photogenic behaviour.',
    'Unreasonable levels of confidence.',
    'Professional overthinking.',
    'Being unnecessarily dramatic.',
    'Making everyone else question their camera angles.',
  ],
  enterButton: 'ENTER THE COURTROOM',
  loading: 'Preparing your legal destiny...',
}

export const CHAPTERS = {
  reception: { num: 'Chapter One', title: 'The Mysterious Summons' },
  evidence: { num: 'Chapter Two', title: 'The Investigation' },
  courtroom: { num: 'Chapter Three', title: 'The Courtroom Trial' },
  helper: { num: 'Chapter Four', title: 'The Unexpected Helper' },
  verdict: { num: 'Chapter Five', title: 'The Final Verdict' },
  courtyard: { num: 'Epilogue', title: 'The Graduation' },
}

export const CUSTOMIZATION = {
  hairStyles: [
    { id: 'long', label: 'Long & Flowing' },
    { id: 'ponytail', label: 'Power Ponytail' },
    { id: 'bun', label: 'Courtroom Bun' },
    { id: 'bob', label: 'Sharp Bob' },
  ],
  hairColors: ['#1a110c', '#3b2216', '#5c3a24', '#7a4a2a', '#2b1b2e'],
  // co-ord suit colours: cream, soft blush, muted burgundy, black, sage pastel
  outfitColors: ['#efe4d2', '#e6c2bf', '#6e2233', '#1f1c1f', '#b8c4ae'],
  accessories: [
    { id: 'earrings', label: 'Gold Earrings' },
    { id: 'glasses', label: 'Reading Glasses' },
    { id: 'pearls', label: 'Pearl Necklace' },
    { id: 'none', label: 'None' },
  ],
  defaults: { hairStyle: 'long', hairColor: '#1a110c', outfitColor: '#efe4d2', accessory: 'earrings' },
}

// ---------------------------------------------------------------------------
// CHAPTER ONE — reception
// ---------------------------------------------------------------------------
export const RECEPTION = {
  objectiveTalk: 'Speak to the receptionist',
  objectiveSummons: 'Collect your summons from the counter',
  objectiveEnter: 'Enter the Evidence Wing (north doors)',
  intro: [
    { speaker: 'Receptionist', text: `You're ${FRIEND_NAME}, right? The judge has been waiting.` },
    { speaker: FRIEND_NAME, text: 'What exactly is this case about?' },
    { speaker: 'Receptionist', text: 'Honestly, I stopped trying to understand it.' },
    { speaker: 'Receptionist', text: 'All I know is the file is thick, the charges are ridiculous, and the judge cancelled lunch for this.' },
  ],
  choice: {
    prompt: 'How do you respond?',
    options: [
      { text: 'Tell the judge I have arrived. Dramatically.', reply: 'Noted. I will dim the lights for your entrance.' },
      { text: 'Is there coffee in this courthouse?', reply: 'There is a machine. It has seen things. I would not trust it.' },
      { text: 'I am innocent. Probably. Mostly.', reply: 'That is the most honest plea I have heard all week.' },
    ],
  },
  outro: [
    { speaker: 'Receptionist', text: 'Your summons is on the counter. Sign for it, then go review the evidence in the Evidence Wing.' },
    { speaker: 'Receptionist', text: 'And try not to be too iconic in the hallway. It distracts security.' },
  ],
  summonsItem: { id: 'summons', name: 'Official Summons', desc: 'Signed, sealed and suspiciously dramatic.' },
  remindSummons: 'The envelope on the counter, dear. The one with your name in gold.',
  afterSummons: 'Evidence Wing is through the north doors. Good luck. You will need it. Or not. Honestly, unclear.',
  doorLocked: 'The doors will not open until you have your summons.',
  hidden: {
    clock: { title: 'Wall Clock', text: 'It is permanently five minutes before a deadline. Very law school.' },
    board: { title: 'Notice Board', text: 'NOTICE: Excessive confidence must be declared at security. Main characters use the left lane.' },
    coffee: { title: 'Coffee Cup', text: 'Legal advice: Never underestimate caffeine.' },
    book: { title: 'Law Textbook', text: 'Warning: May cause excessive reading and temporary loss of happiness.' },
    detector: { title: 'Metal Detector', text: 'BEEP. Detected: one (1) dangerously high level of confidence. Allowed through anyway.' },
  },
}

// ---------------------------------------------------------------------------
// CHAPTER TWO — investigation
// ---------------------------------------------------------------------------
export const EVIDENCE = [
  {
    id: 'A', key: 'photos', name: 'A Collection of Photographs',
    desc: 'Exhibit A: An unusually high number of photographs. The prosecution considers this suspicious.',
    reaction: 'In my defence, the lighting was very good that day. And the day after. And every day.',
  },
  {
    id: 'B', key: 'receipt', name: 'A Coffee Receipt',
    desc: 'Exhibit B: Evidence of excessive coffee consumption during academic hours.',
    reaction: 'Seven lattes in one week is not a crime. It is a lifestyle.',
  },
  {
    id: 'C', key: 'notebook', name: 'A Notebook',
    desc: 'Exhibit C: A documented history of overthinking completely unnecessary situations.',
    reaction: 'Page 14: "What if they replied \'ok\' instead of \'okay\'?" ...I stand by that analysis.',
  },
  {
    id: 'D', key: 'magazine', name: 'A Fashion Magazine',
    desc: 'Exhibit D: The defendant has clearly spent considerable time maintaining her appearance.',
    reaction: 'Research. Purely academic research.',
  },
  {
    id: 'E', key: 'textbook', name: 'A Law Textbook',
    desc: 'Exhibit E: Proof that the defendant has survived an unreasonable amount of legal reading.',
    reaction: 'Every highlighter I have ever owned died for this book.',
  },
]

export const INVESTIGATION = {
  objectiveCollect: (n) => `Investigate the evidence (${n}/5 exhibits)`,
  objectiveDesk: 'Return to your desk',
  objectiveCoffee: 'Take a moment (drink the coffee)',
  objectiveExit: 'Head to the courtroom (east door)',
  doorLocked: (n) => `The courtroom door is sealed until all evidence is reviewed (${n}/5).`,
  doorDesk: 'You should take a breather at your desk first.',
  tired: [
    { speaker: FRIEND_NAME, text: 'Three exhibits in and my brain is already filing for a recess.' },
    { speaker: FRIEND_NAME, text: 'Maybe I will sit at my desk for a minute.' },
  ],
  coffeeFound: [
    { speaker: FRIEND_NAME, text: '...Wait. Who left this here?' },
  ],
  coffeeNote: 'Even future lawyers need a break.',
  coffeeAfter: [
    { speaker: FRIEND_NAME, text: 'Okay. That was exactly what I needed.' },
    { speaker: FRIEND_NAME, text: 'Recess over. Back to the case.' },
  ],
  drawer: {
    title: 'Locked Drawer',
    text: 'A three-digit combination lock. A sticky note on the evidence board might help.',
    code: '553',
    solved: 'Click. The drawer slides open.',
    wrong: 'The lock does not budge. Overthink it a little more.',
  },
  stickyNote: {
    title: 'Clerk\'s Sticky Note',
    text: 'Drawer code, for my forgetful self:\n① number of charges\n② number of exhibits\n③ number of witnesses (it says three on the trial schedule)',
  },
  hidden: {
    cabinet: { title: 'Filing Cabinet', text: 'Alphabetised. Colour-coded. Labelled "MISC — DRAMA". It is very full.' },
    lamp: { title: 'Desk Lamp', text: 'It flickers whenever someone says "it\'s fine" about an exam.' },
    board: { title: 'Evidence Board', text: 'Red string connects a photo of you to a photo of a coffee cup to a photo of a deadline. Conspiracy confirmed.' },
  },
  allCollected: [
    { speaker: FRIEND_NAME, text: 'That\'s all five. The prosecution has nothing I can\'t explain.' },
    { speaker: FRIEND_NAME, text: 'Courtroom. Let\'s go.' },
  ],
}

// ---------------------------------------------------------------------------
// CHAPTER THREE — the trial
// ---------------------------------------------------------------------------
export const TRIAL = {
  objectiveSeat: 'Take your place at the defence table',
  opening: [
    { speaker: 'Judge', text: 'Order! Order! The court is now in session.', sfx: 'gavel' },
    { speaker: 'Judge', text: `The defendant, ${FRIEND_NAME}, is charged with being excessively iconic.` },
    { speaker: 'Prosecutor', text: 'The prosecution will prove, beyond reasonable doubt, that she is simply too much, Your Honour.' },
    { speaker: 'Judge', text: 'How does the defendant plead?' },
  ],
  plea: {
    prompt: 'Your plea:',
    options: [
      { text: 'Your Honour, I plead fabulous.', judge: 'The court... was not prepared for that. Noted. Fabulously.' },
      { text: 'I would like to object to this unnecessary questioning.', judge: 'You cannot object to the plea, counsel. But I admire the audacity.', objection: true },
      { text: 'I demand a coffee break.', judge: 'Denied. But the court sympathises deeply.' },
    ],
  },
  witnesses: [
    {
      id: 'classmate', role: 'The Classmate', look: 'classmate',
      intro: 'The prosecution calls the defendant\'s classmate!',
      question: 'Does the defendant take her studies seriously?',
      answer: 'Absolutely. Especially when the deadline is approximately five minutes away.',
      cross: {
        prompt: 'Cross-examine the classmate:',
        options: [
          { text: 'Isn\'t it true that I still submitted everything on time?', witness: '...Yes. Annoyingly, yes. Always.', judge: 'A strong point for the defence.' },
          { text: 'Objection! Deadlines are a social construct!', witness: 'Can she say that?', judge: 'Overruled. But I felt that in my soul.', objection: true },
          { text: 'Can we talk about how you borrowed my notes every week?', witness: 'That is... irrelevant!', judge: 'The witness will answer. Did you borrow the notes?' },
        ],
      },
      present: { prompt: 'Present evidence that proves your dedication:', correct: 'E', success: 'Look at these highlights, Your Honour. Every. Single. Page. I simply enjoy a little suspense.', judge: 'The court accepts Exhibit E. Nobody reads that much law by accident.', fail: 'The court fails to see how that proves academic dedication. Try again, counsel.' },
    },
    {
      id: 'photographer', role: 'The Photographer', look: 'photographer',
      intro: 'The prosecution calls the photographer!',
      question: 'How many photographs does the defendant usually take?',
      answer: 'Your Honour, I stopped counting.',
      cross: {
        prompt: 'Cross-examine the photographer:',
        options: [
          { text: 'Were any of those photographs bad?', witness: '...No. That is the problem. They are all good.', judge: 'Hm. That is a very specific kind of problem.' },
          { text: 'Objection! The witness is jealous of my angles!', witness: 'I am a professional!', judge: 'Sustained. Everyone is jealous of those angles.', objection: true },
          { text: 'Your Honour, I plead fabulous. Again.', witness: 'She does this every time.', judge: 'The court is beginning to understand the prosecution\'s frustration.' },
        ],
      },
      present: { prompt: 'Present evidence about the photographs:', correct: 'A', success: 'Your Honour, quantity was necessary to preserve quality. Look at them. Masterpieces.', judge: '...The court cannot argue with that. Exhibit A is admitted. And frankly, framed.', fail: 'That is lovely, counsel, but we are discussing photographs.' },
    },
    {
      id: 'barista', role: 'The Coffee Shop Owner', look: 'barista',
      intro: 'The prosecution calls the owner of the campus coffee shop!',
      question: 'Does the defendant consume excessive coffee?',
      answer: 'Your Honour, she might be personally responsible for keeping this business alive.',
      cross: {
        prompt: 'Cross-examine the coffee shop owner:',
        options: [
          { text: 'So I am a loyal customer supporting local business?', witness: '...When you put it like that, you are basically a hero.', judge: 'An economic defence. Bold.' },
          { text: 'Objection! Coffee is a legal study aid!', witness: 'She is not wrong.', judge: 'Sustained. This court runs on it too.', objection: true },
          { text: 'I demand a coffee break.', witness: 'I can have one ready in two minutes.', judge: 'Denied! ...Make mine a double.' },
        ],
      },
      present: { prompt: 'Present evidence about the coffee:', correct: 'B', success: 'This receipt, Your Honour, proves I paid for every cup. That is not excessive. That is a loyalty programme.', judge: 'Exhibit B is admitted. The court is now also thinking about coffee.', fail: 'Counsel, that is not a coffee-related document.' },
    },
  ],
  objectionShout: 'OBJECTION!',
  closingCall: [
    { speaker: 'Judge', text: 'The witnesses have been heard. Defence, your closing argument and final exhibit.' },
    { speaker: FRIEND_NAME, text: 'Certainly, Your Honour. My final exhibit is—' },
    { speaker: FRIEND_NAME, text: '...wait.' },
    { speaker: FRIEND_NAME, text: 'It was right here. My final-semester record. It was in my folder this morning.' },
    { speaker: 'Prosecutor', text: 'Is the defence... unprepared?' },
    { speaker: 'Judge', text: 'The court will allow a brief moment. A very brief one.' },
  ],
  folderSlide: [{ speaker: FRIEND_NAME, text: '...Hello?' }],
  objectiveFolder: 'Pick up the folder by the courtroom doors',
  folderNote: 'Thought you might need this.',
  folderItem: { id: 'F', key: 'record', name: 'Final-Semester Record', desc: 'Exhibit F: Years of lectures, readings, moots and deadlines — survived. Proof that the defendant made it to her final semester.' },
  folderAfter: [{ speaker: FRIEND_NAME, text: 'Same handwriting as the note with the coffee...' }, { speaker: FRIEND_NAME, text: 'Okay. Focus. Win the case first.' }],
  objectiveReturn: 'Return to the defence table',
  closing: {
    prompt: 'Your closing argument, presenting Exhibit F:',
    options: [
      { text: 'I survived law school all the way to my final semester. Iconic is the minimum.', judge: 'The court finds that argument... devastatingly reasonable.' },
      { text: 'Every charge is true, Your Honour. And none of them are crimes.', judge: 'Hm. The court will need a moment. That was very good.' },
      { text: 'I rest my case. And my eyes. Mostly my eyes.', judge: 'Relatable. Deeply, painfully relatable.' },
    ],
  },
  hidden: {
    gavel: { title: 'The Gavel', text: 'Order! And please stop being dramatic.' },
    mirror: { title: 'Courtroom Mirror', text: 'Future lawyer detected. Confidence levels: impressive.' },
    flag: { title: 'Scales of Justice', text: 'Perfectly balanced. Unlike your sleep schedule.' },
  },
}

// ---------------------------------------------------------------------------
// CHAPTER FIVE — the verdict
// ---------------------------------------------------------------------------
export const VERDICT = {
  preamble: 'After reviewing all evidence and hearing the arguments, this court has reached its decision.',
  charges: 'On all charges of excessive photogenic behaviour, unnecessary drama and professional overthinking...',
  verdict: 'THE DEFENDANT IS FOUND NOT GUILTY!',
  sentence: [
    'However, the defendant is hereby sentenced to a lifetime of success, happiness and extraordinary achievements.',
    'Furthermore, the court recognises her outstanding achievement in surviving law school and reaching her final semester.',
  ],
  achievementBanner: 'FUTURE LEGAL LEGEND UNLOCKED',
  adjourn: 'Court is adjourned. You are free to go — the world is waiting.',
  objectiveExit: 'Exit the courthouse (south doors)',
}

// ---------------------------------------------------------------------------
// EPILOGUE — courtyard, gift and graduation
// ---------------------------------------------------------------------------
export const COURTYARD = {
  objectiveOutside: 'Someone seems to be waiting at the foot of the steps',
  giftPrompt: 'Open the gift',
  gift: {
    title: 'A Small Gift Box',
    reveal: 'A miniature graduation cap with a golden tassel.',
    engraving: 'Engraved on a tiny brass plate beneath it: "Future Legal Legend."',
  },
  walkTogether: 'Walk together',
  lines: ['ONE CHAPTER NEARLY COMPLETE.', 'ANOTHER BEAUTIFUL CHAPTER AWAITS.'],
  readLetter: 'Read the letter',
  explore: 'Explore the courtyard',
  helperIdle: 'He just smiles and nods toward the sunset.',
}

export const FINAL_LETTER = {
  greeting: `Dear ${FRIEND_NAME},`,
  paragraphs: [
    'Look how far you\'ve come.',
    'From all those lectures, endless readings, difficult cases, deadlines and stressful days, you\'ve made it to the final semester.',
    'That deserves to be celebrated.',
    'I hope you never underestimate how capable and talented you are.',
    'May the next chapter of your life bring you success, opportunities, happiness and everything you\'ve been working towards.',
    'Keep that confidence, keep smiling, and never stop being yourself.',
    'The world needs more people who are ambitious, kind and a little dramatic.',
  ],
  closing: 'Congratulations, future legal legend. ❤️',
  footer: 'CASE CLOSED. HER STORY CONTINUES.',
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
export const ACHIEVEMENTS = {
  mainCharacter: { title: 'Main Character Energy', desc: 'Walked into the High Court like it was a runway.' },
  overthinker: { title: 'Professional Overthinker', desc: 'Recovered a documented history of overthinking.' },
  coffee: { title: 'Coffee Is My Co-Counsel', desc: 'Accepted a warm coffee from someone thoughtful.' },
  objection: { title: 'Objection Queen', desc: 'Objected with confidence in open court.' },
  legend: { title: 'Future Legal Legend', desc: 'Found not guilty of being too iconic.' },
  caseClosed: { title: 'Case Closed', desc: 'Read the final letter. Her story continues.' },
  curious: { title: 'Curious Counsel', desc: 'Discovered four hidden details around the courthouse.' },
}
