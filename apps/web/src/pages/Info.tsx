import { useI18n } from '../i18n/I18nProvider';
import { href } from '../lib/router';
import { Card } from '../components/ui';

export function Info({ topic }: { topic: string | null }) {
  const { tx } = useI18n();
  const page = topic ?? 'about';

  const pages: Record<string, { title: string; body: string[] }> = {
    about: {
      title: tx('About EduBridge', 'EduBridge haqida'),
      body: [
        tx('EduBridge helps students from Uzbekistan compare universities and scholarships in Malaysia, Hungary, Germany, Türkiye and South Korea, using only verified, sourced data.', 'EduBridge O‘zbekistonlik talabalarga Malayziya, Vengriya, Germaniya, Turkiya va Janubiy Koreyadagi universitet va grantlarni faqat tekshirilgan, manbali ma’lumotlar asosida solishtirishga yordam beradi.'),
        tx('It is a guidance tool, not an admissions office. You apply directly with the university.', 'Bu yo‘riqnoma vositasi, qabul bo‘limi emas. Siz to‘g‘ridan-to‘g‘ri universitetga ariza topshirasiz.'),
      ],
    },
    sources: {
      title: tx('Sources and data rules', 'Manbalar va ma’lumot qoidalari'),
      body: [
        tx('Each fact links to the official page it came from (see “Sources”).', 'Har bir fakt olingan rasmiy sahifasiga havola qiladi.'),
        tx('Facts shown as official come from an official university, government or programme page, with its source and the date it was checked. Anything not found stays empty and is shown as “not confirmed”. Aggregator websites are not used as sources.', 'Rasmiy deb ko‘rsatilgan faktlar rasmiy universitet, hukumat yoki dastur sahifasidan olinadi, manbasi va tekshirilgan sanasi bilan. Topilmagan narsa bo‘sh qoladi va “tasdiqlanmagan” deb ko‘rsatiladi. Agregator saytlar manba sifatida ishlatilmaydi.'),
        tx('A missing value is never shown as zero or “free”. An IELTS value is compared with your score only when it applies to the whole university.', 'Yo‘q qiymat hech qachon nol yoki “bepul” deb ko‘rsatilmaydi. IELTS qiymati faqat butun universitetga tegishli bo‘lsa, sizning ballingiz bilan solishtiriladi.'),
        tx('QS 2027 positions name the page they were taken from, because the QS site blocks automated reading.', 'QS 2027 o‘rinlari olingan sahifa nomi bilan beriladi, chunki QS sayti avtomatik o‘qishni to‘sadi.'),
      ],
    },
    disclaimer: {
      title: tx('Disclaimer', 'Ogohlantirish'),
      body: [
        tx('A prototype guidance tool for students from Uzbekistan. Always confirm requirements on official websites.', 'O‘zbekistonlik talabalar uchun prototip yo‘riqnoma vositasi. Talablarni doim rasmiy saytlarda tasdiqlang.'),
        tx('EduBridge never shows an admission or scholarship probability. Meeting a minimum is not a guarantee. Groups are EduBridge guidance, not an official classification.', 'EduBridge qabul yoki grant ehtimolini hech qachon ko‘rsatmaydi. Minimumga yetish kafolat emas. Guruhlar EduBridge maslahati, rasmiy tasnif emas.'),
      ],
    },
    privacy: {
      title: tx('Privacy', 'Maxfiylik'),
      body: [
        tx('As a guest, everything you enter stays in this browser. EduBridge receives nothing except requests for the public catalogue.', 'Mehmon sifatida kiritgan hamma narsangiz shu brauzerda qoladi. EduBridge ochiq katalog so‘rovlaridan boshqa hech narsa olmaydi.'),
        tx('If you sign in with Telegram or Google, we store only your sign-in identifier (we do not keep your Google email), your language, and what you choose to save: your profile, saved universities, plan, dates, text of documents you save (never the uploaded file), chats, interviews and settings. We also keep your sessions with the browser name and a scrambled form of the IP address, so you can see and end your devices.', 'Telegram yoki Google orqali kirsangiz, biz faqat kirish identifikatoringizni (Google emailingiz saqlanmaydi), tilingizni va o‘zingiz saqlashni tanlaganlarni saqlaymiz: profil, saqlangan universitetlar, reja, sanalar, saqlagan hujjatlaringiz matni (yuklangan fayl hech qachon), suhbatlar, intervyular va sozlamalar. Qurilmalaringizni ko‘rish va tugatish uchun sessiyalaringizni brauzer nomi va IP manzilning shifrlangan ko‘rinishi bilan ham saqlaymiz.'),
        tx('When you press an AI button, the text you submit and a reduced version of your profile (without your name, birth year or school) are sent to the AI service to produce the answer. We keep only the size, time and estimated cost of the request, not the text. Scanned pages are sent for reading and are not stored.', 'SI tugmasini bosganingizda, yuborgan matningiz va profilingizning qisqartirilgan ko‘rinishi (ismingiz, tug‘ilgan yilingiz va maktabingizsiz) javob tayyorlash uchun SI xizmatiga yuboriladi. Biz so‘rovning hajmi, vaqti va taxminiy narxini saqlaymiz, matnni emas. Skanerlangan sahifalar o‘qish uchun yuboriladi va saqlanmaydi.'),
        tx('If you connect Telegram reminders, we store the chat link needed to message you. Send /stop to the bot, or disconnect in Settings, at any time.', 'Telegram eslatmalarini ulasangiz, sizga xabar yuborish uchun zarur chat havolasini saqlaymiz. Istalgan vaqtda botga /stop yuboring yoki Sozlamalarda uzing.'),
        tx('You can download all your data and delete your account in Settings. Deleting removes your data from the database at once; copies in backups disappear when the backups expire, within 14 days.', 'Barcha ma’lumotlaringizni Sozlamalarda yuklab olishingiz va akkauntingizni o‘chirishingiz mumkin. O‘chirish ma’lumotlaringizni bazadan darhol olib tashlaydi; zaxira nusxalardagi nusxalar zaxiralar muddati tugagach, 14 kun ichida yo‘qoladi.'),
        tx('EduBridge uses two cookies, both needed for signing in and protection against forgery. There is no advertising and no tracking, and your data is not sold.', 'EduBridge ikkita cookie ishlatadi, ikkalasi ham kirish va soxtalashtirishdan himoya uchun zarur. Reklama va kuzatuv yo‘q, ma’lumotlaringiz sotilmaydi.'),
      ],
    },
  };
  const p = pages[page] ?? pages.about!;

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">{p.title}</h1>
      <Card className="space-y-3">{p.body.map((b, i) => <p key={i}>{b}</p>)}</Card>
      <p className="flex gap-4 text-sm">
        {(['about', 'sources', 'disclaimer', 'privacy'] as const).map((k) => <a key={k} href={href('info', k)} aria-current={k === page ? 'page' : undefined}>{pages[k]!.title}</a>)}
      </p>
    </article>
  );
}
