import {billingPeriod,ECONOMY_DEFAULTS} from './billing-time.mjs';
export function setup(api){
 api.registerAction({id:'status',description:'查看当前梁文峰／梁文谷时段和配置，不调用模型、不发送微信。',parameters:{type:'object',properties:{},additionalProperties:false},execute:ctx=>{
  const settings={...ECONOMY_DEFAULTS,...ctx.config()},status=billingPeriod(Date.now(),settings);
  return {period:status.peak?'梁文峰':'梁文谷',localTime:status.localTime,nextChange:status.nextLocal,timeZone:settings.timeZone,calendarKnown:status.calendarKnown,source:status.source,settings,notice:'谷时仍按量收费；后台限流需要 peak-economy-v1 宿主接口。'};
 }});
}
