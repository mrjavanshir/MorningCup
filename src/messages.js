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
  { cat: "Rəsmi bildiriş", text: "Rəsmi bildiriş: bu gün yaxşı keçmək məcburiyyətindədir." },
  { cat: "Elmi fakt", text: "Elmi fakt: səhər qəhvəsi olmadan verilən qərarlar rəsmən etibarsız sayılır." },
  { cat: "Xəbərdarlıq", text: "Xəbərdarlıq: bu gün gülməli bir şeylə qarşılaşma ehtimalı yüksəkdir." },
  { cat: "Proqnoz", text: "Bugünkü proqnoz: 80% yaxşı əhval, 20% qəhvə ehtiyacı." },
  { cat: "Elmi fakt", text: "Araşdırma göstərir: səhər gülümsəyənlərin günü daha tez keçir (mənbə: bu fincan)." },
  { cat: "Rəsmi bildiriş", text: "Bildiriş: bu gün üçün stress kvotası doldurulub, artıq qəbul edilmir." },
  { cat: "Proqnoz", text: "Bugünkü hava: aydın, əhval-ruhiyyə: sabit yüksək )" },
  { cat: "Xəbərdarlıq", text: "Diqqət: bu fincanı boşaltmadan günə başlamaq tövsiyə olunmur." },
];

export const SUN_MESSAGES = [
  { cat: "Proqnoz", text: "Bugünkü proqnoz: günəşli, əhval-ruhiyyə sabit yüksək." },
  { cat: "Kiçik müşahidə", text: "Müşahidə: günəş bu gün də vaxtında doğdu, buna adət etmişik." },
  { cat: "Xəbərdarlıq", text: "Diqqət: bu gün gülməli bir anla qarşılaşma ehtimalı yüksəkdir." },
  { cat: "Statistika", text: "Statistika: günəşli günlərin 90%-i yaxşı xatirələrlə bitir." },
  { cat: "Xatırlatma", text: "Xatırlatma: hər gün yeni başlanğıcdır, bu gün də istisna deyil." },
  { cat: "Rəsmi elan", text: "Elan: bugünkü gündəm sadədir — sadəcə yaxşı keçsin." },
  { cat: "Kəşf", text: "Kəşf: erkən duranlar bəzən ən gözəl gündoğuşunu görür." },
  { cat: "Sadə fakt", text: "Fakt: bu gün dünən olmadığı üçün yeni imkandır." },
];

export function pickMessage(current, list = MESSAGES) {
  if (!current) return list[Math.floor(Math.random() * list.length)];
  const rest = list.filter((m) => m !== current);
  return rest[Math.floor(Math.random() * rest.length)];
}
