export const TOKENS = {
  bgDeep: "#170D11",
  bgCard: "#2A1620",
  bgCardEdge: "#3A1E2B",
  cream: "#F3E7DA",
  muted: "#B99A8E",
  line: "rgba(243,231,218,0.14)",
  gold: "#D8A857",
  glow: "#F2B860",
};

export const SUN_MESSAGES = [
  { cat: "Today", text: "Skies are clear — hoping your morning opens up just as easily, Ganira))" },
  { cat: "Reminder", text: "The sun starts fresh every morning — so does my excuse to say good morning to you." },
  { cat: "Random Thought", text: "Heard somewhere that goofy girls make life better. Purely academic interest:)" },
  { cat: "Before You Start", text: "Work's about to start — hoping today goes smoothly and turns out to be a really good one for you, Ganira." },
];

export const DAYBREAK_MESSAGES = [
  { cat: "Morning", text: "Good morning! Hope your day gets off to a lovely start." },
  { cat: "Turn's Yours", text: "The sun's up — now it's your smile's turn )" },
  { cat: "Wishing You", text: "May every step you take today go well." },
  { cat: "Fresh Start", text: "New day, new chances — make good use of them." },
  { cat: "Morning", text: "Good morning — hope your day is full of energy." },
  { cat: "Like the Sun", text: "Like the sun, hope you light up everywhere you go today )" },
];

export const RECHARGE_MESSAGES = {
  day: [
    "However today's gone, it doesn't get the final say — tomorrow gets a clean start.",
    "Rough days don't erase the good ones. This is just one chapter.",
    "Whatever happened today, you handled it. That's worth something.",
  ],
  energy: [
    "Borrow some of mine — consider this a small transfer of energy your way.",
    "Low battery is temporary. Rest counts as progress too.",
    "Take five real minutes for yourself. Everything else can wait.",
  ],
  happiness: [
    "Sending you a reason to smile, even a small one.",
    "Whatever's weighing on you, you deserve lighter days ahead.",
    "You don't have to be happy right now — just know someone's thinking of you.",
  ],
};

export const RECHARGE_TIPS = {
  day: [
    "Write down one good thing from today, even a small one.",
    "Let tomorrow be a clean slate — no carryover required.",
  ],
  energy: [
    "Drink a full glass of water, right now.",
    "Step outside for two minutes, even just to the window.",
  ],
  happiness: [
    "Put on one song that makes you want to move.",
    "Text someone who makes you laugh.",
  ],
};

export const ORIGAMI_MESSAGES = [
  { cat: "Fair Warning", text: "This took four wobbly folds and zero origami classes. Manage your expectations." },
  { cat: "Small Print", text: "Paper animals are legally required to bring good luck. I don't make the rules." },
  { cat: "Confession", text: "I may have practiced folding this more times than I'd like to admit." },
  { cat: "Just Saying", text: "If a slightly lopsided piece of paper can't get one smile out of you, nothing will." },
];

export const ENERGIZER_PROMPTS = [
  { text: "Stand up and shake it out for the whole countdown.", duo: false },
  { text: "Do 5 jumping jacks.", duo: false },
  { text: "Stretch your arms up and take 3 slow, deep breaths.", duo: false },
  { text: "Name 3 things you're grateful for right now, out loud.", duo: false },
  { text: "Hum your favorite song until the timer runs out.", duo: false },
  { text: "Do a victory lap around the room.", duo: false },
  { text: "Smile at yourself for the full countdown — no cheating.", duo: false },
  { text: "Roll your shoulders and neck slowly until time's up.", duo: false },
  { text: "Text Javanshir one word for how you're feeling right now.", duo: true },
  { text: "Send him a voice message just saying hi, no reason needed.", duo: true },
  { text: "Call him for 10 seconds and hang up, just to say you thought of him.", duo: true },
  { text: "Send him whatever emoji matches your mood right now.", duo: true },
];

export const SCRATCH_MESSAGES = [
  { cat: "Jackpot", text: "You've won one (1) person who thinks you're great. Non-transferable, no refunds." },
  { cat: "Fine Print", text: "Odds of winning: 1 in 1. Turns out this game was rigged in your favor." },
  { cat: "Prize Claimed", text: "One free coffee, redeemable whenever you decide where and when." },
  { cat: "Grand Prize", text: "One 'I told you so', valid for the next argument you win. Use it wisely." },
  { cat: "Lucky Day", text: "Your prize: official permission to do absolutely nothing for ten minutes." },
  { cat: "Terms Apply", text: "You've won bragging rights. No cash value, but feel free to mention it often." },
];

export const IMPOSSIBLE_PAYOFFS = [
  "Button pressed. Your day is now 4% better. This is the maximum improvement permitted by law.",
  "Congratulations, you have defeated a button. Today officially counts as a win now.",
  "It surrendered. Nothing else today is going to, so take this one.",
  "Pressed successfully. No further effort is required from you for the rest of the day.",
];

export const CLOSE_DAY_MESSAGES = [
  { cat: "Disposed", text: "Gone. Not saved, not backed up, not recoverable — that was the entire point." },
  { cat: "Filed", text: "Whatever that was, it has been dealt with. No copies were kept." },
  { cat: "Closed", text: "Day officially closed. Complaints may be submitted tomorrow, in writing." },
  { cat: "Cleared", text: "Nobody read it. Nobody will. It's just not in your head anymore." },
];

export const THREE_THINGS_CLOSERS = [
  "Three things. That's more than most days will admit to.",
  "Logged. Today wasn't a total write-off after all.",
  "Filed under: evidence that it wasn't all bad.",
];

// PLACEHOLDERS — the whole point of this one is that the lines are things
// Javanshir actually noticed. Swap these for real ones.
export const LITTLE_MOMENTS = [
  "You explain things to people like you actually want them to understand, not like you want to be right.",
  "You laugh at your own jokes before you finish them. It's a whole thing.",
  "You remember what people told you weeks ago and bring it up like it's nothing.",
  "You get visibly annoyed on other people's behalf. It's an underrated quality.",
  "You ask the second question, not just the polite first one.",
  "You are incapable of walking past a dog without commenting on it.",
  "You say 'anyway' when you've decided a conversation is over. It's very effective.",
  "You give people your full attention, which almost nobody does anymore.",
  "You're funnier when you're tired and you have no idea.",
  "You take your work seriously without taking yourself seriously.",
  "You notice when someone's gone quiet in a room.",
  "You tell stories out of order and somehow they still land.",
  "You defend your opinions on small things with completely unnecessary conviction.",
  "You make the people around you slightly braver.",
  "You're warm to people who can do nothing for you.",
  "You reread messages before sending them. I can tell.",
  "You have a specific voice for when you're being polite to someone you find ridiculous.",
  "You're the person people text when something good happens.",
];

export const MOODS = [
  {
    key: "good",
    label: "Good, actually",
    responses: [
      { note: "Noted and logged. Days like this are legally required to be enjoyed.", song: "Something loud on the way home." },
      { note: "Good. Don't examine it too closely, just take it.", song: "Whatever was playing the last time you felt like this." },
    ],
  },
  {
    key: "tired",
    label: "Tired",
    responses: [
      { note: "Then that's the whole update. Nothing else is required of you today.", song: "Something slow, low volume." },
      { note: "Tired is information, not a character flaw. Sit down.", song: "The album you know well enough to stop listening to." },
    ],
  },
  {
    key: "stressed",
    label: "Stressed",
    responses: [
      { note: "Whatever it is, it's smaller than it currently feels. Not small. Smaller.", song: "Something with no lyrics for ten minutes." },
      { note: "You're allowed to do one thing at a time. That's the maximum anyway.", song: "Something you can walk fast to." },
    ],
  },
  {
    key: "annoyed",
    label: "Annoyed",
    responses: [
      { note: "Good. Stay annoyed for a bit, it's usually justified when you are.", song: "Something with a bit of aggression in it." },
      { note: "You're not overreacting. I've reviewed the case and I'm on your side.", song: "Something loud and slightly petty." },
    ],
  },
  {
    key: "flat",
    label: "Flat",
    responses: [
      { note: "Flat days are just days. They don't mean anything about you.", song: "Something familiar, nothing new." },
      { note: "No feelings available today. That's a valid setting.", song: "Whatever needs zero effort." },
    ],
  },
];

export const SURPRISES = [
  { kind: "Question", text: "What's a completely useless skill you're weirdly good at?" },
  { kind: "If you were here", text: "If you were here right now I'd be talking too much and you'd be pretending to mind." },
  { kind: "Joke", text: "I told a group they'd learn by doing. They did nothing. Technically still a lesson." },
  { kind: "Question", text: "What's the worst piece of advice you've ever been given with total confidence?" },
  { kind: "Small dare", text: "Send a voice message describing your day as if narrating a nature documentary." },
  { kind: "If you were here", text: "If you were here right now I'd suggest food, then immediately have no opinion on what kind." },
  { kind: "Question", text: "Which compliment do you never believe when people give it to you?" },
  { kind: "Joke", text: "They say a good trainer makes themselves unnecessary. Bold career strategy, honestly." },
  { kind: "Small dare", text: "Text me one word that sums up today. Only one. No explaining." },
  { kind: "If you were here", text: "If you were here right now I'd let you pick, then quietly steer it toward what I wanted." },
  { kind: "Question", text: "What's something you changed your mind about this year?" },
  { kind: "Small dare", text: "Take a photo of the least interesting thing near you and send it with no context." },
];
