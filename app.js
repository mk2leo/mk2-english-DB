// 基本資料結構：
// topics: [{ id, name }]
// wordsByTopicId: { [topicId]: [{ id, en, zh, audioUrl? }] }

;(function(){
  // API 基础地址
  const API_BASE_URL = 'https://3000api.mk2leo.com/api';
  // 固定删除确认密码
  const DELETE_CONFIRM_PASSWORD = '889988';
  
  /** @type {HTMLUListElement} */
  const topicListEl = document.getElementById('topic-list')
  const newTopicInputEl = document.getElementById('new-topic-input')
  const addTopicBtn = document.getElementById('add-topic-btn')
  const currentTopicTitleEl = document.getElementById('current-topic-title')
  const wordListEl = document.getElementById('word-list')
  const wordEnInputEl = document.getElementById('word-en')
  const wordZhInputEl = document.getElementById('word-zh')
  const addWordBtn = document.getElementById('add-word-btn')
  const translateBtn = document.getElementById('translate-btn')
  const startQuizBtn = document.getElementById('start-quiz-btn')
  const quizSectionEl = document.getElementById('quiz-section')
  const exitQuizBtn = document.getElementById('exit-quiz-btn')
  const quizContainerEl = document.getElementById('quiz-container')
  const submitQuizBtn = document.getElementById('submit-quiz-btn')
  const quizScoreEl = document.getElementById('quiz-score')
  const wordFormSectionEl = document.querySelector('.word-form')
  const wordListSectionEl = document.querySelector('.word-list-section')
  const wordCountEl = document.getElementById('word-count')
  // 数据库连接状态提示元素（需在HTML中添加对应元素）
  const dbStatusEl = document.getElementById('db-status')

  // 狀態
  const state = {
    topics: [],
    wordsByTopicId: {},
    currentTopicId: null,
    quizAnswers: {}, // { wordId: userInput }
    quizOrder: [], // shuffled word ids
  }

  function uid(){
    return Math.random().toString(36).slice(2)+Date.now().toString(36)
  }

  // API 调用函数
  async function apiGet(url) {
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }

  async function apiPost(url, data) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }

  async function apiDelete(url) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }

  // 更新数据库连接状态提示
  function updateDbStatus(isConnected, message = '') {
    if (!dbStatusEl) return; // 若HTML中无状态元素则跳过
    
    if (isConnected) {
      dbStatusEl.textContent = message || '✅ 数据库连接成功';
      dbStatusEl.style.color = '#2ecc71'; // 成功色（绿色）
    } else {
      dbStatusEl.textContent = message || '❌ 数据库连接失败，请检查服务端';
      dbStatusEl.style.color = '#e74c3c'; // 失败色（红色）
    }
  }

  // 删除操作前的密码确认函数
  function confirmDeletePassword(actionType) {
    // 提示用户输入密码（说明操作类型：删除主题/删除单词）
    const inputPassword = prompt(`请输入删除确认密码，确认${actionType}：`, '');
    
    // 处理用户操作：取消输入或密码错误则返回false，终止删除
    if (inputPassword === null) {
      alert('已取消删除操作');
      return false;
    }
    if (inputPassword.trim() !== DELETE_CONFIRM_PASSWORD) {
      alert('密码错误，删除操作已取消');
      return false;
    }
    
    // 密码正确，允许删除
    return true;
  }

  async function load() {
    // 初始显示加载中状态
    updateDbStatus(false, '🔄 正在尝试连接数据库...');
    
    try {
      // 加载主题（作为数据库连接测试的核心请求）
      const topics = await apiGet('/topics');
      state.topics = topics;
      
      // 加载当前主题的单词
      if (topics.length > 0) {
        state.currentTopicId = topics[0].id;
        await loadWordsForTopic(state.currentTopicId);
      }
      
      // 连接成功：更新状态提示
      updateDbStatus(true);
      renderTopics();
      renderWords();
    } catch (err) {
      console.error('数据库连接/数据加载失败:', err);
      // 连接失败：更新状态提示，无默认示例数据
      updateDbStatus(false, `❌ 数据库连接失败：${err.message}`);
      
      // 清空状态
      state.topics = [];
      state.wordsByTopicId = {};
      state.currentTopicId = null;
      
      // 渲染空状态
      renderTopics();
      renderWords();
      currentTopicTitleEl.textContent = '暂无可用主题（数据库连接失败）';
      
      // 禁用依赖数据的功能按钮
      addWordBtn.disabled = true;
      startQuizBtn.disabled = true;
      translateBtn.disabled = true;
    }
  }

  async function loadWordsForTopic(topicId) {
    try {
      const words = await apiGet(`/topics/${topicId}/words`);
      state.wordsByTopicId[topicId] = words;
    } catch (err) {
      console.error('单词加载失败:', err);
      state.wordsByTopicId[topicId] = [];
      // 单词加载失败时补充提示
      updateDbStatus(true, '⚠️ 数据库连接正常，但单词加载失败');
    }
  }

  function renderTopics(){
    topicListEl.innerHTML = '';
    
    // 处理无主题的空状态
    if (state.topics.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'topic-empty';
      emptyLi.textContent = '暂无主题，请点击"新增主题"创建';
      topicListEl.appendChild(emptyLi);
      return;
    }
    
    state.topics.forEach(t => {
      const li = document.createElement('li');
      li.className = 'topic-item' + (t.id === state.currentTopicId ? ' active' : '');
      li.innerHTML = `
        <span class="topic-name">${escapeHtml(t.name)}</span>
        <div class="topic-actions">
          <button data-action="switch" data-id="${t.id}" class="ghost">切換</button>
          <button data-action="delete" data-id="${t.id}" class="danger">刪除</button>
        </div>
      `;
      li.addEventListener('click', (e)=>{
        const target = e.target;
        if(!(target instanceof HTMLElement)) return;
        const action = target.getAttribute('data-action');
        const id = target.getAttribute('data-id');
        if(action === 'switch' && id){
          setCurrentTopic(id);
          return;
        }
        if(action === 'delete' && id){
          deleteTopic(id);
          return;
        }
        setCurrentTopic(t.id);
      });
      topicListEl.appendChild(li);
    });
  }

  async function setCurrentTopic(topicId){
    state.currentTopicId = topicId;
    currentTopicTitleEl.textContent = state.topics.find(t=>t.id===topicId)?.name || '請選擇主題';
    renderTopics();
    await loadWordsForTopic(topicId);
    renderWords();
    
    // 恢复功能按钮（若之前因无数据被禁用）
    addWordBtn.disabled = false;
    startQuizBtn.disabled = false;
    translateBtn.disabled = false;
  }

  function renderWords(){
    wordListEl.innerHTML = '';
    const words = state.wordsByTopicId[state.currentTopicId] || [];
    
    // 更新单词数量显示
    if (wordCountEl) {
      wordCountEl.textContent = `${words.length}單詞`;
    }
    
    // 处理当前主题无单词的空状态
    if (words.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'word-empty';
      emptyLi.textContent = '当前主题暂无单词，请通过表单添加';
      wordListEl.appendChild(emptyLi);
      return;
    }
    
    words.forEach(w => {
      const li = document.createElement('li');
      li.className = 'word-card';
      li.innerHTML = `
        <div class="word-en">${escapeHtml(w.en)}</div>
        <div class="word-translation">${escapeHtml(w.zh || '')}</div>
        <div class="word-actions">
          <button data-en="${escapeAttr(w.en)}" class="speak-btn">發音</button>
          <button data-id="${w.id}" class="danger del-word-btn">刪除</button>
        </div>
      `;
      li.querySelector('.speak-btn').addEventListener('click', ()=> speak(w.en));
      li.querySelector('.del-word-btn').addEventListener('click', ()=> deleteWord(w.id));
      wordListEl.appendChild(li);
    });
  }

  async function addTopic(name){
    const trimmed = (name||'').trim();
    if(!trimmed) return;
    
    try {
      const newTopic = await apiPost('/topics', { name: trimmed });
      state.topics.push(newTopic);
      state.wordsByTopicId[newTopic.id] = [];
      await setCurrentTopic(newTopic.id);
      newTopicInputEl.value = '';
      // 新增主题成功时更新状态提示
      updateDbStatus(true, '✅ 主题创建成功，数据库连接正常');
    } catch (err) {
      console.error('主题创建失败:', err);
      alert('新增主题失败：' + err.message);
      updateDbStatus(true, '⚠️ 主题创建失败，请重试');
    }
  }

  async function addWord(en, zh){
    const trimmedEn = (en||'').trim();
    if(!trimmedEn || !state.currentTopicId) return;
    
    try {
      const newWord = await apiPost('/words', {
        topicId: state.currentTopicId,
        en: trimmedEn,
        zh: (zh||'').trim()
      });
      
      if (!state.wordsByTopicId[state.currentTopicId]) {
        state.wordsByTopicId[state.currentTopicId] = [];
      }
      state.wordsByTopicId[state.currentTopicId].push(newWord);
      
      wordEnInputEl.value = '';
      wordZhInputEl.value = '';
      renderWords();
      // 新增单词成功时更新状态提示
      updateDbStatus(true, '✅ 单词添加成功，数据库连接正常');
    } catch (err) {
      console.error('单词添加失败:', err);
      alert('新增单词失败：' + err.message);
      updateDbStatus(true, '⚠️ 单词添加失败，请重试');
    }
  }

  async function deleteTopic(topicId){
    // 删除主题前先验证密码，未通过则终止
    const isPasswordCorrect = confirmDeletePassword('删除主题');
    if (!isPasswordCorrect) return;
    
    try {
      await apiDelete(`/topics/${topicId}`);
      
      // 更新本地状态
      const idx = state.topics.findIndex(t=>t.id===topicId);
      if(idx !== -1) {
        state.topics.splice(idx, 1);
      }
      delete state.wordsByTopicId[topicId];
      
      if(state.currentTopicId === topicId){
        state.currentTopicId = state.topics[0]?.id || null;
        if (state.currentTopicId) {
          await loadWordsForTopic(state.currentTopicId);
        } else {
          currentTopicTitleEl.textContent = '暂无可用主题';
          // 无主题时禁用功能按钮
          addWordBtn.disabled = true;
          startQuizBtn.disabled = true;
          translateBtn.disabled = true;
        }
      }
      
      renderTopics();
      renderWords();
      updateDbStatus(true, '✅ 主题删除成功，数据库连接正常');
    } catch (err) {
      console.error('主题删除失败:', err);
      alert('删除主题失败：' + err.message);
      updateDbStatus(true, '⚠️ 主题删除失败，请重试');
    }
  }

  async function deleteWord(wordId){
    // 删除单词前先验证密码，未通过则终止
    const isPasswordCorrect = confirmDeletePassword('删除单词');
    if (!isPasswordCorrect) return;
    
    try {
      await apiDelete(`/words/${wordId}`);
      
      // 更新本地状态
      const list = state.wordsByTopicId[state.currentTopicId] || [];
      const idx = list.findIndex(w=>w.id===wordId);
      if(idx !== -1) {
        list.splice(idx, 1);
      }
      
      renderWords();
      updateDbStatus(true, '✅ 单词删除成功，数据库连接正常');
    } catch (err) {
      console.error('单词删除失败:', err);
      alert('删除单词失败：' + err.message);
      updateDbStatus(true, '⚠️ 单词删除失败，请重试');
    }
  }

  async function translate(en){
    // 使用免費備用：MyMemory API（有速率限制）。若失敗則回傳空字串。
    try{
      const q = encodeURIComponent(en);
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${q}&langpair=en|zh-TW`);
      const data = await res.json();
      const text = data?.responseData?.translatedText || '';
      return text;
    }catch(err){
      console.warn('翻译接口调用失败:', err);
      alert('翻译失败：请检查网络或稍后重试');
      return '';
    }
  }

  function speak(text){
    if(!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }

  function startQuiz(){
    const words = (state.wordsByTopicId[state.currentTopicId] || []).slice();
    if(words.length === 0) return;
    
    // 打亂
    state.quizOrder = words.map(w=>w.id).sort(()=>Math.random()-0.5);
    state.quizAnswers = {};
    quizContainerEl.innerHTML = '';
    
    words
      .sort(()=>Math.random()-0.5)
      .forEach((w)=>{
        const item = document.createElement('div');
        item.className = 'quiz-item';
        item.innerHTML = `
          <div class="quiz-cn">${escapeHtml(w.zh || '')}</div>
          <div class="word-row">
            <input type="text" data-id="${w.id}" placeholder="輸入英文拼寫" />
            <button class="speak-btn" data-en="${escapeAttr(w.en)}">發音</button>
          </div>
        `;
        item.querySelector('.speak-btn').addEventListener('click', ()=> speak(w.en));
        quizContainerEl.appendChild(item);
      });

    quizScoreEl.textContent = '';
    quizSectionEl.classList.remove('hidden');
    // 隱藏新增與清單，避免偷看答案
    wordFormSectionEl?.classList.add('hidden');
    wordListSectionEl?.classList.add('hidden');
    startQuizBtn?.setAttribute('disabled','true');
  }

  function exitQuiz(){
    quizSectionEl.classList.add('hidden');
    quizContainerEl.innerHTML = '';
    quizScoreEl.textContent = '';
    // 顯示新增與清單
    wordFormSectionEl?.classList.remove('hidden');
    wordListSectionEl?.classList.remove('hidden');
    startQuizBtn?.removeAttribute('disabled');
  }

  function submitQuiz(){
    const words = state.wordsByTopicId[state.currentTopicId] || [];
    if(words.length === 0) return;
    
    const inputs = quizContainerEl.querySelectorAll('input[data-id]');
    let correct = 0;
    
    inputs.forEach(input=>{
      const id = input.getAttribute('data-id');
      const w = words.find(x=>x.id===id);
      const val = (input.value||'').trim();
      const isCorrect = val.toLowerCase() === (w.en||'').toLowerCase();
      const card = input.closest('.quiz-item');
      card.classList.remove('correct','incorrect');
      card.classList.add(isCorrect ? 'correct' : 'incorrect');
      if(isCorrect) correct++;
    });
    
    const score = Math.round((correct / words.length) * 100);
    quizScoreEl.textContent = `分數：${score} / 100`;
  }

  // 事件綁定
  addTopicBtn.addEventListener('click', ()=>{
    addTopic(newTopicInputEl.value);
    newTopicInputEl.value = '';
  });
  
  newTopicInputEl.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') addTopicBtn.click();
  });
  
  addWordBtn.addEventListener('click', ()=>{
    addWord(wordEnInputEl.value, wordZhInputEl.value);
  });
  
  translateBtn.addEventListener('click', async ()=>{
    const en = (wordEnInputEl.value||'').trim();
    if(!en) return;
    const zh = await translate(en);
    if(zh) wordZhInputEl.value = zh;
  });
  
  startQuizBtn.addEventListener('click', startQuiz);
  exitQuizBtn.addEventListener('click', exitQuiz);
  submitQuizBtn.addEventListener('click', submitQuiz);

  // 工具
  function escapeHtml(str){
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }
  
  function escapeAttr(str){
    return escapeHtml(str).replace(/`/g,'&#096;');
  }

  // 啟動
  load();
})();
