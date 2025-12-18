const axios = require('axios');
const { marked } = require('marked');

const html = marked.parse(process.env.ISSUE_BODY || '');

axios.post(
  `${process.env.BOOKSTACK_URL}/api/pages`,
  {
    book_id: process.env.BOOKSTACK_BOOK_ID,
    name: process.env.ISSUE_TITLE,
    html: html
  },
  {
    headers: {
      Authorization: `Token ${process.env.BOOKSTACK_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
).then(() => {
  console.log('Page created in BookStack');
}).catch(err => {
  console.error(err.response?.data || err.message);
});
