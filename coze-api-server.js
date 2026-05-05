const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Coze API Server 运行正常！');
});

// 核心接口：适配Coze V3异步接口 + 轮询获取结果
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ success: false, error: "缺少message参数" });
    }

    const cozeApiKey = process.env.COZE_API_KEY;
    const cozeModelId = process.env.COZE_MODEL_ID;
    const baseUrl = "https://api.coze.cn/v3";

    // 1. 创建对话
    const createRes = await axios.post(`${baseUrl}/chat`, {
      bot_id: cozeModelId,
      user_id: "user_001",
      stream: false,
      additional_messages: [{ role: "user", content: message, content_type: "text" }]
    }, {
      headers: { Authorization: `Bearer ${cozeApiKey}` },
      timeout: 10000
    });

    const chatId = createRes.data.data.id;
    const conversationId = createRes.data.data.conversation_id;
    let reply = "AI暂无回复";

    // 2. 轮询查询结果（最多查10次，每秒1次）
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1000));
      
      const queryRes = await axios.get(`${baseUrl}/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${cozeApiKey}` },
        params: { conversation_id: conversationId }
      });

      const status = queryRes.data.data.status;
      if (status === "completed") {
        // 获取AI回复
        const messages = queryRes.data.data.messages || [];
        const aiMsg = messages.find(m => m.role === "assistant");
        if (aiMsg) reply = aiMsg.content;
        break;
      }
    }

    res.json({ success: true, reply: reply });

  } catch (error) {
    res.json({
      success: false,
      error: "AI回复失败",
      detail: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务启动成功`);
});
