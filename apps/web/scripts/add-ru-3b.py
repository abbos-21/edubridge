import json, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'src/i18n/ru.extra.json'
d = json.loads(p.read_text(encoding='utf8'))
d.update({
 "Saved examples of AI results": "Сохранённые примеры результатов ИИ",
 "These are real results saved on the date shown. They are not produced live.": "Это реальные результаты, сохранённые в указанную дату. Сейчас они не создаются заново.",
 "saved on {0}": "сохранено: {0}",
 "This example could not be found.": "Этот пример не найден.",
 "Sample result: written by the built-in test generator, not by the AI. Saved on {0}.": "Пример результата: его написал встроенный тестовый генератор, а не ИИ. Сохранено: {0}.",
 "Saved result: this is not a live answer. Saved on {0}.": "Сохранённый результат: это не ответ в реальном времени. Сохранено: {0}.",
 "Document analysis": "Анализ документа",
 "Interview feedback": "Отзыв по интервью",
 "Profile coach plan": "План профильного коуча",
 "Example": "Пример",
})
p.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf8')
print(len(d))
