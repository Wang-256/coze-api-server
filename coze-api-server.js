const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// 允许跨域请求（小程序必须）
app.use(cors());
// 解析JSON格式的请求体
app.use(express.json());

// ================== 必须替换成你自己的内容 ==================
const COZE_API_KEY = 'pat_yC3GgtjEUCop1ookPKeDHUj0FDz1RSDfyZbOFAsRBmv7AHXtolWt9JqT94QVavUt';
const COZE_BOT_ID = '7635586965693825030';
// ============================================================

// Coze国内版固定的API接口地址（不用改）
const COZE_API_URL = 'https://api.coze.cn/open_api/v2/chat';

// 给小程序调用的专属转发接口
app.post('/api/coze-chat', async (req, res) => {
  try {
    // 从小程序的请求里获取用户输入的内容、会话ID
    const { query, conversation_id, user } = req.body;

    // 转发请求给Coze的API接口
    const cozeResponse = await axios.post(COZE_API_URL, {
      bot_id: COZE_BOT_ID,
      user: user || 'miniprogram_user',
      query: query,
      stream: false, // 先做非流式回复，简单易上手
      conversation_id: conversation_id || ''
    }, {
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // 把Coze返回的AI回复，原样返回给小程序
    res.json(cozeResponse.data);
  } catch (error) {
    console.error('Coze API调用失败:', error.response?.data || error.message);
    res.status(500).json({ error: '请求失败，请稍后重试' });
  }
});

// 启动服务器，默认端口3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`你的API接口服务器已启动，运行在端口 ${PORT}`);
  console.log(`本地测试地址：http://localhost:${PORT}/api/coze-chat`);
});