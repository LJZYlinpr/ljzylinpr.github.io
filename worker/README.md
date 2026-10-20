# 访客服务

主页为 GitHub Pages 静态站点，访客计数需要单独部署此 Cloudflare Worker + D1。未配置时主页显示未连接状态，不制造统计数字。只统计主页；IP 仅在当前访问者的响应中返回，数据库仅保存 HMAC 标识、首次国家、访问次数和最后计数时间。地区来自 Cloudflare 网络定位，不是 GPS。

## 启用

在本目录执行：

```bash
npm install
npx wrangler login
npx wrangler d1 create peiran-visitors
```

将返回的数据库 ID 写入 `wrangler.toml` 的 `database_id`。核对 `ALLOWED_ORIGINS` 为实际站点来源（无末尾斜杠），然后：

```bash
npx wrangler d1 migrations apply peiran-visitors --remote
npx wrangler secret put IP_HASH_SECRET
npm run deploy
```

Secret 使用密码管理器生成的至少 32 字符随机字符串；不要提交到 Git。将部署得到的 HTTPS Worker 根地址填入站点 `_config.yml` 的 `visitor_api_url`，重新构建站点。

## 本地验证

```bash
npm test
npx wrangler d1 migrations apply peiran-visitors --local
npx wrangler dev
```

本地 secret 放在已忽略的 `.dev.vars`，格式 `IP_HASH_SECRET="至少32字符的测试值"`。本地 Worker 的 IP/地区可能缺失；生产数据必须通过 Cloudflare 边缘访问才能验证。可用 curl 的 `CF-Connecting-IP` 测试本地计数，生产以 Cloudflare 提供的请求信息为准。

## 统计口径

- `Visits · 30-min window` 为计数窗口内去重的主页访问：同一 IP 30 分钟内刷新不会增加计数。
- `Unique visitors` 是按 IP HMAC 去重的网络数量估计，不等于实际人数；共享网络、VPN 和动态 IP 均会影响结果。
- 国家分布以某个网络首次访问所在国家统计，只公开前八个国家的汇总。
- 尊重 DNT / GPC；退出统计仍可查看自己的 IP 与已有汇总。
- CORS 限制浏览器来源，但不阻止伪造请求。该公开计数用于个人主页展示，不能视为审计级指标。可在 Cloudflare 为此路由设置限速以减少滥用。
- 不启用请求正文或 IP 日志；如果自行启用平台日志，需另行管理其访问权限与保留期。修改 hash secret 会改变去重标识，需同步考虑重置统计。

参考：[Cloudflare 请求地理信息](https://developers.cloudflare.com/workers/runtime-apis/request/)、[客户端 IP](https://developers.cloudflare.com/fundamentals/reference/http-headers/)、[D1 批处理](https://developers.cloudflare.com/d1/worker-api/d1-database/)。
