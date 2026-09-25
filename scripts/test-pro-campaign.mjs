import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {campaignMarket,startCampaignBanner} from '../assets/pro-campaign.js';
const start = Date.parse('2026-09-25T00:00:00Z');
const valid = {schemaVersion:1,campaignID:'pro-3-0-launch',enabled:true,productID:'com.dusttocosmos.app.pro',minimumAppVersion:'3.0',startsAt:'2026-09-25T00:00:00Z',endsAt:'2026-10-12T00:00:00Z',markets:[{storefront:'KOR',currency:'KRW',price:'9900',regularPrice:'14900',timeZone:'Asia/Seoul'}]};
test('exact shared launch window, independent of browser installation', () => {
 assert.equal(campaignMarket(valid,'KOR',start-1),null);
 assert.ok(campaignMarket(valid,'KOR',start));
 assert.ok(campaignMarket(valid,'KOR',start+17*86400000-1));
 assert.equal(campaignMarket(valid,'KOR',start+17*86400000),null);
});
test('inactive, unknown storefront, malformed date, false discounts and duplicate markets stay hidden', () => {
 for(const patch of [{enabled:false},{startsAt:null},{endsAt:'not-a-date'},{endsAt:valid.startsAt},{productID:'other'},{minimumAppVersion:'4.0'},{markets:[valid.markets[0],valid.markets[0]]},{markets:[{...valid.markets[0],regularPrice:'9000'}]},{markets:[{...valid.markets[0],timeZone:'not-a-zone'}]}])assert.equal(campaignMarket({...valid,...patch},'KOR',start),null);
 assert.equal(campaignMarket(valid,'USA',start),null);
});
test('published campaign uses the approved fixed October 12 UTC deadline', async () => {
 const c = JSON.parse(await readFile(new URL('../assets/pro-launch-campaign.json',import.meta.url)));
 assert.equal(c.endsAt,'2026-10-12T00:00:00Z');assert.ok(campaignMarket(c,'KOR',Date.parse(c.startsAt)));assert.equal(campaignMarket(c,'KOR',Date.parse(c.endsAt)),null);
});

test('real banner renders from server time, rejects failures, and clears on background', async () => {
 const listeners = new Map();
 globalThis.document = {hidden:false,documentElement:{lang:'ko'},addEventListener:(n,fn)=>listeners.set(n,fn),removeEventListener:n=>listeners.delete(n)};
 const fields = new Map();
 const element = {hidden:true,querySelector:s=>{if(!fields.has(s))fields.set(s,{textContent:''});return fields.get(s);}};
 const response = () => new Response(JSON.stringify(valid), {status:200,headers:{'Content-Type':'application/json','Date':new Date(start+1000).toUTCString()}});
 const settle = () => new Promise(resolve=>setImmediate(resolve));
 let stop = startCampaignBanner(element,{fetcher:async()=>response(),tick:()=>100});
 await settle(); assert.equal(element.hidden,false);
 assert.match(fields.get('[data-campaign-title]').textContent,/출시 기념/);
 assert.match(fields.get('[data-campaign-end]').textContent,/한국시간/);
 assert.doesNotMatch(fields.get('[data-campaign-note]').textContent,/9,900/);
 document.hidden=true;listeners.get('visibilitychange')();assert.equal(element.hidden,true);stop();
 document.hidden=false;
 for(const fetcher of [async()=>{throw Error('offline')},async()=>new Response('<html>oops</html>'),async()=>new Response(JSON.stringify(valid),{headers:{'Content-Type':'application/json','Date':new Date(start).toUTCString(),'Age':'3600'}})]) {
   stop=startCampaignBanner(element,{fetcher,tick:()=>100});await settle();assert.equal(element.hidden,true);stop();
 }
 delete globalThis.document;
});
