# 梁文峰／梁文谷 · WeChatAgent 峰谷省钱

作者：**bb王zyx**（B站同名）。Windows，WeChatAgent **0.4.1配套版**，不是官方插件。峰时在模型调用之前限流微信消息、暂停指定工具，谷时恢复；固定提醒不调用模型。

## 安装

请分享 **bundle.zip**，只导入 `plugin.zip` 不能提供宿主控制能力。

1. 先跑通WeChatAgent0.4.1、DSH和匹配版微信。从托盘退出WeChatAgent与DSH，保持微信登录。
2. 解压bundle，PowerShell进入解压目录，预览兼容性：

   ```powershell
   .\Install.ps1 -WeChatAgentPath 'C:\Apps\WeChatAgent'
   ```

3. 检查通过后加`-Apply`安装：

   ```powershell
   .\Install.ps1 -WeChatAgentPath 'C:\Apps\WeChatAgent' -Apply
   ```

   请替换为自己的安装目录。安装器核对版本、源文件SHA256与包内校验，冲突就停止；同步工作区与启动模板。备份在 `data/workspace/state/local-patches/liangwen-time/`，不替换账号配置、人格、聊天和记忆。
4. 重开WeChatAgent、DSH，在WeChatAgent插件页导入bundle里的`plugin.zip`，选择聊天与权限，启用。确认“已生效”且宿主支持`peak-economy-v1`。`status`动作只读查看时段，不发微信。

只对0.4.1已知代码做过检查与本机验证，尚未在第二台电脑完成端到端验收。其他版本不能忽略兼容性提示强行覆盖；主程序升级后需重新核对。

## 设置

14项：提醒时区、群聊模式、私聊模式、回复间隔、暂停主动聊天、暂停B站工具、暂停网页工具、峰时提醒、谷时提醒、免打扰开始／结束、单轮放行、短回复、补充中国节假日。

默认峰时只回应群里的@／唤醒词，私聊合并回复，每个聊天5分钟准入一轮模型，模型选择沉默也占间隔。普通群消息跳过模型但保留历史；也可选择完全暂停或保持原频率。

明确以 `峰时照常执行：具体任务` 开头可单轮放行，不提升原权限；引用／转发不能触发，可关闭。提醒每聊天每段时段去重，重启保留；谷时主动提醒默认避开所选时区02:00–09:00，结束后补发。用户主动聊天时可即时告知；只提醒上一段峰时有互动的聊天。

## 计费与边界

[官方定价](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)，2026-10-26核对：北京时间工作日09:00–12:00、14:00–18:00为峰时，中国节假日除外，其余为谷时。谷时单价一半，仍按量收费。显示用IANA时区自动处理多伦多夏令时。

内置2026中国休假表，依据[国务院通知](https://www.beijing.gov.cn/cs/gncs/zcwj/202603/t20260327_4568275.html)。未来年份需补日期或升级；不自动猜假期或保证未来定价不变。

只管已授权微信聊天与微信主动发言，不管独立DSH刷B站或其他软件。短回复是模型指令，不是硬token上限；一轮可能含格式修复／工具往返。电脑睡眠或后台退出时不运行，恢复后按当前时段处理。

## 关闭、还原与开发

关闭插件恢复原聊天策略。移除宿主修改前退出WeChatAgent与DSH，再运行：

```powershell
.\Install.ps1 -WeChatAgentPath 'C:\Apps\WeChatAgent' -RestoreBackup 'C:\Apps\WeChatAgent\data\workspace\state\local-patches\liangwen-time\实际备份目录'
```

发现后续改动会拒绝覆盖，保留备份。Node22.13+，无npm依赖，`npm test`。源码不含账号、token、Cookie或聊天。配套源文件在`compat/payload`，不是给任意插件开放修改宿主的权限。来源见`NOTICE.md`与`licenses/`。
