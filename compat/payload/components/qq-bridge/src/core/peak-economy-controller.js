import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {billingPeriod,inQuietHours,explicitPeakOverride} from '../../../../packages/dsh-social-bridge-plugin/billing-time.mjs';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const confirmed=value=>value?.confirmed===true||value?.delivered==='database-confirmed'||value?.accepted===true&&value?.response?.data?.receipt==='wechat-server-id';
export class PeakEconomyController{
 constructor({stateFile,policyFor,send,isReady=()=>true,now=Date.now,onSent=()=>{},log=()=>{}}){
  Object.assign(this,{stateFile,policyFor,send,isReady,now,onSent,log});this.busy=false;
  this.state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):{version:1,chats:{}};
  if(this.state.version!==1||!this.state.chats||Array.isArray(this.state.chats))throw Error('Invalid economy state; original file retained');
 }
 save(){fs.mkdirSync(path.dirname(this.stateFile),{recursive:true});const temporary=this.stateFile+'.tmp';fs.writeFileSync(temporary,JSON.stringify(this.state));fs.renameSync(temporary,this.stateFile);}
 policy(key){const value=this.policyFor(key,this.now());return value.enabled?{...value,...billingPeriod(this.now(),value)}:value;}
 async notice(key,item,kind,policy){
  if(!this.isReady()||!policy[kind==='peak'?'peakNotice':'valleyNotice'])return;
  const identity=kind+':'+(kind==='peak'?policy.peakId:item.pendingValley),deliveryId=hash(key+'\0liangwen-time\0'+identity);
  if(item.receipts?.includes(deliveryId)||(item.retryAt??0)>this.now())return;
  const text=kind==='peak'?`现在是梁文峰时间，省钱模式已开启。${policy.localTime}（${policy.timeZone}），下一段谷时：${policy.nextLocal}。${policy.groupMode==='normal'&&policy.privateMode==='normal'?'聊天频率保持设置。':`回复按峰时设置处理，限流聊天每 ${policy.intervalMinutes} 分钟合并一轮。`}${policy.blockBilibili||policy.blockWeb?'部分B站／网页工具暂缓。':''}${policy.allowOverride?'确实急用可说“峰时照常执行：具体任务”。':''}`:
   `现在是梁文谷时间，可以放心聊、按原权限使用工具啦。${policy.localTime}（${policy.timeZone}）。已恢复正常回复和工具权限；谷时仍按量收费，单价是峰时的一半。`;
  item.retryAt=this.now()+30000;this.save();
  try{
   const result=await this.send(item.message,text,{deliveryId});
   if(confirmed(result)){item.receipts=[...(item.receipts??[]),deliveryId].slice(-16);if(kind==='valley')delete item.pendingValley;delete item.retryAt;this.save();this.onSent(key,item.message,text,deliveryId,this.now());}
  }catch{this.log('[Economy] reminder deferred for '+key);}
 }
 async beforeDecision(key,message,rows,direct){
  const policy=this.policy(key);if(!policy.enabled)return {action:'allow',override:false};
  const item=this.state.chats[key]??={receipts:[]};item.message={platform:message.platform,kind:message.kind,conversation_id:String(message.conversation_id),self_id:String(message.self_id??''),conversation_name:String(message.conversation_name??message.conversation_id),sender_id:'local-cost-reminder'};
  if(!policy.peak){if(item.pendingValley)await this.notice(key,item,'valley',policy);return {action:'allow',override:false};}
  item.pendingValley=policy.peakId;item.lastActivity=this.now();this.save();await this.notice(key,item,'peak',policy);
  const override=explicitPeakOverride(rows,policy);if(override)return {action:'allow',override:true,peak:true,shortReplies:policy.shortReplies};
  const mode=message.kind==='group'?policy.groupMode:policy.privateMode;
  if(mode==='paused'||mode==='mention'&&!direct)return {action:'skip',override:false};
  if(mode!=='normal'&&(item.lastModelAt??0)+policy.intervalMinutes*60000>this.now())return {action:'defer',retryAt:item.lastModelAt+policy.intervalMinutes*60000,override:false};
  item.lastModelAt=this.now();this.save();return {action:'allow',override:false,peak:true,shortReplies:policy.shortReplies};
 }
 async tick(){
  if(this.busy||!this.isReady())return;this.busy=true;
  try{for(const [key,item]of Object.entries(this.state.chats)){
   if(!item.pendingValley)continue;const policy=this.policy(key);
   if(!policy.enabled||!policy.valleyNotice){delete item.pendingValley;this.save();continue;}
   if(this.now()-(item.lastActivity??0)>86400000){delete item.pendingValley;this.save();continue;}
   if(!policy.peak&&!inQuietHours(this.now(),policy))await this.notice(key,item,'valley',policy);
  }}finally{this.busy=false;}
 }
}
