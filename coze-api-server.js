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

// 5. 可选：添加健康检查接口（方便验证服务是否可用）
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: '服务正常运行',
    server: 'coze-api-server',
    node_version: process.version
  });
});

// ------------------- 以下保留你原有业务逻辑（如果有） -------------------
// 提示：把你原来的API接口代码（比如和Coze聊天相关的接口）粘贴到这里
// 示例（你可以替换成自己的业务代码）：
// app.post('/api/chat', async (req, res) => {
//   try {
//     const response = await axios.post('Coze的API地址', req.body);
//     res.json(response.data);
//   } catch (error) {
//     res.status(500).json({ error: '请求失败', message: error.message });
//   }
// });

// 6. 配置端口（必须用Railway自动分配的端口，核心！）
const PORT = process.env.PORT || 3000;

// 7. 启动服务
app.listen(PORT, () => {
  console.log(`🚀 Coze API Server 启动成功！端口：${PORT}`);
  console.log(`📌 访问地址：http://localhost:${PORT}`);
});
