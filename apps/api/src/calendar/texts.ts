import type { CalItem } from './items';

export type Lang = 'uz' | 'ru' | 'en';
export const isLang = (x: unknown): x is Lang => x === 'uz' || x === 'ru' || x === 'en';

const LEVEL: Record<Lang, Record<'bachelor' | 'master', string>> = {
  uz: { bachelor: 'Bakalavr', master: 'Magistratura' },
  ru: { bachelor: 'Бакалавриат', master: 'Магистратура' },
  en: { bachelor: 'Bachelor', master: 'Master' },
};

/** Calendar entry title. University names stay as published. */
export function itemTitle(i: CalItem, lang: Lang): string {
  if (i.kind !== 'deadline') return i.name;
  const lvl = i.level ? LEVEL[lang][i.level] : '';
  const head = { uz: 'Muddat', ru: 'Срок', en: 'Deadline' }[lang];
  return `${head}: ${i.name}${lvl ? ` (${lvl})` : ''}`;
}

export function itemDescription(i: CalItem, lang: Lang): string {
  const parts: string[] = [];
  if (i.kind === 'deadline') {
    parts.push({ uz: 'Rasmiy saytdagi tasdiqlangan muddat. Topshirishdan oldin rasmiy sahifani yana tekshiring.', ru: 'Срок подтверждён на официальном сайте. Перед подачей проверьте официальную страницу ещё раз.', en: 'Deadline confirmed on the official site. Check the official page again before you apply.' }[lang]);
    if (i.intake) parts.push(`${{ uz: 'Qabul', ru: 'Набор', en: 'Intake' }[lang]}: ${i.intake}`);
    if (i.sourceUrl) parts.push(`${{ uz: 'Manba', ru: 'Источник', en: 'Source' }[lang]}: ${i.sourceUrl}`);
  } else {
    parts.push({ uz: 'EduBridge rejangizdan', ru: 'Из вашего плана в EduBridge', en: 'From your EduBridge plan' }[lang]);
  }
  return parts.join('\n');
}

/** Telegram reminder. daysLeft 1 = tomorrow. */
export function reminderText(i: CalItem, daysLeft: number, lang: Lang): string {
  const when =
    daysLeft === 1
      ? { uz: 'ertaga', ru: 'завтра', en: 'tomorrow' }[lang]
      : { uz: `${daysLeft} kundan keyin`, ru: `через ${daysLeft} дн.`, en: `in ${daysLeft} days` }[lang];
  const head = { uz: 'Eslatma', ru: 'Напоминание', en: 'Reminder' }[lang];
  return `${head}: ${itemTitle(i, lang)} — ${i.date} (${when})\n${itemDescription(i, lang)}\n\n${{ uz: 'To‘xtatish: /stop', ru: 'Остановить: /stop', en: 'Stop: /stop' }[lang]}`;
}

export const BOT = {
  linked: { uz: 'Ulandi. Endi muddatlar haqida eslatmalar shu yerga keladi. To‘xtatish: /stop. Holat: /status.', ru: 'Подключено. Напоминания о сроках будут приходить сюда. Остановить: /stop. Состояние: /status.', en: 'Connected. Deadline reminders will arrive here. Stop: /stop. Status: /status.' },
  badCode: { uz: 'Kod noto‘g‘ri yoki muddati o‘tgan. EduBridge’da Sozlamalar sahifasidan yangi kod oling.', ru: 'Код неверный или просрочен. Получите новый код в настройках EduBridge.', en: 'That code is wrong or has expired. Get a new one in EduBridge Settings.' },
  needCode: { uz: 'Eslatmalarni ulash uchun EduBridge’da Sozlamalar → Telegram eslatmalari bo‘limidan kod oling va shu yerga /start KOD deb yuboring. Men hech qachon parol, hujjat yoki to‘lov ma’lumotlarini so‘ramayman.', ru: 'Чтобы подключить напоминания, получите код в EduBridge: Настройки → Напоминания в Telegram, и отправьте сюда /start КОД. Я никогда не прошу пароли, документы или платёжные данные.', en: 'To connect reminders, get a code in EduBridge: Settings → Telegram reminders, then send /start CODE here. I never ask for passwords, documents or payment details.' },
  resumed: { uz: 'Eslatmalar yana yoqildi. To‘xtatish: /stop.', ru: 'Напоминания снова включены. Остановить: /stop.', en: 'Reminders are on again. Stop: /stop.' },
  stopped: { uz: 'Eslatmalar to‘xtatildi. Yana yoqish uchun /start yuboring.', ru: 'Напоминания остановлены. Чтобы включить снова, отправьте /start.', en: 'Reminders stopped. Send /start to turn them on again.' },
  notLinked: { uz: 'Bu chat hali EduBridge akkauntiga ulanmagan.', ru: 'Этот чат ещё не подключён к аккаунту EduBridge.', en: 'This chat is not connected to an EduBridge account yet.' },
  off: { uz: 'Eslatmalar o‘chirilgan (/start bilan yoqing).', ru: 'Напоминания выключены (включите командой /start).', en: 'Reminders are off (turn them on with /start).' },
  none: { uz: 'Rejalashtirilgan eslatmalar yo‘q. Universitetni saqlang yoki rejaga sana qo‘shing.', ru: 'Запланированных напоминаний нет. Сохраните университет или добавьте дату в план.', en: 'No reminders are scheduled. Save a university or add a date to your plan.' },
  scheduled: { uz: 'Rejalashtirilgan eslatmalar:', ru: 'Запланированные напоминания:', en: 'Scheduled reminders:' },
  langSet: { uz: 'Til: o‘zbekcha.', ru: 'Язык: русский.', en: 'Language: English.' },
  langUsage: { uz: 'Foydalanish: /language uz | ru | en', ru: 'Использование: /language uz | ru | en', en: 'Usage: /language uz | ru | en' },
  help: { uz: 'Buyruqlar: /status, /language, /stop. Men hech qachon parol, hujjat yoki to‘lov ma’lumotlarini so‘ramayman.', ru: 'Команды: /status, /language, /stop. Я никогда не прошу пароли, документы или платёжные данные.', en: 'Commands: /status, /language, /stop. I never ask for passwords, documents or payment details.' },
} as const;
