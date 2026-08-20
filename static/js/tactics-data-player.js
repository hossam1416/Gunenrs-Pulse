/* ================================================================
   GUNNERS PULSE — TACTICS SUPPORT DATA
   ملاحظة مهمة:
   لا نعرّف ROLES_DATA أو FORMATIONS أو PLAYERS هنا
   لأنهم قادمين من Django داخل tactics.html
================================================================ */

/* ────────────────────────────────────────────────────────────────
   FOCUS COLOR MAP
──────────────────────────────────────────────────────────────── */
var FOCUS_COLORS = {
  Attack: { bg: "#ec002415", border: "#ec0024", text: "#ec0024" },
  Defend: { bg: "#1e40af15", border: "#3b82f6", text: "#3b82f6" },
  Balanced: { bg: "#16a34a15", border: "#22c55e", text: "#16a34a" },
  "Build-Up": { bg: "#d9770615", border: "#f97316", text: "#d97706" },
  Roaming: { bg: "#7c3aed15", border: "#8b5cf6", text: "#7c3aed" },
  Versatile: { bg: "#0891b215", border: "#06b6d4", text: "#0891b2" },
  "Ball-Winning": { bg: "#be185d15", border: "#ec4899", text: "#be185d" },
  Support: { bg: "#65a30d15", border: "#84cc16", text: "#65a30d" },
  Aggressive: { bg: "#b4530915", border: "#f59e0b", text: "#b45309" },
  Wide: { bg: "#0f766e15", border: "#14b8a6", text: "#0f766e" },
};