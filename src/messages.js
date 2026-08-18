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

export const MESSAGES = [
  { cat: "This Morning", text: "The coffee's barely ready and I'm already thinking about you, Ganira." },
  { cat: "Little Truth", text: "I don't know what it is about mornings, but they feel better when I know I'll talk to you." },
  { cat: "Quiet Thought", text: "Something about the first sip of coffee always makes me want to say good morning to you first." },
  { cat: "Honest Confession", text: "Ganira, I might have picked up my phone to text you before I even finished waking up." },
  { cat: "Small Reminder", text: "Just a reminder that your smile is doing just fine without any coffee at all." },
  { cat: "Today", text: "Hoping today treats you as well as you deserve, Ganira." },
  { cat: "A Little Theory", text: "I have a theory that the best mornings start with someone worth texting first. You're proof." },
  { cat: "Random Thought", text: "Turns out goofy girls are underrated. Someone should really write a paper on this." },
  { cat: "Before You Start", text: "Work's about to start — hoping today goes smoothly and turns out to be a really good one for you, Ganira." },
];

export const SUN_MESSAGES = [
  { cat: "Today", text: "Skies are clear — hoping your morning opens up just as easily, Ganira))" },
  { cat: "Reminder", text: "The sun starts fresh every morning — so does my excuse to say good morning to you." },
  { cat: "Random Thought", text: "Heard somewhere that goofy girls make life better. Purely academic interest:)" },
  { cat: "Before You Start", text: "Work's about to start — hoping today goes smoothly and turns out to be a really good one for you, Ganira." },
];

export function pickMessage(current, list = MESSAGES) {
  if (!current) return list[Math.floor(Math.random() * list.length)];
  const rest = list.filter((m) => m !== current);
  return rest[Math.floor(Math.random() * rest.length)];
}
