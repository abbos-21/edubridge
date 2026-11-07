import type { L } from './lang';
import type { Tier } from './catalogue';

/** EduBridge guidance on the three groups. Not an official classification. */
export const TIER_INFO: Record<Tier, { name: L; who: L }> = {
  "selective": {
    "name": {
      "en": "Highly selective",
      "uz": "Kuchli tanlov"
    },
    "who": {
      "en": "For strong profiles: top grades and test scores, solid activities. Many strong applicants compete for few places.",
      "uz": "Kuchli profil uchun: yuqori baholar va test ballari, mazmunli faoliyat. Kam o‘ringa ko‘p kuchli abituriyent raqobat qiladi."
    }
  },
  "middle": {
    "name": {
      "en": "Balanced",
      "uz": "O‘rta"
    },
    "who": {
      "en": "Good, ranked universities with moderate published requirements — a realistic target for a solid profile.",
      "uz": "O‘rtacha talablarga ega yaxshi reytingli universitetlar — mustahkam profil uchun real maqsad."
    }
  },
  "accessible": {
    "name": {
      "en": "More accessible",
      "uz": "Qulayroq"
    },
    "who": {
      "en": "Lower published requirements and/or lower costs. Good for studying abroad on a budget — but meeting a minimum is still not a guarantee.",
      "uz": "E’lon qilingan talablar va/yoki narx pastroq. Kam budjet bilan chet elda o‘qish uchun yaxshi — lekin minimumga yetish baribir kafolat emas."
    }
  }
};
