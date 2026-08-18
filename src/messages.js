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

// "Read me when..." jar. Colours follow the label on the physical jars.
// Translations are common English renderings — swap for whichever you prefer.
export const VERSE_JAR = [
  {
    key: "happy",
    label: "Happy",
    color: "#E8B93E",
    verses: [
      { text: "Say, \u201cIn the bounty of Allah and in His mercy \u2014 in that let them rejoice.\u201d", ref: "Yunus 10:58" },
      { text: "So which of the favours of your Lord would you deny?", ref: "Ar-Rahman 55:13" },
      { text: "And your Lord is going to give you, and you will be satisfied.", ref: "Ad-Duha 93:5" },
      { text: "And whatever you have of favour \u2014 it is from Allah.", ref: "An-Nahl 16:53" },
      { text: "So remember Me; I will remember you, and be grateful to Me.", ref: "Al-Baqarah 2:152" },
      { text: "Praise be to Allah, who has fulfilled for us His promise.", ref: "Az-Zumar 39:74" },
      { text: "Praise to Allah, who has guided us to this.", ref: "Al-A'raf 7:43" },
      { text: "Indeed, We will not allow to be lost the reward of any who did well in deeds.", ref: "Al-Kahf 18:30" },
      { text: "Indeed, this is for you a reward, and your effort has been appreciated.", ref: "Al-Insan 76:22" },
      { text: "We have certainly created man in the best of stature.", ref: "At-Tin 95:4" },
      { text: "But as for the favour of your Lord, report it.", ref: "Ad-Duha 93:11" },
      { text: "Whoever does righteousness, while being a believer — We will surely cause him to live a good life.", ref: "An-Nahl 16:97" },
      { text: "For them are good tidings in the worldly life and in the Hereafter.", ref: "Yunus 10:64" },
      { text: "Indeed, We have made that which is on the earth adornment for it.", ref: "Al-Kahf 18:7" },
      { text: "My Lord, increase me in knowledge.", ref: "Ta-Ha 20:114" },
      { text: "So walk among its slopes and eat of His provision.", ref: "Al-Mulk 67:15" },
      { text: "My mercy encompasses all things.", ref: "Al-A'raf 7:156" },
    ],
  },
  {
    key: "anxious",
    label: "Anxious",
    color: "#4E9B5B",
    verses: [
      { text: "For indeed, with hardship comes ease. Indeed, with hardship comes ease.", ref: "Ash-Sharh 94:5-6" },
      { text: "Verily, in the remembrance of Allah do hearts find rest.", ref: "Ar-Ra'd 13:28" },
      { text: "And whoever relies upon Allah \u2014 then He is sufficient for him.", ref: "At-Talaq 65:3" },
      { text: "Allah does not burden a soul beyond that it can bear.", ref: "Al-Baqarah 2:286" },
      { text: "Say, \u201cNever will we be struck except by what Allah has decreed for us.\u201d", ref: "At-Tawbah 9:51" },
      { text: "Allah will bring about, after hardship, ease.", ref: "At-Talaq 65:7" },
      { text: "Sufficient for us is Allah, and He is the best disposer of affairs.", ref: "Ali 'Imran 3:173" },
      { text: "Indeed, Allah is with the patient.", ref: "Al-Baqarah 2:153" },
      { text: "Unquestionably, for the allies of Allah there will be no fear concerning them, nor will they grieve.", ref: "Yunus 10:62" },
      { text: "Sufficient for me is Allah; there is no deity except Him. On Him I have relied.", ref: "At-Tawbah 9:129" },
      { text: "Did We not expand for you your breast?", ref: "Ash-Sharh 94:1" },
      { text: "But perhaps you hate a thing and it is good for you.", ref: "Al-Baqarah 2:216" },
      { text: "Is not Allah sufficient for His servant?", ref: "Az-Zumar 39:36" },
      { text: "Indeed, Allah will not change the condition of a people until they change what is in themselves.", ref: "Ar-Ra'd 13:11" },
      { text: "If Allah should aid you, no one can overcome you.", ref: "Ali 'Imran 3:160" },
      { text: "And seek help through patience and prayer.", ref: "Al-Baqarah 2:45" },
      { text: "My Lord, cause me to enter a sound entrance and to exit a sound exit.", ref: "Al-Isra 17:80" },
    ],
  },
  {
    key: "thankful",
    label: "Thankful",
    color: "#E07B39",
    verses: [
      { text: "If you are grateful, I will surely increase you in favour.", ref: "Ibrahim 14:7" },
      { text: "And if you should count the favours of Allah, you could not enumerate them.", ref: "An-Nahl 16:18" },
      { text: "And He gave you from all you asked of Him.", ref: "Ibrahim 14:34" },
      { text: "Eat from the good things which We have provided for you and be grateful to Allah.", ref: "Al-Baqarah 2:172" },
      { text: "This is from the favour of my Lord to test me whether I will be grateful or ungrateful.", ref: "An-Naml 27:40" },
      { text: "And whoever is grateful is grateful for the benefit of himself.", ref: "Luqman 31:12" },
      { text: "Indeed, Allah is full of bounty to the people.", ref: "Al-Baqarah 2:243" },
      { text: "Is the reward for good anything but good?", ref: "Ar-Rahman 55:60" },
      { text: "And be grateful for the favour of Allah.", ref: "An-Nahl 16:114" },
      { text: "Rather, worship Allah and be among the grateful.", ref: "Az-Zumar 39:66" },
      { text: "All praise is due to Allah, Lord of the worlds.", ref: "Al-Fatiha 1:2" },
      { text: "What would Allah do with your punishment if you are grateful and believe?", ref: "An-Nisa 4:147" },
      { text: "As favour from Us. Thus do We reward he who is grateful.", ref: "Al-Qamar 54:35" },
      { text: "And He has subjected to you whatever is in the heavens and whatever is on the earth.", ref: "Al-Jathiyah 45:13" },
      { text: "And that you may seek of His bounty; and perhaps you will be grateful.", ref: "Ar-Rum 30:46" },
      { text: "And We have certainly established you upon the earth and made for you therein ways of livelihood.", ref: "Al-A'raf 7:10" },
      { text: "Then remember the favour of your Lord when you have settled upon them.", ref: "Az-Zukhruf 43:13" },
    ],
  },
  {
    key: "lonely",
    label: "Lonely",
    color: "#7FB3D5",
    verses: [
      { text: "And We are closer to him than his jugular vein.", ref: "Qaf 50:16" },
      { text: "And when My servants ask you concerning Me \u2014 indeed I am near.", ref: "Al-Baqarah 2:186" },
      { text: "Your Lord has not forsaken you, nor has He become displeased.", ref: "Ad-Duha 93:3" },
      { text: "And He is with you wherever you are.", ref: "Al-Hadid 57:4" },
      { text: "Fear not. Indeed, I am with you both; I hear and I see.", ref: "Ta-Ha 20:46" },
      { text: "Allah is the ally of those who believe.", ref: "Al-Baqarah 2:257" },
      { text: "And those who strive for Us — We will surely guide them to Our ways.", ref: "Al-Ankabut 29:69" },
      { text: "Allah is Subtle with His servants.", ref: "Ash-Shura 42:19" },
      { text: "Call upon Me; I will respond to you.", ref: "Ghafir 40:60" },
      { text: "And with Him are the keys of the unseen.", ref: "Al-An'am 6:59" },
      { text: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence.", ref: "Al-Baqarah 2:255" },
      { text: "And they were certain that there is no refuge from Allah except in Him.", ref: "At-Tawbah 9:118" },
      { text: "And never have I been unblessed in my supplication to You, my Lord.", ref: "Maryam 19:4" },
      { text: "There is no deity except You; exalted are You.", ref: "Al-Anbiya 21:87" },
      { text: "And to your Lord direct your longing.", ref: "Ash-Sharh 94:8" },
      { text: "He is Allah, other than whom there is no deity, Knower of the unseen and the witnessed.", ref: "Al-Hashr 59:22" },
      { text: "So wherever you turn, there is the Face of Allah.", ref: "Al-Baqarah 2:115" },
    ],
  },
  {
    key: "angry",
    label: "Angry",
    color: "#C0392B",
    verses: [
      { text: "\u2026those who restrain anger and who pardon the people \u2014 and Allah loves the doers of good.", ref: "Ali 'Imran 3:134" },
      { text: "Repel evil with that which is better.", ref: "Fussilat 41:34" },
      { text: "And whoever is patient and forgives \u2014 indeed, that is of the matters requiring determination.", ref: "Ash-Shura 42:43" },
      { text: "Take what is given freely, enjoin what is good, and turn away from the ignorant.", ref: "Al-A'raf 7:199" },
      { text: "And when the ignorant address them, they say words of peace.", ref: "Al-Furqan 25:63" },
      { text: "But if you are patient \u2014 it is better for those who are patient.", ref: "An-Nahl 16:126" },
      { text: "Kind speech and forgiveness are better than charity followed by injury.", ref: "Al-Baqarah 2:263" },
      { text: "But whoever pardons and makes reconciliation — his reward is due from Allah.", ref: "Ash-Shura 42:40" },
      { text: "And do not spy or backbite each other.", ref: "Al-Hujurat 49:12" },
      { text: "And by the mercy of Allah, you were lenient with them.", ref: "Ali 'Imran 3:159" },
      { text: "And tell My servants to say that which is best.", ref: "Al-Isra 17:53" },
      { text: "Repel, by that which is better, evil.", ref: "Al-Mu'minun 23:96" },
      { text: "And speak to him with gentle speech.", ref: "Ta-Ha 20:44" },
      { text: "And be moderate in your pace and lower your voice.", ref: "Luqman 31:19" },
      { text: "Let not a people ridicule another people.", ref: "Al-Hujurat 49:11" },
      { text: "And let them pardon and overlook. Would you not like that Allah should forgive you?", ref: "An-Nur 24:22" },
    ],
  },
  {
    key: "sad",
    label: "Sad",
    color: "#2E6DA4",
    verses: [
      { text: "Do not grieve; indeed Allah is with us.", ref: "At-Tawbah 9:40" },
      { text: "Do not despair of the mercy of Allah.", ref: "Az-Zumar 39:53" },
      { text: "Do not lose heart nor fall into despair.", ref: "Ali 'Imran 3:139" },
      { text: "And the Hereafter is better for you than the first life.", ref: "Ad-Duha 93:4" },
      { text: "And give good tidings to the patient.", ref: "Al-Baqarah 2:155" },
      { text: "And despair not of relief from Allah.", ref: "Yusuf 12:87" },
      { text: "Indeed we belong to Allah, and indeed to Him we will return.", ref: "Al-Baqarah 2:156" },
      { text: "And be patient. Indeed, Allah is with the patient.", ref: "Al-Anfal 8:46" },
      { text: "Indeed, Allah does not allow to be lost the reward of those who do good.", ref: "Hud 11:115" },
      { text: "And He found you lost and guided you.", ref: "Ad-Duha 93:7" },
      { text: "And He found you poor and made you self-sufficient.", ref: "Ad-Duha 93:8" },
      { text: "Unquestionably, the help of Allah is near.", ref: "Al-Baqarah 2:214" },
      { text: "I only complain of my suffering and my grief to Allah.", ref: "Yusuf 12:86" },
      { text: "Peace be upon you for what you patiently endured.", ref: "Ar-Ra'd 13:24" },
      { text: "Do not fear and do not grieve.", ref: "Fussilat 41:30" },
      { text: "Those are the ones upon whom are blessings from their Lord and mercy.", ref: "Al-Baqarah 2:157" },
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
