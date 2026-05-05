const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 首页测试
app.get('/', (req, res) => {
  res.send('✅ Coze V3 官方标准异步接口服务已启动');
});

// 核心聊天接口（严格遵循Coze官方异步流程）
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const cozeApiKey = process.env.COZE_API_KEY;
    const botId = process.env.COZE_MODEL_ID;

    // 基础参数校验
    if (!message || !cozeApiKey || !botId) {
      return res.json({ success: false, error: "参数缺失" });
    }

    const headers = { 
      Authorization: `Bearer ${cozeApiKey}`,
      'Content-Type': 'application/json'
    };
    const baseUrl = "https://api.coze.cn/v3";
    let aiReply = "AI暂无回复";

    // 1. 官方步骤：创建异步对话（非流式）
    const chatRes = await axios.post(`${baseUrl}/chat`, {
      bot_id: botId,
      user_id: "pet_memory_user",
      stream: false,
      messages: [{ role: "user", content: message, content_type: "text" }]
    }, { headers });

    const { id: chatId, conversation_id: conversationId, status } = chatRes.data.data;
    console.log(`创建对话成功: chatId=${chatId}, conversationId=${conversationId}, status=${status}`);

    // 2. 官方步骤：轮询对话状态（最多10秒）
    let chatStatus = status;
    for (let i = 0; i < 10; i++) {
      if (chatStatus === 'completed' || chatStatus === 'failed') break;
      
      await new Promise(r => setTimeout(r, 1000));
      
      // ✅ 官方对话状态查询接口
      const retrieveRes = await axios.get(`${baseUrl}/chat/retrieve`, {
        headers,
        params: { conversation_id: conversationId, chat_id: chatId }
      });
      
      chatStatus = retrieveRes.data.data.status;
      console.log(`轮询状态: ${chatStatus}`);
    }

    // 3. 官方步骤：获取消息列表（状态完成后）
    if (chatStatus === 'completed') {
      // ✅ 官方消息列表接口（正确路径）
      const msgRes = await axios.get(`${baseUrl}/chat/message/list`, {
        headers,
        params: { conversation_id: conversationId, chat_id: chatId }
      });

      const messages = msgRes.data.data || [];
      const assistantMsg = messages.find(item => item.role === "assistant" && item.content);
      
      if (assistantMsg) {
        aiReply = assistantMsg.content;
      }
    }

    // 返回最终结果
    res.json({ success: true, reply: aiReply });

  } catch (error) {
    console.error("请求错误:", error.response?.data || error.message);
    res.json({
      success: false,
      error: "AI回复失败",
      detail: error.response?.data || { msg: error.message }
    });
  }
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务运行在端口 ${PORT}`);
});
