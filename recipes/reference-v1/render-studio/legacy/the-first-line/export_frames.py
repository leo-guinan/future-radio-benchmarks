import asyncio, json, subprocess, sys
from playwright.async_api import async_playwright
FPS=30
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pg=await b.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file:///home/claude/first-line/index.html#export')
        await pg.wait_for_timeout(1500)
        fonts=await pg.evaluate("[document.fonts.check('600 20px \"Shantell Sans\"'),document.fonts.check('14px \"IBM Plex Mono\"')]")
        print('fonts',fonts,'errs',errs,flush=True)
        T=await pg.evaluate("window.__T_END")
        env=await pg.evaluate("(()=>{const o=[];for(let i=0;i<=Math.ceil(window.__T_END*100);i++)o.push(window.__audioEnv(i/100));return o})()")
        meta=await pg.evaluate("({clicks:window.__clicks,subs:window.__subs})")
        json.dump({'env':env,**meta,'T':T},open('/tmp/claude-0/audio_env.json','w'))
        n=int(T*FPS)
        ff=subprocess.Popen(['ffmpeg','-v','error','-y','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','/tmp/claude-0/video_only.mp4'],stdin=subprocess.PIPE)
        stage=pg.locator('#stage')
        for i in range(n):
            await pg.evaluate(f"window.__exportFrame({i/FPS})")
            img=await pg.screenshot(type='jpeg',quality=93,clip={'x':0,'y':0,'width':1280,'height':720})
            ff.stdin.write(img)
            if i%300==0: print('frame',i,'/',n,flush=True)
        ff.stdin.close(); ff.wait()
        print('done',errs,flush=True)
        await b.close()
asyncio.run(main())
