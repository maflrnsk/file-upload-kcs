const { marked } = require('marked');
const fs = require('fs');

// Получаем данные Issue из переменной окружения
const issueData = JSON.parse(process.env.ISSUE_DATA);

console.log('Parsing issue data...');
console.log('Issue title:', issueData.title);
console.log('Issue number:', issueData.number);
console.log('Issue labels:', issueData.labels.map(l => l.name));

const issueTitle = issueData.title;
const issueBody = issueData.body || '';
const issueNumber = issueData.number;
const issueState = issueData.state;
const issueUrl = issueData.html_url;
const issueLabels = issueData.labels.map(l => l.name).join(', ');

// Парсим тело Issue
const bodyLines = issueBody.split('\n');
let problem = '', cause = '', solution = '', links = '';
let currentSection = '';

for (const line of bodyLines) {
  const trimmedLine = line.trim();
  
  if (trimmedLine.startsWith('## Проблема') || trimmedLine.startsWith('### Проблема')) {
    currentSection = 'problem';
    continue;
  } else if (trimmedLine.startsWith('## Причина') || trimmedLine.startsWith('### Причина')) {
    currentSection = 'cause';
    continue;
  } else if (trimmedLine.startsWith('## Решение') || trimmedLine.startsWith('### Решение')) {
    currentSection = 'solution';
    continue;
  } else if (trimmedLine.startsWith('## Ссылки') || trimmedLine.startsWith('### Ссылки')) {
    currentSection = 'links';
    continue;
  }
  
  if (currentSection === 'problem' && !trimmedLine.startsWith('##')) {
    problem += line + '\n';
  } else if (currentSection === 'cause' && !trimmedLine.startsWith('##')) {
    cause += line + '\n';
  } else if (currentSection === 'solution' && !trimmedLine.startsWith('##')) {
    solution += line + '\n';
  } else if (currentSection === 'links' && !trimmedLine.startsWith('##')) {
    links += line + '\n';
  }
}

// Если секции не найдены, используем все тело как проблему
if (!problem.trim() && !cause.trim() && !solution.trim()) {
  problem = issueBody;
}

// Конвертируем Markdown в HTML
const problemHtml = marked.parse(problem.trim() || 'Информация не указана');
const causeHtml = marked.parse(cause.trim() || 'Причина не определена');
const solutionHtml = marked.parse(solution.trim() || 'Решение пока не найдено');
const linksHtml = marked.parse(links.trim() || 'Ссылки отсутствуют');

// Формируем финальный HTML
const finalHtml = `
<div class="kcs-article">
  <h2>Проблема</h2>
  <div class="problem-section">
    ${problemHtml}
  </div>
  
  <h2>Причина</h2>
  <div class="cause-section">
    ${causeHtml}
  </div>
  
  <h2>Решение</h2>
  <div class="solution-section">
    ${solutionHtml}
  </div>
  
  <h2>Ссылки</h2>
  <div class="links-section">
    <ul>
      <li><strong>GitHub Issue:</strong> <a href="${issueUrl}" target="_blank">#${issueNumber} - ${issueTitle}</a></li>
      ${linksHtml}
    </ul>
  </div>
  
  <hr>
  <div class="metadata">
    <p><strong>Статус Issue:</strong> ${issueState === 'open' ? 'Открыт' : 'Закрыт'}</p>
    <p><strong>GitHub Labels:</strong> ${issueLabels}</p>
    <p><small>Автоматически создано из GitHub Issue #${issueNumber}</small></p>
  </div>
</div>

<style>
  .kcs-article { font-family: Arial, sans-serif; line-height: 1.6; }
  .kcs-article h2 { 
    color: #2c3e50; 
    border-bottom: 2px solid #3498db;
    padding-bottom: 5px;
    margin-top: 25px;
  }
  .problem-section, .cause-section { 
    padding: 10px;
    margin-bottom: 15px;
  }
  .solution-section { 
    background-color: #f8f9fa; 
    padding: 15px; 
    border-radius: 5px;
    border-left: 4px solid #2ecc71;
    margin-bottom: 20px;
  }
  .links-section ul {
    padding-left: 20px;
  }
  .metadata { 
    background-color: #e8f4fc; 
    padding: 15px; 
    border-radius: 5px;
    font-size: 0.9em;
    color: #555;
    margin-top: 20px;
  }
</style>
`;

// Формируем заголовок
const pageTitle = `KCS: ${issueTitle.replace('[Upload Bug]', '').trim()} (#${issueNumber})`;

// Формируем теги
const tags = ['kcs', 'upload', 'images', 'storage', 'bug', `issue-${issueNumber}`, `state-${issueState}`];

// Добавляем дополнительные теги из labels
const additionalTags = issueData.labels
  .map(l => l.name.toLowerCase().replace(/[^a-z0-9]/g, '-'))
  .filter(tag => !['upload-bug'].includes(tag));

tags.push(...additionalTags);

// Выводим результаты для GitHub Actions
console.log(`::set-output name=title::${pageTitle}`);
console.log(`::set-output name=html::${finalHtml.replace(/\n/g, ' ').replace(/"/g, '\\"')}`);
console.log(`::set-output name=tags::${JSON.stringify(tags)}`);
console.log(`::set-output name=issue_number::${issueNumber}`);
