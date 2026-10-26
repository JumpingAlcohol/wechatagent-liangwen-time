// DeepSeek official pricing, checked 2026-10-26. Billing uses Beijing dates,
// while display and quiet hours use the user's IANA timezone.
export const PRICE_SOURCE='https://api-docs.deepseek.com/zh-cn/quick_start/pricing/';
export const HOLIDAY_SOURCE='https://www.beijing.gov.cn/cs/gncs/zcwj/202603/t20260327_4568275.html';
const holidays2026=[['01-01','01-03'],['02-15','02-23'],['04-04','04-06'],['05-01','05-05'],['06-19','06-21'],['09-25','09-27'],['10-01','10-07']];
export const PEAK_ECONOMY_POLICY=Symbol.for('wechatagent.peak-economy.v1');
export const ECONOMY_DEFAULTS=Object.freeze({timeZone:'America/Toronto',groupMode:'mention',privateMode:'throttle',intervalMinutes:5,pauseProactive:true,blockBilibili:true,blockWeb:true,peakNotice:true,valleyNotice:true,quietStart:'02:00',quietEnd:'09:00',allowOverride:true,shortReplies:true,holidayDates:''});
export function localClock(now,timeZone='America/Toronto'){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),value=type=>parts.find(part=>part.type===type).value;
 return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}`;
}
function period(now,settings){
 const date=new Date(now+8*3600000),day=date.toISOString().slice(0,10),week=date.getUTCDay(),minute=date.getUTCHours()*60+date.getUTCMinutes();
 const holiday=day.startsWith('2026-')&&holidays2026.some(([from,to])=>day.slice(5)>=from&&day.slice(5)<=to)||String(settings.holidayDates??'').split(/[\s,，;；]+/).includes(day);
 const peak=week>=1&&week<=5&&!holiday&&(minute>=540&&minute<720||minute>=840&&minute<1080);
 return {peak,day,peakId:peak?day+':'+(minute<720?'09':'14'):null,holiday,calendarKnown:day.startsWith('2026-')};
}
export function billingPeriod(now=Date.now(),settings={}){
 settings={...ECONOMY_DEFAULTS,...settings};const current=period(now,settings);let nextAt=Math.floor(now/3600000)*3600000+3600000;
 for(let i=0;i<240&&period(nextAt,settings).peak===current.peak;i++)nextAt+=3600000;
 return {...current,nextAt,localTime:localClock(now,settings.timeZone),nextLocal:localClock(nextAt,settings.timeZone),source:PRICE_SOURCE};
}
export function inQuietHours(now,settings){
 const from=settings.quietStart,to=settings.quietEnd;if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(from)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(to)||from===to)return false;
 const time=localClock(now,settings.timeZone).slice(-5);return from<to?time>=from&&time<to:time>=from||time<to;
}
export function explicitPeakOverride(rows,settings){
 if(!settings.allowOverride)return false;
 const row=rows.findLast(row=>!row.outgoing);return !!row&&!row.forwardedRecord&&!row.quoteReply&&!row.interaction&&/^(?:@\S+\s+)?峰时照常执行(?:\s|[：:，,]|$)/.test(String(row.text??'').trim());
}
export function peakToolAllowed(settings,name,override=false){
 if(override&&settings.allowOverride)return true;
 if(settings.blockBilibili&&/(?:^|[_-])bili(?:[_-]|$)|bilibili/i.test(name))return false;
 if(settings.blockWeb&&/^(?:wechat_)?web[_-]|(?:^|__)web[_-]|^(?:search|fetch|browse|browser)(?:[_-]|$)/i.test(name))return false;
 return true;
}
