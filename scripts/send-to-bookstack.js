const axios = require('axios');
const { marked } = require('marked');

// Получаем данные из окружения
const issueTitle = process.env.ISSUE_TITLE || '';
const issueBody = process.env.ISSUE_BODY || '';
const issueNumber = process.env.ISSUE_NUMBER || '';
const issueUrl = process.env.ISSUE_URL || '';
const actionType = process.env.ACTION_TYPE || 'opened';

// Функция для поиска существующей статьи по номеру Issue
async function findExistingPage() {
  try {
    const response = await axios.get(
      `${process.env.BOOKSTACK_URL}/api/pages`,
      {
        headers: {
          Authorization: `Token ${process.env.BOOKSTACK_API_ID}:${process.env.BOOKSTACK_API_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Ищем статью по номеру Issue в названии
    const existingPage = response.data.data.find(page => 
      page.name && page.name.includes(`#${issueNumber}`)
    );
    
    return existingPage ? existingPage.id : null;
  } catch (error) {
    console.error('Ошибка поиска статьи:', error.message);
    return null;
  }
}

// Основная функция синхронизации
async function syncToBookStack() {
  try {
    const bookstackUrl = process.env.BOOKSTACK_URL;
    const apiId = process.env.BOOKSTACK_API_ID;
    const apiSecret = process.env.BOOKSTACK_API_SECRET;
    const bookId = process.env.BOOKSTACK_BOOK_ID;
    
    // Проверяем обязательные переменные
    if (!bookstackUrl || !apiId || !apiSecret || !bookId) {
      throw new Error('Отсутствуют обязательные переменные окружения');
    }
    
    // Конвертируем Markdown в HTML (только тело Issue без форматирования)
    const htmlContent = marked.parse(issueBody);
    
    // Формируем заголовок статьи
    const articleTitle = `#${issueNumber} - ${issueTitle}`;
    
    // Добавляем ссылку на GitHub Issue в начало статьи
    const finalHtml = `
      <p><strong>GitHub Issue:</strong> <a href="${issueUrl}">${issueUrl}</a></p>
      <hr>
      ${htmlContent}
    `;
    
    // Ищем существующую статью
    const existingPageId = await findExistingPage();
    
    const headers = {
      Authorization: `Token ${apiId}:${apiSecret}`,
      'Content-Type': 'application/json'
    };
    
    if (existingPageId && actionType !== 'closed') {
      // Обновляем существующую статью
      console.log(`Обновление статьи ID: ${existingPageId}`);
      
      await axios.put(
        `${bookstackUrl}/api/pages/${existingPageId}`,
        {
          name: articleTitle,
          html: finalHtml
        },
        { headers }
      );
      
      console.log('Статья обновлена в BookStack');
    } else if (actionType === 'closed' && existingPageId) {
      // Если Issue закрыт, помечаем статью как решённую
      console.log(`Закрытие статьи ID: ${existingPageId}`);
      
      const closedHtml = finalHtml + `
        <div style="background-color: #d4edda; padding: 10px; margin-top: 20px; border-radius: 5px;">
          <strong>✓ РЕШЕНО</strong> - Issue закрыт в GitHub
        </div>
      `;
      
      await axios.put(
        `${bookstackUrl}/api/pages/${existingPageId}`,
        {
          name: articleTitle + ' [РЕШЕНО]',
          html: closedHtml
        },
        { headers }
      );
      
      console.log('Статья помечена как решённая');
    } else {
      // Создаём новую статью
      console.log('Создание новой статьи');
      
      await axios.post(
        `${bookstackUrl}/api/pages`,
        {
          book_id: bookId,
          name: articleTitle,
          html: finalHtml
        },
        { headers }
      );
      
      console.log('Статья создана в BookStack');
    }
  } catch (error) {
    console.error('Ошибка:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Запуск
syncToBookStack();
