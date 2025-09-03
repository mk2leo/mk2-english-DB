-- 创建主题表
CREATE TABLE IF NOT EXISTS topics (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建单词表
CREATE TABLE IF NOT EXISTS words (
    id VARCHAR(50) PRIMARY KEY,
    topic_id VARCHAR(50) NOT NULL,
    en VARCHAR(100) NOT NULL,
    zh VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_words_topic_id ON words(topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name);