const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ 调试中：直接返回Coze原始数据');
});

app.post('/api/chat', async (req, res) => {
  try {
    console.log("===== 收到请求 =====");
    console.log("请求参数：", req.body);

    const message = req.body.message;
    if (!message) {
      return res.json({ success: false, error: "缺少message参数" });
    }

    const cozeApiKey = process.env.COZE_API_KEY;
    const cozeModelId = process.env.COZE_MODEL_ID;
    const cozeEndpoint = "https://api.coze.cn/v3/chat";

    if (!cozeApiKey || !cozeModelId) {
      return res.json({ success: false, error: "Railway环境变量未配置" });
    }

    console.log("调用Coze接口：", { endpoint: cozeEndpoint, botId: cozeModelId, message });
    const cozeResponse = await axios.post(cozeEndpoint, {
      bot_id: cozeModelId,
      user_id: "test_user_001",
      stream: false,
      additional_messages: [{ role: "user", content: message, content_type: "text" }]
    }, {
      headers: { "Authorization": `Bearer ${cozeApiKey}`, "Content-Type": "application/json" },
      timeout: 15000
    });

    // 关键：直接把Coze的原始返回数据发给小程序，不做任何解析
    console.log("Coze原始返回数据：", JSON.stringify(cozeResponse.data, null, 2));
    res.json({
      success: true,
      rawCozeResponse: cozeResponse.data // 把原始数据原样返回
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
  console.log(`🚀 调试服务启动，端口：${PORT}`);
});
