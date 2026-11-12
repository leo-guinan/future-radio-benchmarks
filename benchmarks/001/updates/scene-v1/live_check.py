import asyncio,json,time,datetime,argparse
from pathlib import Path
from playwright.async_api import async_playwright
SITE='https://future-radio-computational-treadmill.hitchhiker2thefuture.chatgpt.site';ROOT=Path(__file__).resolve().parent;OUT=ROOT/'live-check.json'
def normalize(value):
 if isinstance(value,dict):return {k:normalize(v) for k,v in value.items() if k!='paymentResponseHeader'}
 if isinstance(value,list):return [normalize(v) for v in value]
 return value
async def main():
 if OUT.exists():raise RuntimeError('Live check already recorded. No automatic real-work retry.')
 report={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'site':SITE,'maximumRealWorkAttempts':1,'maximumHashes':100000,'maximumWorkerMilliseconds':3000,'wallet':'0x005a3560c44e506626a26352466429cc963f9fb7','showPayoutClaimed':False,'status':'started_no_automatic_retry'};OUT.write_text(json.dumps(normalize(report),indent=2)+'\n')
 async with async_playwright() as p:
  browser=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']);page=await browser.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.add_init_script('''window.__workerInfo=[];let W=window.Worker;window.Worker=class extends W{constructor(...args){super(...args);this.info={startedAt:performance.now(),terminated:false,lastProgress:0,solved:false};window.__workerInfo.push(this.info);this.addEventListener('message',e=>{if(e.data.progress)this.info.lastProgress=e.data.progress;if(e.data.solution){this.info.solved=true;this.info.solvedAt=performance.now()}})}postMessage(v){this.info.maxHashes=v.maxHashes;this.info.maxMilliseconds=v.maxMilliseconds;super.postMessage(v)}terminate(){this.info.terminated=true;this.info.terminatedAt=performance.now();super.terminate()}};''')
  actions=[];blocked=0
  async def guard(route):
   nonlocal blocked
   action=route.request.post_data_json['action'];actions.append(action)
   if action=='challenge' and actions.count('challenge')>1:blocked+=1;await route.abort();return
   await route.continue_()
  await page.route('**/api/contribution',guard)
  await page.goto(SITE);await page.wait_for_function("performance.getEntriesByType('resource').some(e=>e.name.endsWith('/chapters.json'))");switch=page.get_by_role('switch',name='Contribute Quai to Future Radio');await switch.wait_for();report['ledgerBefore']=await page.evaluate("async()=>await(await fetch('/api/ledger',{cache:'no-store'})).json()")
  await page.get_by_role('button',name='Play episode',exact=True).click();await page.wait_for_timeout(1000);report['workersBeforeOn']=await page.evaluate('window.__workerInfo.length');assert report['workersBeforeOn']==0
  report['audioStartSeconds']=await page.locator('audio').evaluate('(a)=>a.currentTime');began=time.monotonic();await switch.click();phases=[]
  for _ in range(160):
   await page.wait_for_timeout(150);phase=await page.locator('.robot-bubble').inner_text()
   if not phases or phases[-1]!=phase:phases.append(phase)
   if phase in ['TAKING A BREATHER','RECONNECTING','OFF DUTY']:break
  report['observedWorkIntervalSeconds']=round(time.monotonic()-began,3);report['phaseSequenceObserved']=phases;report['outcome']=await page.locator('[role=status]').inner_text();report['sessionReceipts']=int(await page.locator('.receipt-number').inner_text());report['audioEndSeconds']=await page.locator('audio').evaluate('(a)=>a.currentTime');report['audioStillPlaying']=await page.locator('audio').evaluate('(a)=>!a.paused')
  if await switch.get_attribute('aria-checked')=='true':await switch.click()
  await page.wait_for_timeout(6500);report['offStopsRobot']=await page.locator('.radio-room').get_attribute('data-mining')=='false';report['switchOff']=await switch.get_attribute('aria-checked')=='false';report['workerInfo']=await page.evaluate('window.__workerInfo');report['workActions']=actions;report['extraChallengeRequestsBlocked']=blocked;report['pageErrors']=errors
  report['ledgerAfter']=await page.evaluate("async()=>await(await fetch('/api/ledger',{cache:'no-store'})).json()");await page.screenshot(path=str(ROOT/'live-page.png'),full_page=True)
  report['actualMiningPerformed']=len(report['workerInfo'])>0;report['actualMiningRewards']='unreconciled';report['status']='one_capped_check_completed';OUT.write_text(json.dumps(normalize(report),indent=2)+'\n');await browser.close()
 assert len(report['workerInfo'])<=1 and actions.count('challenge')==1,report['workActions']
 assert all(w['maxHashes']<=100000 and w['maxMilliseconds']<=3000 and w['terminated'] for w in report['workerInfo'])
 assert report['offStopsRobot'] and report['switchOff'] and not errors
 print(json.dumps({k:report[k] for k in ['status','actualMiningPerformed','outcome','phaseSequenceObserved','sessionReceipts','audioStartSeconds','audioEndSeconds','audioStillPlaying','offStopsRobot','workActions','workerInfo','pageErrors']}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--allow-real-work',action='store_true');args=parser.parse_args()
 if not args.allow_real_work:parser.error('Live work requires explicit --allow-real-work; the recorded check is not automatically repeated.')
 asyncio.run(main())
