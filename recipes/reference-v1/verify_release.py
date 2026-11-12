import hashlib,json,re,subprocess,math
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'release-v1'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def main():
    video=OUT/'the-benchmark-episode.mp4';receipt=json.loads((OUT/'receipt.json').read_text());timeline=json.loads((ROOT/'timeline-v1.json').read_text())
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-show_chapters','-of','json',str(video)]))
    v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
    assert (v['width'],v['height'],v['r_frame_rate'])==(1280,720,'30/1')
    assert v['codec_name']=='h264' and a['codec_name']=='aac'
    assert abs(float(v['duration'])-float(a['duration']))<.07
    assert abs(float(info['format']['duration'])-timeline['duration'])<.1
    assert len(info['chapters'])==9
    decode=subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True,check=True);assert not decode.stderr,decode.stderr
    loud=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(video),'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    m=json.loads(re.findall(r'\{\s*"input_i".*?\}',loud.stderr,re.S)[-1]);save(OUT/'video-loudness.json',m)
    assert -17<float(m['input_i'])<-15 and float(m['input_tp'])<-1,m
    visual=json.loads((ROOT/'visual-checks.json').read_text());assert visual['deterministic'] and not visual['denied'] and not visual['mismatches']
    regression=json.loads((ROOT/'regression-tests.json').read_text());assert all(r['pass'] for r in regression['results']) and not regression['errors']
    times=[c['start']+4.1 for c in timeline['chapters']]+[7,300,timeline['duration']-2]
    stills=OUT/'stills';stills.mkdir(exist_ok=True)
    sheet=Image.new('RGB',(1280,384*math.ceil(len(times)/2)),'#171c21');draw=ImageDraw.Draw(sheet)
    for i,t in enumerate(times):
        p=stills/f'{i:02}.jpg';subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1','-q:v','2',str(p)],check=True)
        x=i%2*640;y=i//2*384;sheet.paste(Image.open(p).resize((640,360)),(x,y));draw.text((x+10,y+365),f'{t:.2f}s',fill='white')
    sheet.save(OUT/'contact.png')
    receipt['status']='complete_local_audio_and_video_review_cut';receipt['video']={'width':1280,'height':720,'fps':30,'codec':v['codec_name'],'audioCodec':a['codec_name'],'chapterCount':9,'streamDurationDifferenceSeconds':abs(float(v['duration'])-float(a['duration'])),'decodeCheck':'Full video/audio decode passed, no errors.','integratedLufs':float(m['input_i']),'truePeakDbtp':float(m['input_tp']),'visualChecks':visual,'renderMetrics':json.loads((ROOT/'video-render-metrics.json').read_text()),'regressionTestsPassed':len(regression['results']),'animation':'Authored studio scene-log drawings, limited character movement, camera cuts and timed captions.'}
    receipt['hashes']={p.name:sha(p) for p in OUT.iterdir() if p.is_file() and p.name!='receipt.json'};save(OUT/'receipt.json',receipt)
    print(json.dumps({'status':receipt['status'],'duration':info['format']['duration'],'videoLufs':m['input_i'],'peak':m['input_tp'],'framesExtracted':len(times)}))
if __name__=='__main__':main()
