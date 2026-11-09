import json, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'src/i18n/ru.extra.json'
d = json.loads(p.read_text(encoding='utf8'))
d.update({
 "QS not confirmed": "QS не подтверждён",
 "Details and requirements →": "Подробности и требования →",
 "Filter the universities by group, subject and level, and compare up to three side by side.": "Фильтруйте университеты по группе, направлению и уровню и сравнивайте до трёх рядом.",
 "Profile check and activity plan": "Проверка профиля и план активностей",
 "See where your profile is below typical levels for each group, and plan activities month by month.": "Посмотрите, где ваш профиль ниже типичных уровней каждой группы, и спланируйте активности по месяцам.",
 "Telegram reminders and a calendar file for confirmed deadlines and your own dates.": "Напоминания в Telegram и файл календаря для подтверждённых сроков и ваших собственных дат.",
 "EduBridge guides: an Uzbek boy in a doppi and an Uzbek girl in a hijab and doppi": "Проводники EduBridge: узбекский мальчик в тюбетейке и узбекская девочка в хиджабе и тюбетейке",
 "Your profile and dates": "Ваш профиль и даты",
 "Built from your own profile, not generic tips": "Построено на вашем профиле, а не на общих советах",
 "Deadlines and reminders come from the universities you save and the dates you add. The profile check compares what you entered with published levels. Unverified dates are always marked.": "Сроки и напоминания берутся из сохранённых вами университетов и добавленных вами дат. Проверка профиля сравнивает введённое вами с опубликованными уровнями. Непроверенные даты всегда отмечены.",
 "Example with demo data": "Пример с демо-данными",
 "Plan activities": "Активности плана",
 "Your data stays in your browser unless you sign in": "Ваши данные остаются в браузере, пока вы не войдёте в аккаунт",
 "Search by full name or abbreviation (e.g. METU, KAIST, TUM), filter by group and compare up to three.": "Ищите по полному названию или аббревиатуре (например, METU, KAIST, TUM), фильтруйте по группе и сравнивайте до трёх.",
 "{0} countries · {1} universities: {2} →": "Стран: {0} · университетов: {1}: {2} →",
 "Catalogue · {0} universities": "Каталог · университетов: {0}",
 "Get Started": "Начать",
})
p.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf8')
