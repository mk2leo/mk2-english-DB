const { neon } = require('@neondatabase/serverless');
const cors = require('cors');

// 初始化Neon数据库连接
const sql = neon(process.env.DATABASE_URL);

// 生成唯一ID
function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// 初始化数据库表
async function initDatabase() {
  try {
    // 创建主题表
    await sql`
      CREATE TABLE IF NOT EXISTS topics (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // 创建单词表
    await sql`
      CREATE TABLE IF NOT EXISTS words (
        id VARCHAR(50) PRIMARY KEY,
        topic_id VARCHAR(50) NOT NULL,
        en VARCHAR(100) NOT NULL,
        zh VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      )
    `;
    
    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS idx_words_topic_id ON words(topic_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name)`;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// 获取所有主题
async function getTopics() {
  try {
    const topics = await sql`SELECT * FROM topics ORDER BY created_at ASC`;
    return topics;
  } catch (error) {
    console.error('Error getting topics:', error);
    throw error;
  }
}

// 创建新主题
async function createTopic(name) {
  try {
    const id = generateId();
    const topic = await sql`
      INSERT INTO topics (id, name) 
      VALUES (${id}, ${name.trim()}) 
      RETURNING *
    `;
    return topic[0];
  } catch (error) {
    console.error('Error creating topic:', error);
    throw error;
  }
}

// 删除主题
async function deleteTopic(topicId) {
  try {
    // 删除主题会自动删除相关的单词（外键约束）
    await sql`DELETE FROM topics WHERE id = ${topicId}`;
    return { success: true };
  } catch (error) {
    console.error('Error deleting topic:', error);
    throw error;
  }
}

// 获取主题的单词列表
async function getWordsByTopic(topicId) {
  try {
    const words = await sql`
      SELECT * FROM words 
      WHERE topic_id = ${topicId} 
      ORDER BY created_at ASC
    `;
    return words;
  } catch (error) {
    console.error('Error getting words:', error);
    throw error;
  }
}

// 添加单词
async function addWord(topicId, en, zh) {
  try {
    const id = generateId();
    const word = await sql`
      INSERT INTO words (id, topic_id, en, zh) 
      VALUES (${id}, ${topicId}, ${en.trim()}, ${zh ? zh.trim() : ''}) 
      RETURNING *
    `;
    return word[0];
  } catch (error) {
    console.error('Error adding word:', error);
    throw error;
  }
}

// 删除单词
async function deleteWord(wordId) {
  try {
    await sql`DELETE FROM words WHERE id = ${wordId}`;
    return { success: true };
  } catch (error) {
    console.error('Error deleting word:', error);
    throw error;
  }
}

// 检查是否有示例数据，如果没有则创建
async function ensureSampleData() {
  try {
    const topics = await getTopics();
    if (topics.length === 0) {
      // 创建示例主题
      const topic = await createTopic('日常');
      
      // 添加示例单词
      await addWord(topic.id, 'apple', '蘋果');
      await addWord(topic.id, 'water', '水');
      await addWord(topic.id, 'book', '書');
      
      console.log('Sample data created');
    }
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// 处理CORS
const corsHandler = cors({
  origin: true,
  credentials: true
});

// API处理函数
async function handler(req, res) {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return corsHandler(req, res, () => {
      res.status(200).end();
    });
  }

  corsHandler(req, res, async () => {
    try {
      const { method, url } = req;
      const path = url.split('?')[0];

      // 路由处理
      switch (method) {
        case 'GET':
          if (path === '/api/topics') {
            const topics = await getTopics();
            res.json({ topics });
          } else if (path.startsWith('/api/words/')) {
            const topicId = path.split('/')[3];
            const words = await getWordsByTopic(topicId);
            res.json({ words });
          } else {
            res.status(404).json({ error: 'Not found' });
          }
          break;

        case 'POST':
          if (path === '/api/topics') {
            const { name } = req.body;
            if (!name) {
              return res.status(400).json({ error: 'Topic name is required' });
            }
            const topic = await createTopic(name);
            res.json({ topic });
          } else if (path === '/api/words') {
            const { topicId, en, zh } = req.body;
            if (!topicId || !en) {
              return res.status(400).json({ error: 'Topic ID and English word are required' });
            }
            const word = await addWord(topicId, en, zh);
            res.json({ word });
          } else {
            res.status(404).json({ error: 'Not found' });
          }
          break;

        case 'DELETE':
          if (path.startsWith('/api/topics/')) {
            const topicId = path.split('/')[3];
            await deleteTopic(topicId);
            res.json({ success: true });
          } else if (path.startsWith('/api/words/')) {
            const wordId = path.split('/')[3];
            await deleteWord(wordId);
            res.json({ success: true });
          } else {
            res.status(404).json({ error: 'Not found' });
          }
          break;

        default:
          res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

// 初始化数据库
initDatabase().then(() => {
  ensureSampleData();
});

module.exports = handler;