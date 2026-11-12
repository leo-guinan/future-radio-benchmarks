import asyncio,json,sys
from pathlib import Path
from PIL import Image,ImageDraw
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'render-studio/tools'))
from common import ensure_built,start_server,open_studio
async def main():
    ensure_built(ROOT/'render-spec-v1.json');base=start_server()
    spec=json.loads((ROOT/'render-spec-v1.json').read_text());out=ROOT/'review-stills';out.mkdir(exist_ok=True)
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        page,errors=await open_studio(browser,base,scene='episode',export=True)
        if errors:raise RuntimeError(errors)
        report=await page.evaluate('''()=>{const a=JSON.stringify(window.__dl.dump());window.__dl.setScene('episode');const b=JSON.stringify(window.__dl.dump());return{deterministic:a===b,denied:window.__dl.LOG().filter(e=>e.result==='denied'),mismatches:window.__dl.stateAt(1e6).mismatch,events:window.__dl.LOG().length,fonts:[document.fonts.check('600 20px "Shantell Sans"'),document.fonts.check('14px "IBM Plex Mono"')]}}''')
        assert report['deterministic'];assert not report['denied'],report['denied'];assert not report['mismatches'],report['mismatches']
        await page.add_style_tag(content='.sub{bottom:5%;padding-inline:12%}.sub span{font-size:25px;line-height:1.4;max-width:980px}')
        files=[]
        for scene in spec['benchmarkScenes']:
            times=[scene['start']+4.1,scene['dialogueStart']+2,(scene['dialogueStart']+scene['end'])/2]
            for t in times:
                await page.evaluate('(t)=>window.__dl.seek(t)',t)
                f=out/f'{t:07.2f}.png';await page.screenshot(path=str(f),clip={'x':0,'y':0,'width':1280,'height':720});files.append((f,t))
        (ROOT/'renderer-operation-log.json').write_text(json.dumps(await page.evaluate('window.__dl.dump()'),ensure_ascii=False,indent=2)+'\n')
        await browser.close()
    sheet=Image.new('RGB',(1440,294*9),'#211d18');draw=ImageDraw.Draw(sheet)
    for i,(path,t) in enumerate(files):
        im=Image.open(path).resize((480,270));x=(i%3)*480;y=(i//3)*294;sheet.paste(im,(x,y));draw.text((x+8,y+274),f'{t:.2f} s',fill='white')
    sheet.save(out/'contact.png');(ROOT/'visual-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
asyncio.run(main())
