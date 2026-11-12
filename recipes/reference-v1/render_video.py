"""Capture the existing studio canvas at 30fps; source captions drawn on that canvas.
Canvas transfer avoids screenshot compositor latency. No engine operations change.
"""
import argparse,asyncio,base64,json,subprocess,sys,time,math
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'render-studio/tools'))
from common import ensure_built,start_server,open_studio
async def main(start=0,end=None,sample=False):
    spec=json.loads((ROOT/'render-spec-v1.json').read_text());end=end or spec['duration'];ensure_built(ROOT/'render-spec-v1.json');base=start_server()
    out=ROOT/('style-sample.mp4' if sample else 'video-silent.mp4');n=math.ceil((end-start)*30);began=time.monotonic()
    async with async_playwright() as pw:
        browser=await pw.chromium.launch();page,errors=await open_studio(browser,base,scene='episode',export=True)
        assert not errors,errors
        await page.evaluate('''() => {window.__capture=(times)=>times.map(t=>{window.__dl.seek(t);const canvas=document.querySelector('#cv'),ctx=canvas.getContext('2d');const spec=window.__FR_EPISODE_SPEC__;const cap=spec.captions.find(c=>t>=c.start&&t<c.end);if(cap){ctx.save();ctx.setTransform(1,0,0,1,0,0);const scale=canvas.width/1280;ctx.scale(scale,scale);ctx.font='600 24px monospace';const label=cap.speaker+': '+cap.text;const words=label.split(' ');let lines=[],line='';for(const word of words){if(ctx.measureText(line+' '+word).width>1050){lines.push(line);line=word}else line+=(line?' ':'')+word;}if(line)lines.push(line);const y=671-lines.length*15;ctx.fillStyle='rgba(24,29,32,.88)';ctx.fillRect(78,y-25,1124,lines.length*31+16);ctx.fillStyle='#fff5de';ctx.textAlign='center';lines.forEach((v,i)=>ctx.fillText(v,640,y+i*31));ctx.restore();}return canvas.toDataURL('image/jpeg',.93).split(',')[1]});}''')
        ff=subprocess.Popen(['ffmpeg','-y','-v','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',str(out)],stdin=subprocess.PIPE)
        for i in range(0,n,12):
            frames=await page.evaluate('(times)=>window.__capture(times)',[start+j/30 for j in range(i,min(i+12,n))])
            for data in frames:ff.stdin.write(base64.b64decode(data))
            if i%900==0:print(f'frame {i}/{n}; elapsed {time.monotonic()-began:.1f}s',flush=True)
        ff.stdin.close();assert ff.wait()==0
        log=await page.evaluate('window.__dl.dump()');(ROOT/'renderer-operation-log.json').write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n')
        assert not errors,errors;await browser.close()
    if sample:
        dest=ROOT/'style-sample-with-audio.mp4'
        subprocess.run(['ffmpeg','-y','-v','error','-i',str(out),'-ss',str(start),'-i',str(ROOT/'release-v1/the-benchmark-episode.wav'),'-map','0:v','-map','1:a','-t',str(end-start),'-c:v','copy','-c:a','aac','-b:a','192k',str(dest)],check=True)
    else:
        subprocess.run(['ffmpeg','-y','-v','error','-i',str(out),'-i',str(ROOT/'release-v1/the-benchmark-episode.wav'),'-i',str(ROOT/'chapters.ffmetadata'),'-map','0:v','-map','1:a','-map_metadata','2','-map_chapters','2','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',str(ROOT/'release-v1/the-benchmark-episode.mp4')],check=True)
    (ROOT/('sample-render-metrics.json' if sample else 'video-render-metrics.json')).write_text(json.dumps({'frameCount':n,'fps':30,'width':1280,'height':720,'wallSeconds':time.monotonic()-began,'method':'Existing deterministic studio renderer with direct canvas frame capture; timed caption overlay; no drawing Foley added to standalone radio master.'},indent=2)+'\n')
    print(str(out),flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--sample',action='store_true');a=p.parse_args();asyncio.run(main(3,13.5,True) if a.sample else main())
