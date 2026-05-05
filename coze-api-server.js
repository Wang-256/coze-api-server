const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 根路径测试
app.get('/', (req, res) => {
  res.send('✅ 正在调试：直接返回Coze原始数据');
});

// 核心接口：直接返回Coze的原始响应
app.post('/api/chat', async (req, res) => {
  try {
    const message = req.body.message;
    if (!message) {
      return res.json({ success: false, error: "缺少message参数" });
    }

    // 读取Railway的环境变量
    const cozeApiKey = process.env.COZE_API_KEY;
    const cozeModelId = process.env.COZE_MODEL_ID;
    const cozeEndpoint = "https://api.coze.cn/v3/chat";

    if (!cozeApiKey || !cozeModelId) {
      return res.json({ success: false, error: "Railway环境变量未配置" });
    }

    // 调用Coze V3接口
    const cozeResponse = await axios.post(cozeEndpoint, {
      bot_id: cozeModelId,
      user_id: "debug_user_001",
      stream: false,
      additional_messages: [{ role: "user", content: message, content_type: "text" }]
    }, {
      headers: { "Authorization": `Bearer ${cozeApiKey}`, "Content-Type": "application/json" },
      timeout: 15000
    });

    // 关键：直接把Coze的原始数据返回给前端，不做任何解析
    res.json({
      success: true,
      raw_coze_response: cozeResponse.data // 原样返回Coze的响应
    });

  } catch (error) {
    // 错误时返回详细信息
    res.json({
      success: false,
      error: "调用Coze失败",
      detail: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 调试服务启动，端口：${PORT}`);
});
