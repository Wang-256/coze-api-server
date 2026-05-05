const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Coze API Server 运行正常！');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: '服务正常运行' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ success: false, error: "缺少message参数" });
    }

    const cozeApiKey = process.env.COZE_API_KEY;
    const cozeModelId = process.env.COZE_MODEL_ID;
    const cozeEndpoint = "https://api.coze.cn/v3/chat";

    if (!cozeApiKey || !cozeModelId) {
      return res.json({ success: false, error: "Railway环境变量未配置" });
    }

    // 调用Coze V3接口（已适配正确格式）
    const cozeResponse = await axios.post(cozeEndpoint, {
      bot_id: cozeModelId,
      user_id: "mini_program_user_001",
      stream: false,
      additional_messages: [{ role: "user", content: message, content_type: "text" }]
    }, {
      headers: { "Authorization": `Bearer ${cozeApiKey}`, "Content-Type": "application/json" },
      timeout: 15000
    });

    // 适配Coze V3接口的标准返回格式
    const aiReply = cozeResponse.data.messages?.[0]?.content || "AI暂无回复";

    // 直接返回结果给小程序
    res.json({
      success: true,
      reply: aiReply
    });

  } catch (error) {
    console.error("调用失败：", error.message, error.response?.data);
    res.json({
      success: false,
      error: "调用Coze失败",
      detail: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 服务启动，端口：${PORT}`);
});
