import fs from 'node:fs';
import path from 'node:path';
import {pluginEnabled,configuration,resolvedPluginSettings,manifest,validateValue} from '../plugin-api/catalog.mjs';
import {billingPeriod,ECONOMY_DEFAULTS,peakToolAllowed} from './billing-time.mjs';
export {PEAK_ECONOMY_POLICY} from './billing-time.mjs';
export function readPeakPolicy(root,key,now=Date.now()){
 if(!pluginEnabled(root,'liangwen-time',key))return {enabled:false,peak:false};
 try{
  const item=manifest(JSON.parse(fs.readFileSync(path.join(root,'plugins/liangwen-time/plugin.json'),'utf8'))),saved=configuration(root).config.plugins['liangwen-time'];
  const settings={...ECONOMY_DEFAULTS,...resolvedPluginSettings(root,item,saved)};
  validateValue(settings,{type:'object',properties:item.configSchema,additionalProperties:false});
  if(![settings.quietStart,settings.quietEnd].every(value=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)))return {enabled:false,peak:false};
  return {...settings,enabled:true,...billingPeriod(now,settings)};
 }catch{return {enabled:false,peak:false};}
}
export function economyToolCheck(root,key,name,override=false,now=Date.now()){
 const policy=readPeakPolicy(root,key,now);return !policy.enabled||!policy.peak||peakToolAllowed(policy,name,override);
}
