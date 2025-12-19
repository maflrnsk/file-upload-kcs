// Добавьте эти строки в начало, сразу после импортов
console.log('=== SCRIPT START ===');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Проверяем наличие необходимых переменных
console.log('Environment variables check:');
console.log('- BOOKSTACK_API_URL:', process.env.BOOKSTACK_API_URL ? 'SET' : 'NOT SET');
console.log('- BOOKSTACK_TOKEN_ID:', process.env.BOOKSTACK_TOKEN_ID ? 'SET' : 'NOT SET');
console.log('- BOOKSTACK_TOKEN_SECRET:', process.env.BOOKSTACK_TOKEN_SECRET ? 'SET' : 'NOT SET');
console.log('- BOOKSTACK_BOOK_ID:', process.env.BOOKSTACK_BOOK_ID ? 'SET' : 'NOT SET');
console.log('- GITHUB_EVENT_PATH:', process.env.GITHUB_EVENT_PATH);

// Проверяем, что файл события существует
try {
  if (!process.env.GITHUB_EVENT_PATH) {
    throw new Error('GITHUB_EVENT_PATH not set');
  }
  
  const eventPath = process.env.GITHUB_EVENT_PATH;
  console.log('Event path exists:', fs.existsSync(eventPath));
  
  if (fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    console.log('Event action:', eventData.action);
    console.log('Issue number:', eventData.issue?.number);
    console.log('Issue title:', eventData.issue?.title);
  }
} catch (error) {
  console.error('Error reading event data:', error.message);
}
