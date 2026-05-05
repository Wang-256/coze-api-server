const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 首页测试
app.get('/', (req, res) => {
  res.send('✅ Coze V3 异步接口服务已启动');
});

// 核心聊天接口（适配Coze官方异步逻辑）
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const cozeApiKey = process.env.COZE_API_KEY;
    const botId = process.env.COZE_MODEL_ID;

    if (!message || !cozeApiKey || !botId) {
      return res.json({ success: false, error: "参数缺失" });
    }

    const headers = { Authorization: `Bearer ${cozeApiKey}` };
    const baseUrl = "https://api.coze.cn/v3";

    // 1. 创建异步对话
    const chatRes = await axios.post(`${baseUrl}/chat`, {
      bot_id: botId,
      user_id: "pet_memory_user",
      stream: false,
      messages: [{ role: "user", content: message }]
    }, { headers });

    const chatId = chatRes.data.data.id;
    const conversationId = chatRes.data.data.conversation_id;
    let aiReply = "AI暂无回复";

    // 2. 轮询查询消息（官方正确接口，最多等待10秒）
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      
      // ✅ Coze官方标准查询消息接口
      const msgRes = await axios.get(`${baseUrl}/chat/messages`, {
        headers,
        params: { conversation_id: conversationId, chat_id: chatId }
      });

      const messages = msgRes.data.data || [];
      const assistantMsg = messages.find(item => item.role === "assistant");
      
      if (assistantMsg && assistantMsg.content) {
        aiReply = assistantMsg.content;
        break;
      }
    }

    // 返回最终结果
    res.json({ success: true, reply: aiReply });

  } catch (error) {
    res.json({
      success: false,
      error: "请求失败",
      detail: error.response?.data || error.message
    });
  }
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务运行在端口 ${PORT}`);
});
