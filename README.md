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
- `GET /api/reports`：登录后读取当前账号下的历史报告（需 `Authorization: Bearer <access_token>`）

示例：

```json
POST /api/chat/recommend
{
  "question": "我最近想看财运和副业收入",
  "record": true
}
```

服务端本地运行数据会写入 `.data/`，包括每日问题统计和报告记录。该目录已加入 `.gitignore`。

## 用户登录

当前已接入 Supabase Auth 的邮箱魔法链接登录，页面右上角会显示“登录 / 注册”入口。

除了服务端变量外，还需要补两个公开变量给浏览器端：

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`NEXT_PUBLIC_SUPABASE_URL` 通常与 `SUPABASE_URL` 相同。Supabase 新版控制台优先提供 `publishable key`，因此推荐设置 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`；如果你的项目仍在使用旧版 key，也可以继续设置 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。

## 注册与人机验证上线清单

当前注册已改为：前端展示 Turnstile，人机验证 token 先提交到服务端，由服务端校验通过后再调用 Supabase 注册。

### 1. 在 Cloudflare Turnstile 创建站点

- 创建一个 Turnstile widget。
- 生产域名填 `xingmingju-next.vercel.app`。
- 本地调试时额外加入 `localhost`。
- 记下 `Site Key` 和 `Secret Key`。

### 2. 在 Vercel 配置环境变量

至少配置以下变量：

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

说明：

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 用于前端渲染验证码。
- `TURNSTILE_SECRET_KEY` 只给服务端校验验证码使用，不能放到前端。
- 如果仍保留旧的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 也可以，但浏览器端优先建议使用 `publishable key`。

### 3. 在 Supabase 开启 Auth CAPTCHA

建议不要只依赖前端验证码，还要在 Supabase 控制台再开一层：

- 进入 `Auth`。
- 打开 `Bot and Abuse Protection`。
- 启用 `CAPTCHA protection`。
- Provider 选择 `Cloudflare Turnstile`。
- 填入同一套 `Secret Key` 并保存。

这样即使有人绕过你的页面，直接请求 Supabase 注册接口，也会被 Supabase 自己拦住。

### 4. 在 Supabase 配置回跳地址

为了让用户点完验证邮件后自动回到站点首页，建议检查以下配置：

- `Site URL` 设为 `https://xingmingju-next.vercel.app`
- `Redirect URLs` 至少包含：

```text
https://xingmingju-next.vercel.app/
https://xingmingju-next.vercel.app/?auth=verified
http://localhost:3000/
http://localhost:3000/?auth=verified
```

当前代码会在注册邮件里带上 `?auth=verified`，用户验证完成后回到首页时会看到提示。

### 5. 上线后建议顺手检查

- 确认 `Confirm email` 仍然开启。
- 试一次完整注册，验证邮件是否能收到。
- 点验证链接后确认能回到首页，并出现“邮箱验证已完成”的提示。
- 如果注册仍报错，优先检查 Turnstile 域名白名单和 Supabase Redirect URLs 是否匹配。

## 后续上线建议

`.data/` 适合本地演示和小范围试用。Vercel 等 serverless 平台会使用 `/tmp` 临时目录以避免接口报错，但数据不会长期稳定保存。正式上线给更多用户使用时，应改成数据库存储，例如 Supabase、Postgres、MySQL 或 Redis，并增加用户、订单、支付、报告权限和后台管理。
