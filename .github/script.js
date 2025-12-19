// script.js
const axios = require('axios');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');

// Получаем данные события GitHub
const eventPath = process.env.GITHUB_EVENT_PATH;
const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const issue = eventData.issue;
const action = eventData.action;

// Конфигурация BookStack API
const config = {
  baseURL: process.env.BOOKSTACK_API_URL,
  auth: {
    username: process.env.BOOKSTACK_TOKEN_ID,
    password: process.env.BOOKSTACK_TOKEN_SECRET
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// ID книги в BookStack
const BOOK_ID = process.env.BOOKSTACK_BOOK_ID;

// Функция для создания/обновления страницы в BookStack
async function syncToBookStack() {
  try {
    console.log('Starting BookStack sync...');
    console.log(`Issue #${issue.number}: ${issue.title}`);
    console.log(`Action: ${action}`);
    console.log(`Book ID: ${BOOK_ID}`);

    // Конвертируем markdown в HTML
    const htmlContent = marked.parse(issue.body || '');
    
    // Подготавливаем данные для BookStack
    const pageData = {
      book_id: parseInt(BOOK_ID),
      name: `Issue #${issue.number}: ${issue.title}`,
      html: `
        <h1>Issue #${issue.number}: ${issue.title}</h1>
        <p><strong>Status:</strong> ${issue.state}</p>
        <p><strong>Created:</strong> ${new Date(issue.created_at).toLocaleString()}</p>
        <p><strong>Updated:</strong> ${new Date(issue.updated_at).toLocaleString()}</p>
        <p><strong>URL:</strong> <a href="${issue.html_url}">${issue.html_url}</a></p>
        <hr>
        ${htmlContent}
        ${issue.labels && issue.labels.length > 0 ? 
          `<p><strong>Labels:</strong> ${issue.labels.map(l => l.name).join(', ')}</p>` : ''}
        ${issue.assignee ? `<p><strong>Assignee:</strong> ${issue.assignee.login}</p>` : ''}
      `,
      tags: [
        { name: 'github' },
        { name: 'issue' },
        { name: `issue-${issue.number}` },
        { name: `state-${issue.state}` },
        ...(issue.labels ? issue.labels.map(label => ({ name: label.name })) : [])
      ]
    };

    // Проверяем, существует ли уже страница
    const searchResponse = await axios.get('/api/pages', {
      ...config,
      params: {
        filter: {
          name: `Issue #${issue.number}:`
        }
      }
    });

    let response;
    
    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      // Обновляем существующую страницу
      const existingPage = searchResponse.data.data[0];
      console.log(`Updating existing page: ${existingPage.id}`);
      
      response = await axios.put(`/api/pages/${existingPage.id}`, pageData, config);
      console.log('Page updated successfully');
    } else {
      // Создаем новую страницу
      console.log('Creating new page...');
      
      response = await axios.post('/api/pages', pageData, config);
      console.log('Page created successfully');
    }

    console.log('Sync completed successfully!');
    console.log('Page URL:', `${process.env.BOOKSTACK_API_URL}/books/${BOOK_ID}/page/${response.data.id}`);
    
    return response.data;
    
  } catch (error) {
    console.error('Error syncing to BookStack:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    process.exit(1); // Завершаем с ошибкой
  }
}

// Обрабатываем только открытие и редактирование issues
if (['opened', 'edited'].includes(action)) {
  syncToBookStack();
} else if (action === 'closed') {
  console.log(`Issue #${issue.number} was closed. You might want to update status in BookStack.`);
  // Можно добавить логику для обновления статуса закрытого issue
} else {
  console.log(`Action '${action}' not handled. Skipping sync.`);
}
