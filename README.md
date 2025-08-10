# Nextacular🌙

![Open Collective backers and sponsors](https://img.shields.io/opencollective/all/nextacular) ![GitHub package.json version](https://img.shields.io/github/package-json/v/nextacular/nextacular) ![GitHub issues](https://img.shields.io/github/issues/nextacular/nextacular) ![GitHub](https://img.shields.io/github/license/nextacular/nextacular) ![GitHub Repo stars](https://img.shields.io/github/stars/nextacular/nextacular?style=social)

## 快速启动您的多租户 SaaS 应用

![Nextacular - 快速启动您的多租户 SaaS 应用](./public/images/seo-cover.png)

一个开源的入门套件，可以帮助您高效地构建全栈多租户 SaaS 平台，让您专注于开发核心的 SaaS 功能。基于 Next JS、Tailwind CSS 和 Prisma 等流行和现代的技术构建。

**开箱即用的功能**: **认证**、**计费与支付**、**数据库**、**邮件服务**、**自定义域名**、**多租户**、**工作区**和**团队**。

## 在线演示

Nextacular 演示: [https://demo.nextacular.co](https://demo.nextacular.co)

## 文档

Nextacular 文档: [https://docs.nextacular.co](https://docs.nextacular.co)

## 快速开始

请在此处阅读快速入门指南: [https://docs.nextacular.co/getting-started/quick-start](https://docs.nextacular.co/getting-started/quick-start)

## 本地开发和测试

### 1. 环境准备

首先，克隆本仓库到您的本地机器：

```bash
git clone https://github.com/delinecnlin/saas_template.git
cd saas_template
```

### 2. 安装依赖

使用 `npm` 安装项目所需的所有依赖项：

```bash
npm install
```

安装完成后，`postinstall` 脚本会自动运行 `prisma generate` 来生成 Prisma 客户端。

### 3. 配置环境变量

复制 `.env.sample` 文件来创建一个新的 `.env` 文件，并根据您的本地环境配置（如数据库连接字符串、Stripe 密钥等）填写必要的环境变量。

```bash
cp .env.sample .env
```

.env.sample 文件中还包含与 AI 集成相关的变量：

- `AZURE_OPENAI_API_KEY` 与 `AZURE_OPENAI_ENDPOINT`：Azure OpenAI 服务的 API 密钥和访问路径。
- `AZURE_OPENAI_API_VERSION`：Azure OpenAI 服务的 API 版本，若未设置将默认使用 `2024-02-15-preview`。
- `AZURE_OPENAI_MINI_API_KEY`、`AZURE_OPENAI_MINI_ENDPOINT`、`AZURE_OPENAI_MINI_DEPLOYMENT`：可选，`gpt-4o-mini` 模型的配置，未设置时回退到通用配置。
- `AZURE_OPENAI_REALTIME_ENDPOINT` 与 `AZURE_OPENAI_REALTIME_DEPLOYMENT`：Azure OpenAI Realtime 服务的资源地址和部署名称。
- `AZURE_OPENAI_REALTIME_REGION`：用于生成 WebRTC URL 的区域，例如 `eastus2` 对应 `https://eastus2.realtimeapi-preview.ai.azure.com/v1/realtimertc`，服务器在 `/api/realtime-config` 中会根据此值返回完整的 WebRTC 连接地址。
- `AZURE_REALTIME_KEY`：Azure 实时服务的密钥。
- `XIAOBING_API_KEY`：用于访问小冰数字人 API 的 Key。
- `AZURE_SPEECH_REGION` 与 `AZURE_SPEECH_KEY`：Azure Speech Service 的区域与密钥，用于语音合成和识别。
- `NEXT_PUBLIC_AZURE_SPEECH_VOICE`：默认的语音合成 Voice 名称，可在前端选择其他 Voice。
- `AZURE_AD_CLIENT_ID`、`AZURE_AD_CLIENT_SECRET`、`AZURE_AD_TENANT_ID`：启用 Azure AD 登录所需的凭据。

调试实时聊天时，可在浏览器控制台查看以 `[AzureRealtimeChat]` 开头的日志，并在服务器输出中查找 `[API] /api/realtime-config` 的记录，以确认失败步骤。

请根据实际需求填写对应值。

调用文本聊天接口时，可以向 `/api/gpt` 发送 `{ messages, model, params }` 格式的请求，其中 `params` 可覆盖温度、最大 Token 等参数；默认值可通过 `GET /api/gpt/params` 获取。

### 7. 故事页面 AI 工具

在 `account/[workspace]/stories` 页面中集成了多种 Azure AI 服务：

- **Text Chat** (`/api/gpt`，可通过 `/api/gpt/params` 获取默认参数)；
- **Realtime Chat**（`/api/realtime-config`）用于语音对话；
- **图像生成** (`/api/gpt-image/generate`)、**Bing 新闻搜索** (`/api/bing-search`)、**语音服务** (`/api/speech/token`)；
- **Sora 视频生成** (`/api/sora/generate` 与 `/api/sora/status/[jobId]`)；

这些功能均以按钮形式呈现，可在本地环境中直接体验。

### AzureTextChat 语音聊天功能

`AzureTextChat` 组件集成了 [Microsoft Cognitive Services Speech SDK](https://www.npmjs.com/package/microsoft-cognitiveservices-speech-sdk)，支持语音识别与合成，并可在前端选择使用 Flowise 或 Dify 作为对话代理，实现文字与语音的双向聊天。

#### 环境变量

在 `.env` 文件中配置以下变量以启用相关服务：

**Azure Speech Service**

- `AZURE_SPEECH_REGION`：Azure Speech 服务区域，例如 `eastasia`。
- `AZURE_SPEECH_KEY`：Azure Speech 服务密钥。
- `NEXT_PUBLIC_AZURE_SPEECH_VOICE`：可选，默认的语音合成 Voice，例如 `en-US-JennyNeural`。

**默认代理配置**

- `FLOWISE_URL`、`FLOWISE_CHATFLOW_ID`、`FLOWISE_API_KEY`
- `NEXT_PUBLIC_FLOWISE_URL`、`NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`、`NEXT_PUBLIC_FLOWISE_API_KEY`
- `DIFY_API_URL`、`DIFY_API_KEY`
- `NEXT_PUBLIC_DIFY_API_KEY`

前端表单会读取 `NEXT_PUBLIC_*` 变量作为初始值，若输入框留空则自动回退到服务器端对应的 `FLOWISE_*` 或 `DIFY_*` 配置。界面提供 “Save” 按钮，可将当前选项保存到浏览器本地存储，刷新后仍会保留。

确保安装语音 SDK 依赖：

```bash
npm install microsoft-cognitiveservices-speech-sdk
```

启动开发服务器后，在文本聊天界面即可体验语音输入、文字聊天及语音播报功能。

## 代码库结构与功能概览

本项目基于 Next.js 架构，前后端代码集中在 `src` 目录下，主要模块如下：

- `src/components`：前端 UI 组件，包含可选 Flowise/Dify 的 **AzureTextChat**、**AzureRealtimeChat**、**BingNews**、**ImageGenerator** 和 **SoraVideo** 等。
- `src/pages/api`：后端 API 路由，封装了 `/api/gpt`、`/api/realtime-config`、`/api/gpt-image/generate`、`/api/bing-search`、`/api/sora/*`、`/api/speech/token` 等服务。
- `src/lib/server/azureConfig.js`：统一管理 Azure OpenAI、Realtime 及图像生成的配置，供各个 API 复用。

### Realtime Chat 代码逻辑

1. **前端**：`AzureRealtimeChat` 组件首先向 `/api/realtime-config` 请求临时密钥和 WebRTC 地址，然后建立 `RTCPeerConnection`，创建 `oai-events` DataChannel 并发送 `session.update`，启用服务器端语音端点检测。组件会监听来自 DataChannel 的各种事件：
   - `conversation.item.input_audio_transcription.delta`/`completed` 事件用于实时累积并保存用户语音转写；
   - `response.text.delta`/`response.done` 事件构建模型回复并通过 `SpeechSynthesis` 播读。
   当用户输入文本时，组件改为调用 `/api/gpt` 获取文本回答，同时将对话记录保存到 `/api/conversations/save`。
2. **后端**：`/api/realtime-config` 在验证用户登录后，调用 Azure Realtime REST 接口创建会话，获取 `client_secret` 作为短期 `ephemeralKey`，并根据地区返回完整的 WebRTC 连接 URL。

了解以上流程后，可以在前端继续扩展更多交互（如自定义事件处理、UI 状态管理），或在后端添加鉴权、日志等逻辑以满足业务需求。

### 4. 数据库迁移和填充

运行以下命令来应用数据库迁移，并使用种子数据填充数据库：

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. 启动开发服务器

现在，您可以启动本地开发服务器：

```bash
npm run dev
```

应用将在 `http://localhost:3000` 上运行。

### 6. 其他常用命令

- **构建生产版本**: `npm run build`
- **启动生产服务器**: `npm run start`
- **代码风格检查**: `npm run lint`

## 一键部署到 Vercel 🚀

免费部署到 Vercel！

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnextacular%2Fnextacular&env=APP_URL,NEXTAUTH_SECRET,DATABASE_URL,SHADOW_DATABASE_URL,EMAIL_FROM,EMAIL_SERVER_USER,EMAIL_SERVER_PASSWORD,EMAIL_SERVICE,NEXT_PUBLIC_VERCEL_IP_ADDRESS&project-name=nextacular&repo-name=nextacular&demo-title=Nextacular%20-%20Your%20Next%20SaaS%20Project&demo-description=Nextacular%20is%20an%20open-source%20starter%20kit%20that%20will%20help%20you%20build%20SaaS%20platforms%20efficiently%20and%20focus%20on%20developing%20your%20core%20SaaS%20features.&demo-url=https%3A%2F%2Fdemo.nextacular.co&demo-image=https%3A%2F%2Fnextacular.co%2Fimages%2Fseo-cover.png)

部署后可能会遇到错误，请确保您已添加所有必要的[环境变量](https://docs.nextacular.co/customization/environment-variables)。

更多详情请阅读[文档](https://docs.nextacular.co)。

### 功能开发指南

本文档旨在指导开发者如何在本项目中添加新的、且受用户订阅计划限制的功能。

#### 工作流程概述

本项目的订阅和支付流程由 [Stripe](https://stripe.com/) 驱动，实现了完全自动化的用户升级和权限变更，无需管理员手动干预。核心流程如下：

1.  **用户支付**：用户在计费页面选择套餐并发起支付。
2.  **Stripe 处理**：用户被重定向到 Stripe 的安全页面完成支付。
3.  **Webhook 通知**：支付成功后，Stripe 向项目后端的 Webhook API (`/api/payments/hooks.js`) 发送通知。
4.  **系统自动更新**：后端接收到通知后，验证并自动更新数据库中用户的 `subscriptionType`。
5.  **权限即时生效**：用户的权限和功能访问权会根据新的订阅计划自动更新。

#### 添加一个新的受限功能（以“数字人”功能为例）

要添加一个新功能并将其纳入订阅系统的管理，请遵循以下三个步骤：

##### 步骤 1: 在订阅规则中定义功能权限

首先，需要明确哪个订阅套餐包含此新功能。

- **文件**: `src/config/subscription-rules/index.js`
- **操作**: 在 `rules` 对象中，为您想授予权限的套餐添加一个功能标志。例如，为 `STANDARD` 和 `PREMIUM` 套餐开启“数字人”功能：
  ```javascript
  [SubscriptionType.STANDARD]: {
    // ...其他规则
    hasAvatarFeature: true, // 新增功能标志
  },
  [SubscriptionType.FREE]: {
    // ...其他规则
    hasAvatarFeature: false, // 未付费用户无此权限
  }
  ```

##### 步骤 2: 在后端 API 实施安全检查

这是最关键的一步，确保未授权用户无法访问功能背后的数据和逻辑。

- **文件**: 对应功能的 API 文件 (例如: `src/pages/api/xiaoice/avatars.js`)
- **操作**: 在处理 API 请求的 `handler` 函数顶部，使用我们提供的权限检查工具 `hasPermission`。

  ```javascript
  import { hasPermission } from '@/lib/server/permissions';

  export default async function handler(req, res) {
    // 检查用户是否有权访问此功能
    const canAccessAvatars = await hasPermission(req, 'hasAvatarFeature');
    if (!canAccessAvatars) {
      // 如果无权访问，返回 403 禁止访问错误
      res.status(403).json({
        error: 'Your current plan does not have access to this feature.',
      });
      return;
    }

    // ...后续的 API 逻辑
  }
  ```

##### 步骤 3: 在前端 UI 中控制显示

为了提供更好的用户体验，如果用户没有权限，我们应该在界面上隐藏或禁用相关的功能入口。

- **文件**: 包含功能入口的布局或页面文件 (例如: `src/layouts/AccountLayout.js`)
- **操作**:

  1.  **获取权限**: 使用 `useSWR` hook 从 `/api/user/permissions` 端点获取当前用户的权限列表。
  2.  **条件渲染**: 在渲染菜单或按钮时，根据获取到的权限标志来决定是否显示。

  ```javascript
  // 在 AccountLayout.js 中
  const { data: permissions, isLoading } = useSWR('/api/user/permissions');

  // ...

  // 过滤菜单项
  const workspaceMenu = menu.find((item) => item.name === 'Workspace');
  if (workspaceMenu) {
    workspaceMenu.menuItems = workspaceMenu.menuItems.filter((item) => {
      if (item.name === '数字人') {
        return permissions.hasAvatarFeature; // 根据权限决定是否显示
      }
      return true;
    });
  }
  ```

遵循以上步骤，您就可以安全、规范地为项目添加更多需要付费解锁的强大功能。

## 核心功能

- 🔐 认证
- 💿 数据库集成 + Prisma (SQL/PostgreSQL)
- 🤝 团队 & 工作区
- ☁️ 多租户架构
- 📜 落地页
- 💸 计费 & 订阅
- 📱 简约设计组件 & 移动端适配
- 🔍 SEO 支持
- 👾 开发者体验
- 💌 邮件处理

## 技术栈

### 主要技术

- [Next.JS](https://nextjs.org) - **15.4.2** (React **19.1.0**)
- [Tailwind CSS](https://tailwindcss.com) - **4.1.11**
- [Prisma](https://prisma.io) - **6.12.0**
- [Vercel](https://vercel.com)

## 依赖项

- Headless UI - 2.2.4
- Hero Icons - 2.2.0
- Date FNS - 4.1.0
- Express Validator - 7.2.1
- Micro - 10.0.1
- Next Themes - 0.4.6
- Nodemailer - 6.10.1
- React Copy to Clipboard - 5.1.0
- React Google Analytics - 3.3.1
- React Hot Toast - 2.5.2
- React Top Bar Progress Indicator - 4.1.1
- Slugify - 1.6.6
- Stripe - 18.3.0
- SWR - 2.3.4
- Validator - 13.15.15

## 使用 Nextacular 构建的项目

查看这些使用 Nextacular 构建的优秀项目:

1. [Nextacular Demo](https://demo.nextacular.co) by Nextacular
2. [Livebic](https://livebic.com/) by Shadrach
3. [Vixion Pro Blogging](https://vixion.pro) by Mina
4. [Living Pupil Homeschool Solutions](https://livingpupilhomeschool.com) by Living Pupil
5. [MyWS](https://myws.dev) by Ruyi (@monoxruyi/@ruyi12)
6. [Trippr AI](https://ai.trippr.travel) by Trippr Tech Inc.
7. [BuzzBonus](https://buzzbonus.tech) by Ram (@rapturt9)
8. [MediumFox](https://mediumfox.com) by CSK (@medfox_73823)

> 如果您的项目也是用 Nextacular 构建的，并希望被列出，请随时通过我们的 Discord 服务器与我们联系。

## 评价

> Steven Tey - Vercel 开发者
> 这对于帮助人们启动他们的 MVP 并更快地推向市场非常有帮助！
>
> **积极的公司使命**、**易于使用**、**成本效益高**、**功能强大**

## 公司赞助商

## Vercel

[![Powered by Vercel](./public/images/powered-by-vercel.svg)](https://vercel.com/?utm_source=nextacular&utm_campaign=oss)

### GitBook - 文档赞助商

[![GitBook](https://www.vectorlogo.zone/logos/gitbook/gitbook-ar21.svg)](https://gitbook.com)

您的公司名称也可以出现在这里。如果您希望成为赞助商，请联系 [teamnextacular@gmail.com](mailto:teamnextacular.com)

## 贡献

想要支持这个项目吗？

1. 考虑从我们的市场购买（即将推出）
2. 订阅我们的新闻通讯。我们会发送一些技巧和工具供您在构建 SaaS 时尝试
3. 如果您代表公司，请考虑成为本仓库的定期赞助商
4. 提交问题和功能建议。Fork 本项目。给它点亮星星。加入讨论
5. 与您的网络分享 Nextacular

> 阅读[贡献指南](CONTRIBUTING.md)

## 许可证

本仓库中的所有代码均根据 [MIT 许可证](LICENSE) 提供

## 支持者 – 特别鸣谢 🎉 谢谢！

请表达您的喜爱和支持，成为我们项目的支持者

[![Open Collective](https://www.vectorlogo.zone/logos/opencollective/opencollective-ar21.svg)](https://opencollective.com/nextacular)

Kaur Kirikall ([@KaurKirikall](https://twitter.com/KaurKirikall)), Brian Roach, Cien Lim, Chris Moutsos, Fred Guth ([@fredguth](https://twitter.com/fredguth)), Maxence Rose ([@pirmax](https://twitter.com/pirmax)) Sandeep Kumar ([@deepsand](https://twitter.com/deepsand)), Justin Harr ([@DasBeasto](https://twitter.com/dasbeasto)), Saket Tawde ([@SaketCodes](https://twitter.com/SaketCodes)), Corey Kellgren, Adarsh Tadimari, Altamir Meister, Abhi Ksinha

## 致谢

🙏 很高兴得到早期采用者和支持者在 [Product Hunt](https://www.producthunt.com/posts/nextacular)、[Gumroad](https://arjayosma.gumroad.com/l/nextacular)、[Github](https://github.com/nextacular/nextacular)、[Twitter](https://twitter.com/nextacular) 以及通过个人电子邮件的支持。未来还有很多计划。感谢大家！
