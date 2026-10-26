import test from 'node:test';
import assert from 'node:assert/strict';
import {billingPeriod,peakToolAllowed,ECONOMY_DEFAULTS,explicitPeakOverride} from '../billing-time.mjs';
test('Beijing billing and Toronto DST',()=>{assert.equal(billingPeriod(Date.parse('2026-10-27T01:00Z')).peak,true);assert.equal(billingPeriod(Date.parse('2026-10-27T04:00Z')).peak,false);assert.match(billingPeriod(Date.parse('2026-10-27T01:00Z')).localTime,/21:00/);assert.match(billingPeriod(Date.parse('2026-11-03T01:00Z')).localTime,/20:00/);});
test('weekends and known holidays',()=>{for(const date of ['2026-10-31T01:00Z','2026-10-01T01:00Z'])assert.equal(billingPeriod(Date.parse(date)).peak,false);});
test('pause expensive tools, keep local gallery',()=>{assert.equal(peakToolAllowed(ECONOMY_DEFAULTS,'bili_frames'),false);assert.equal(peakToolAllowed(ECONOMY_DEFAULTS,'web_reader_read'),false);assert.equal(peakToolAllowed(ECONOMY_DEFAULTS,'wechat_meme_search'),true);});
test('only an explicit current message overrides',()=>{assert.equal(explicitPeakOverride([{text:'峰时照常执行：查视频'}],ECONOMY_DEFAULTS),true);assert.equal(explicitPeakOverride([{text:'他说峰时照常执行'}],ECONOMY_DEFAULTS),false);assert.equal(explicitPeakOverride([{text:'峰时照常执行',forwardedRecord:{}}],ECONOMY_DEFAULTS),false);});
