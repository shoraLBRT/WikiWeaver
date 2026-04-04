Перед нами стоит задача сделать возможность редактировать имеющиеся статьи. У нас в приложении уже реализована фича по

созданию новой статьи. Она сделана отлично, она работает. Поэтому редактирование имеющейся статьи должно использовать

весь тот же интерфейс, который у нас используется при создании новых статей. Изучи имеющиеся компоненты. Ознакомься с

особенностями нашего приложения и предложи концепцию, задачи и пошаговый алгоритм для реализации фичи "Редактирование

статей"

в БД всё хранится отдельными параграфами, не готовым текстом. Каждый Paragraph — это отдельная строка в

  таблице с полями

В БД заголовки и параграфы хранятся одинаково — всё это строки таблицы Paragraph. Разница только в Content:

  - Заголовок h2 сохраняется как "## Текст заголовка" (строка 176)

  - Заголовок h3 — как "### Текст заголовка" (строка 179)

  - Обычный параграф — просто текст

  Это видно в toStoredMarkdown() (строки 168-188) — при сохранении heading2-блок оборачивается в ## ..., а при импорте

  из markdown (importBlocksFromMarkdown, строки 243-272) — обратно: если строка начинается с ##  — создаётся блок

  heading2.

  Так что да, мы можем получить все параграфы и просто их показать. GET /articles/{id}/content уже отдаёт полный массив

  ParagraphDto[]. Для обратной конвертации нужна та же логика, что в importBlocksFromMarkdown, только:

  1. Группируем параграфы по Order

  2. Группа из 1 параграфа → смотрим на Content:

    - начинается с ##  → PlainEditorBlock kind heading2

    - начинается с ###  → PlainEditorBlock kind heading3

    - иначе → PlainEditorBlock kind paragraph

  3. Группа из нескольких (альтернативы) → VersionedEditorBlock

  При этом нужно сохранить id из DTO (а не генерировать новый UUID), чтобы при сохранении бэкенд знал, какие параграфы

  обновить, а какие (id=0) создать.


Концепция: Редактирование статей
Суть: Переиспользуем 95% логики AddArticlePage — тот же редактор блоков, те же хелперы, тот же UI. Разница только в:

При открытии — загружаем существующую статью и конвертируем ParagraphDto[] в EditorBlock[]
При сохранении — вызываем PUT вместо POST, и в ParagraphDto сохраняем реальные id (не 0)
Что уже готово
Бэкенд: ArticleContentService.UpdateContentAsync() полностью реализован (строки 122-169) — умеет удалять убранные параграфы, обновлять существующие (по id), добавлять новые (id=0), обновлять метаданные и инфобокс. Всё в транзакции.
Фронтенд: Все компоненты редактора, хелперы, типы, валидация
Роутинг: /admin/articles/:articleId/edit → EditArticlePage (заглушка)
Что нужно сделать
Задачи (пошаговый алгоритм)
1. Бэкенд: добавить PUT-эндпоинт
Файл: ArticleContentEndpoints.cs

Добавить group.MapPut("/{id:int}/content", ...) который вызывает service.UpdateContentAsync(id, dto). Защитить RequireAuthorization("AdminOnly").

2. Фронтенд: добавить API-метод updateArticleContent
Файл: articleService.ts

export const updateArticleContent = async (id: number, payload: ArticleContentDto): Promise<void> => {
  await apiClient.put(`/articles/${id}/content`, payload);
};

3. Фронтенд: функция конвертации ParagraphDto[] → EditorBlock[]
Файл: draftHelpers.ts — новая функция importBlocksFromParagraphs

Логика (как вы описали):

Группируем параграфы по order
Группа из 1 параграфа → смотрим content:
начинается с ## → PlainEditorBlock kind heading2, content без префикса
начинается с ### → PlainEditorBlock kind heading3, content без префикса
иначе → PlainEditorBlock kind paragraph
Группа из нескольких → VersionedEditorBlock, каждый параграф = AlternativeDraft
Ключевой момент: сохраняем paragraphId из DTO. Для этого нужно расширить типы — добавить опциональное поле paragraphId?: number в PlainEditorBlock, AlternativeDraft.

4. Фронтенд: обновить buildParagraphDtosFromBlocks для учёта существующих ID
Файл: draftHelpers.ts

Сейчас всегда ставит id: 0. Нужно брать paragraphId из блока/варианта (если есть) — чтобы бэкенд знал, что обновлять, а что создавать.

5. Фронтенд: функция конвертации инфобокса ArticleInfoboxDto → InfoboxDraft
Файл: infoboxHelpers.ts — новая функция importInfoboxFromDto

Маппинг полей DTO в InfoboxDraft с InfoboxFieldDraft[].

6. Фронтенд: реализовать EditArticlePage
Файл: EditArticlePage.tsx

Два подхода на выбор:

Подход A (рекомендуемый): Рефакторинг AddArticlePage в универсальный ArticleEditorPage, принимающий mode: 'create' | 'edit' и опциональные начальные данные. Минимальные различия:

В режиме edit: загружаем данные через useQuery(getArticleContentById), инициализируем state
При сохранении: create → createArticleContent, edit → updateArticleContent
Заголовок страницы и текст кнопки меняются
Подход B: EditArticlePage как обёртка — загружает данные, конвертирует, рендерит общий редактор. Меньше рефакторинга, но дублирование.

7. Локализация
Добавить ключи для страницы редактирования в файлы локализации (заголовок, кнопка "Обновить", сообщения об успехе/ошибке).

8. Тесты
Unit-тест для importBlocksFromParagraphs (plain, heading2, heading3, versioned, mixed)
Unit-тест для обновлённого buildParagraphDtosFromBlocks (проверить что ID сохраняются)
Integration-тест для PUT-эндпоинта
Порядок выполнения
[1] PUT endpoint (бэкенд)
[2] updateArticleContent (фронт API)
[3] importBlocksFromParagraphs + расширение типов
[4] обновить buildParagraphDtosFromBlocks
[5] importInfoboxFromDto
[6] EditArticlePage (собрать всё вместе)
[7] Локализация
[8] Тесты
