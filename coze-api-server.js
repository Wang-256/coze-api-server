const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Coze API Server 运行正常！');
});

// 核心：Coze V3 官方标准接口
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ success: false, error: "请输入消息" });
    }

    const cozeApiKey = process.env.COZE_API_KEY;
    const botId = process.env.COZE_MODEL_ID;

    // 官方正确接口地址
    const response = await axios.post('https://api.coze.cn/v3/chat', {
      bot_id: botId,
      user_id: "user_001",
      stream: false,
      // 官方标准消息格式
      messages: [{ role: "user", content: message }]
    }, {
      headers: {
        "Authorization": `Bearer ${cozeApiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 20000
    });

    // 官方标准返回解析
    const aiReply = response.data.data?.messages?.find(m => m.role === "assistant")?.content || "AI暂无回复";

    res.json({
      success: true,
      reply: aiReply
    });

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
