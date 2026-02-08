# ArbOn NFT Mint Web Interface - 部署指南

## 🚀 快速部署到 GitHub Pages

### 步骤1：创建 GitHub 仓库
1. 访问 https://github.com/new
2. 仓库名称: `arbon-nft-mint`
3. 描述: "Web interface for minting ArbOn NFTs"
4. 选择 Public
5. 不要初始化 README（已有文件）

### 步骤2：推送代码到 GitHub
```bash
# 在本地项目目录执行
cd /root/.openclaw/workspace/arbon-web-frontend

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/gm198/arbon-nft-mint.git

# 推送代码
git branch -M main
git push -u origin main
```

### 步骤3：启用 GitHub Pages
1. 访问仓库设置: `https://github.com/gm198/arbon-nft-mint/settings/pages`
2. Source: 选择 `main` branch
3. Folder: `/ (root)`
4. 点击 Save

### 步骤4：访问网站
- **GitHub Pages URL**: `https://gm198.github.io/arbon-nft-mint/`
- **自定义域名**（可选）: 在设置中添加

## 📱 功能预览

### 界面截图
```
[钱包连接] → [获取挑战] → [提交答案] → [铸造NFT]
```

### 技术特性
- ✅ 响应式设计（桌面/移动）
- ✅ MetaMask 钱包集成
- ✅ Arbitrum 网络检测
- ✅ 实时交易状态
- ✅ 活动日志记录

## 🔧 本地测试

### 方法1：直接打开
```bash
# 在浏览器中打开
open index.html
# 或
xdg-open index.html
```

### 方法2：使用本地服务器
```bash
# Python 3
python3 -m http.server 8000

# 或使用 Node.js
npx serve .
```

访问: http://localhost:8000

## 🌐 生产环境要求

### 必需条件
1. **Web3 钱包**: MetaMask 或兼容钱包
2. **Arbitrum 网络**: 钱包必须连接到 Arbitrum
3. **ETH 余额**: 至少 0.0005 ETH（公售价格）

### 浏览器支持
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## 📊 配置选项

### 自定义配置
编辑 `app.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
    apiBase: 'https://www.arbonnft.xyz/api',  // API 端点
    nftContract: '0x2079606049B99adB4cF70844496A026e53e47C60', // NFT 合约
    arbitrumChainId: '0xa4b1',  // Arbitrum 链 ID
    arbitrumRpc: 'https://arb1.arbitrum.io/rpc'  // RPC 端点
};
```

### 样式定制
编辑 `index.html` 中的 CSS 部分：
- 颜色方案（绿色主题）
- 动画效果
- 响应式断点

## 🔒 安全注意事项

### 客户端安全
- 所有操作在用户浏览器中执行
- 不存储私钥或敏感信息
- 依赖 MetaMask 的安全模型

### API 安全
- 仅与官方 ArbOn API 通信
- 使用 HTTPS 加密连接
- 验证 API 响应完整性

### 交易安全
- 用户必须手动确认每笔交易
- 显示明确的交易详情
- 提供 Gas 费用估算

## 🐛 故障排除

### 常见问题

#### 1. 钱包连接失败
```
解决方案：
- 确认 MetaMask 已安装
- 检查浏览器扩展权限
- 刷新页面重试
```

#### 2. 网络错误
```
解决方案：
- 切换到 Arbitrum 网络
- 检查网络连接
- 确认 RPC 端点可用
```

#### 3. API 错误
```
解决方案：
- 检查 ArbOn API 状态
- 验证钱包地址格式
- 查看浏览器控制台日志
```

#### 4. 交易失败
```
解决方案：
- 确认 ETH 余额充足
- 增加 Gas 限制
- 检查合约状态
```

### 调试工具
1. **浏览器开发者工具** (F12)
   - 控制台日志
   - 网络请求监控
   - JavaScript 调试

2. **MetaMask 调试**
   - 交易详情查看
   - 网络切换日志
   - 账户权限检查

## 📈 监控与维护

### 性能监控
- 页面加载时间
- API 响应时间
- 交易确认时间

### 使用统计
- 钱包连接次数
- 挑战请求数量
- 成功铸造数量

### 更新维护
1. **定期检查**
   - API 端点状态
   - 合约地址更新
   - 依赖库版本

2. **功能更新**
   - 新钱包支持
   - 多语言界面
   - 增强错误处理

## 📞 支持与反馈

### 问题报告
- **GitHub Issues**: https://github.com/gm198/arbon-nft-mint/issues
- **功能请求**: 使用 Issue 模板

### 社区支持
- **ArbOn 官方**: https://www.arbonnft.xyz
- **OpenClaw 社区**: Discord/Telegram

### 贡献指南
1. Fork 仓库
2. 创建功能分支
3. 提交 Pull Request
4. 通过代码审查

## 🎯 成功指标

### 用户体验
- ✅ 页面加载 < 3秒
- ✅ 钱包连接 < 10秒
- ✅ 交易确认 < 60秒

### 功能完整性
- ✅ 所有步骤可完成
- ✅ 错误处理完善
- ✅ 移动端兼容

### 安全性
- ✅ 无安全漏洞
- ✅ 隐私保护
- ✅ 交易安全

---

**部署完成时间**: 2026-02-08  
**最后更新**: 2026-02-08  
**版本**: 1.0.0