# 星命局 Next.js

AI 运势技能商店原型，包含前端页面和基础后端 API。

## 本地运行

Windows PowerShell 如果找不到 npm，先补 Node 路径：

```powershell
$env:Path = 'C:\Windows\System32;C:\Windows;C:\Program Files\nodejs;' + $env:Path
```

启动开发服务：

```powershell
npm.cmd run dev
```

打开：

```text
http://localhost:3000
```

如果要让同一局域网的其他人访问，启动后使用终端里显示的 Network 地址，例如：

```text
http://你的局域网IP:3000
```

## 临时公网试用

如果朋友不在同一局域网，可以用公网隧道临时分享本机服务：

```powershell
npx.cmd localtunnel --port 3000
```

终端会输出一个 `https://*.loca.lt` 地址。保持这个终端和本地 Next 服务都运行，朋友就可以通过该地址访问。

注意：localtunnel 免费链接可能会先显示一次安全确认页，要求访问者输入页面上显示的 IP。这个方案适合短时间试用，不适合正式上线。

## 构建和生产启动

```powershell
npm.cmd run build
npm.cmd run start
```

## 后端接口

当前已经提供基础 API：

- `GET /api/skills?category=all&q=财运`：技能列表与搜索过滤
- `GET /api/questions/trending?question=跳槽offer`：获取今日热门问题分类按钮
- `POST /api/chat/recommend`：根据用户问题推荐技能，并记录问题分类统计
- `POST /api/reports`：生成报告并保存一条报告记录

示例：

```json
POST /api/chat/recommend
{
  "question": "我最近想看财运和副业收入",
  "record": true
}
```

服务端本地运行数据会写入 `.data/`，包括每日问题统计和报告记录。该目录已加入 `.gitignore`。

## 后续上线建议

`.data/` 适合本地演示和小范围试用。Vercel 等 serverless 平台会使用 `/tmp` 临时目录以避免接口报错，但数据不会长期稳定保存。正式上线给更多用户使用时，应改成数据库存储，例如 Supabase、Postgres、MySQL 或 Redis，并增加用户、订单、支付、报告权限和后台管理。
