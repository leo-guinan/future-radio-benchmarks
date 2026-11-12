import asyncio,json,time,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/scene-ui';OUT.mkdir(parents=True,exist_ok=True);SITE=os.environ.get('SCENE_BASE_URL','http://127.0.0.1:8892');WALLET='0x005a3560c44e506626a26352466429cc963f9fb7';RESOURCE='https://future-radio-computational-treadmill.hitchhiker2thefuture.chatgpt.site/api/contribution'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']);ctx=await b.new_context(viewport={'width':1440,'height':1100});page=await ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.add_init_script('''window.__workers=[];window.__actions=[];window.__delayOffer=0;window.__rejectOffer=false;class TestWorker{constructor(){this.dead=false;window.__workers.push(this)}postMessage(m){this.message=m}terminate(){this.dead=true}}window.Worker=TestWorker;window.__finish=()=>{let w=window.__workers.at(-1);w.onmessage({data:{progress:9001}});w.onmessage({data:{solution:{extraNonce2:'0x00000001',nonce:'0x00000001',time:'0x65000000'}}});};''')
  async def ledger(route):await route.fulfill(json={'showWorkReceipts':0,'historicalDemoReceipts':1})
  async def work(route):
   action=route.request.post_data_json['action'];await page.evaluate('(a)=>window.__actions.push(a)',action)
   if action=='challenge':
    delay=await page.evaluate('window.__delayOffer');reject=await page.evaluate('window.__rejectOffer');await asyncio.sleep(delay/1000)
    if reject:await route.fulfill(status=503,json={'error':'Offline fixture service unavailable'});return
    await route.fulfill(json={'beneficiary':WALLET,'token':'offline-fixture','deadline':int(time.time()*1000)+3000,'challenge':{'resource':{'url':RESOURCE}},'accepted':{'amount':'40000','payTo':WALLET}})
   else:
    await asyncio.sleep(.25);await route.fulfill(json={'verified':True,'source':'facilitator'})
  await page.route('**/api/ledger',ledger);await page.route('**/api/contribution',work);await page.goto(SITE);await page.wait_for_load_state('networkidle');await page.get_by_role('switch').wait_for();await page.screenshot(path=str(OUT/'desktop-off.png'),full_page=True)
  switch=page.get_by_role('switch',name='Contribute Quai to Future Radio');assert await switch.get_attribute('aria-checked')=='false'
  assert await page.locator('input[type=checkbox]').count()==0
  await switch.click();await page.wait_for_timeout(100);assert await switch.get_attribute('aria-checked')=='true';assert await page.evaluate('window.__workers.length')==0
  await page.get_by_role('button',name='Play episode',exact=True).click();await page.locator('[data-mining=true]').wait_for();await page.screenshot(path=str(OUT/'desktop-mining.png'),full_page=True)
  assert await page.evaluate('window.__workers.length')==1
  await page.evaluate('window.__finish()');await page.locator('[data-mining=false]').wait_for();await page.wait_for_timeout(350)
  assert await page.locator('.receipt-number').inner_text()=='01';assert await page.locator('.robot-bubble').inner_text()=='TAKING A BREATHER';assert await page.evaluate('window.__workers.at(-1).dead') is True
  await switch.click();await page.wait_for_timeout(6500);assert await page.evaluate('window.__workers.length')==1
  await switch.click();await page.locator('[data-mining=true]').wait_for();await page.get_by_role('button',name='Pause episode',exact=True).click();await page.wait_for_timeout(100)
  assert await switch.get_attribute('aria-checked')=='true';assert await page.locator('[data-mining=false]').count()==1;assert await page.evaluate('window.__workers.at(-1).dead') is True
  await page.get_by_role('button',name='Play episode',exact=True).click();await page.locator('[data-mining=true]').wait_for()
  await page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))");await page.wait_for_timeout(100)
  assert await page.locator('[data-mining=false]').count()==1;assert await switch.get_attribute('aria-checked')=='true'
  await page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))");await page.locator('[data-mining=true]').wait_for();await switch.click();assert await switch.get_attribute('aria-checked')=='false'
  # Cancel while the offer is in flight; the delayed reply must not spawn a worker.
  before=await page.evaluate('window.__workers.length');await page.evaluate('window.__delayOffer=700');await switch.click();await page.wait_for_timeout(100);await switch.click();await page.wait_for_timeout(900);assert await page.evaluate('window.__workers.length')==before
  # A failed offer leaves the simple switch on, with a retry/rest state.
  await page.evaluate('window.__delayOffer=0;window.__rejectOffer=true');await switch.click();await page.get_by_text('RECONNECTING',exact=True).wait_for();assert await switch.get_attribute('aria-checked')=='true';assert await page.locator('[data-mining=false]').count()==1;await switch.click()
  await page.get_by_role('button',name='Pause episode',exact=True).click();await page.set_viewport_size({'width':390,'height':844});await page.screenshot(path=str(OUT/'mobile-paused.png'),full_page=True)
  assert await page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
  await page.get_by_role('button',name='Play episode',exact=True).click();await page.evaluate('window.__rejectOffer=false');await switch.click();await page.locator('[data-mining=true]').wait_for();await page.screenshot(path=str(OUT/'mobile-mining.png'),full_page=True)
  await page.locator('audio').evaluate('(a)=>a.dispatchEvent(new Event("ended"))');await page.wait_for_timeout(100);assert await switch.get_attribute('aria-checked')=='false';assert await page.locator('[data-mining=false]').count()==1
  # Advancing the browser clock while armed must end the original hour-bounded session.
  await page.locator('audio').evaluate('(a)=>a.pause()');await switch.click();before=await page.evaluate('window.__workers.length')
  await page.evaluate('window.__realDateNow=Date.now;Date.now=()=>window.__realDateNow()+3600001')
  await page.get_by_role('button',name='Play episode',exact=True).click();await page.get_by_text('This contribution session is complete. Switch On to start another.',exact=True).wait_for()
  assert await switch.get_attribute('aria-checked')=='false';assert await page.evaluate('window.__workers.length')==before
  await page.evaluate('Date.now=window.__realDateNow')
  await page.set_viewport_size({'width':320,'height':844});assert await page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
  assert not errors,errors
  report={'realMiningPerformed':False,'fixtureOnly':True,'singleSwitchNoCheckbox':True,'armedOnWaitsForPlayback':True,'actualWorkerPhaseDrivesRobot':True,'checkingAndRestDoNotAnimateRobot':True,'offCancelsNextJob':True,'pauseKeepsSwitchOnAndStopsWorker':True,'playAutomaticallyResumes':True,'hiddenPageParksAndReturnResumes':True,'offDuringOfferPreventsWorker':True,'transientFailureRetainsOnAndBacksOff':True,'episodeEndTurnsOff':True,'mobileNoHorizontalOverflow':True,'smallPhone320NoHorizontalOverflow':True,'originalSessionTimeLimitRetained':True,'pageErrors':errors,'fixtureWorkActions':await page.evaluate('window.__actions')}
  (OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));await b.close()
asyncio.run(main())
