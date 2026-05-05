// 1. 引入所有需要的依赖（确保和package.json的依赖对应）
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// 2. 创建Express应用实例
const app = express();

// 3. 配置中间件（解决跨域、解析JSON请求，必须加）
app.use(cors()); // 允许跨域请求（前端调用API需要）
app.use(express.json()); // 解析JSON格式的请求体

// 4. 解决「Cannot GET /」的核心：添加根路径路由
app.get('/', (req, res) => {
  res.send('✅ Coze API Server 运行正常！');
});

// 5. 健康检查接口（方便验证服务是否可用）
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: '服务正常运行',
    server: 'coze-api-server',
    node_version: process.version
  });
});

// 6. 核心：真正生效的Chat接口（对接Coze AI）
// 移除注释，完善逻辑+错误日志
app.post('/api/chat', async (req, res) => {
  // 提前定义变量，确保catch里能访问
  let cozeApiKey, cozeEndpoint, cozeModelId;
  
  try {
    // ===== 第一步：打印请求日志（确认请求进来了）=====
    console.log("===== 收到/api/chat请求 =====");
    console.log("请求时间：", new Date().toLocaleString());
    console.log("前端传的参数：", req.body);

    // ===== 第二步：获取并校验前端参数 =====
    const { message } = req.body;
    if (!message || message.trim() === "") {
      console.log("错误：前端未传message参数");
      return res.status(400).json({
        success: false,
        error: "请输入要发送给AI的消息",
        detail: "message参数为空"
      });
    }

    // ===== 第三步：读取Railway环境变量（Coze配置）=====
    cozeApiKey = process.env.COZE_API_KEY;
    cozeEndpoint = process.env.COZE_API_ENDPOINT || "https://api.coze.cn/v1/chat/completions";
    cozeModelId = process.env.COZE_MODEL_ID;

    // 校验配置是否完整
    if (!cozeApiKey) {
      console.log("错误：COZE_API_KEY环境变量未配置");
      return res.status(500).json({
        success: false,
        error: "服务器配置错误",
        detail: "缺少Coze API Key（COZE_API_KEY）"
      });
    }
    if (!cozeModelId) {
      console.log("错误：COZE_MODEL_ID环境变量未配置");
      return res.status(500).json({
        success: false,
        error: "服务器配置错误",
        detail: "缺少Coze模型ID（COZE_MODEL_ID）"
      });
    }

    // ===== 第四步：调用Coze官方接口 =====
    console.log("开始调用Coze接口：", {
      endpoint: cozeEndpoint,
      modelId: cozeModelId,
      message: message.substring(0, 20) + "..." // 只打印前20字，避免日志过长
    });

    const cozeResponse = await axios.post(
      cozeEndpoint,
      {
        model: cozeModelId,
        messages: [{ role: "user", content: message }], // Coze要求的消息格式
        stream: false // 关闭流式响应，新手优先用同步响应
      },
      {
        headers: {
          "Authorization": `Bearer ${cozeApiKey}`, // Bearer后必须加空格！
          "Content-Type": "application/json"
        },
        timeout: 15000 // Coze请求超时时间（15秒）
      }
    );

    // ===== 第五步：解析Coze回复并返回 =====
    const aiReply = cozeResponse.data.choices[0]?.message?.content || "AI暂无回复";
    console.log("Coze回复成功：", aiReply.substring(0, 50) + "...");
    
    res.json({
      success: true,
      reply: aiReply,
      detail: {
        model: cozeModelId,
        requestId: cozeResponse.data.id || "无"
      }
    });

  } catch (error) {
    // ===== 核心：完善的错误日志（定位所有问题）=====
    console.error("===== Coze接口调用详细错误 =====");
    console.error("基础错误信息：", error.message);
    console.error("Coze返回状态码：", error.response?.status);
    console.error("Coze返回原始数据：", error.response?.data);
    console.error("使用的Coze地址：", cozeEndpoint);
    console.error("使用的模型ID：", cozeModelId);
    console.error("==================================");

    // 返回详细错误给小程序（方便定位）
    res.status(200).json({
      success: false,
      error: "AI回复失败",
      detail: {
        errorMsg: error.message,
        statusCode: error.response?.status,
        cozeError: error.response?.data?.error?.message || "无Coze具体错误",
        usedModelId: cozeModelId,
        usedEndpoint: cozeEndpoint
      }
    });
  }
});

// 7. 配置端口（必须用Railway自动分配的端口，核心！）
const PORT = process.env.PORT || 3000;

// 8. 启动服务
app.listen(PORT, () => {
  console.log(`🚀 Coze API Server 启动成功！端口：${PORT}`);
  console.log(`📌 访问地址：http://localhost:${PORT}`);
  console.log(`📝 健康检查：http://localhost:${PORT}/api/health`);
});
