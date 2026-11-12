"""Reproducible source-aligned radio mix; original procedural music and effects."""
import hashlib, json, re, subprocess, time, wave, resource, shutil, html, zipfile
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

ROOT=Path(__file__).resolve().parent
SR=48000
RNG=np.random.default_rng(481700)

def save(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read_audio(p):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','f32le','-ar',str(SR),'-ac','1','-']),dtype='<f4').copy()
def wav(path,data):
    data=np.asarray(data)
    with wave.open(str(path),'wb') as f:
        f.setparams((1 if data.ndim==1 else data.shape[1],2,SR,0,'NONE','not compressed'))
        f.writeframes((np.clip(data,-1,1)*32767).astype('<i2').tobytes())
def envelope(n,attack=.01,release=.12):
    a=np.ones(n,dtype=np.float32);i=min(n//2,round(SR*attack));j=min(n//2,round(SR*release))
    if i:a[:i]=np.linspace(0,1,i)
    if j:a[-j:]=np.linspace(1,0,j)
    return a
def noise(seconds,low=120,high=3000):
    n=round(seconds*SR);x=RNG.standard_normal(n).astype(np.float32)
    return sosfilt(butter(2,[low,high],btype='bandpass',fs=SR,output='sos'),x).astype(np.float32)*envelope(n)
def tone(freq,seconds,kind='bell'):
    t=np.arange(round(seconds*SR),dtype=np.float32)/SR
    if kind=='bell':x=(np.sin(2*np.pi*freq*t)+.3*np.sin(2*np.pi*freq*2.76*t))*np.exp(-4*t)
    elif kind=='reed':x=(np.sin(2*np.pi*freq*t)+.15*np.sin(2*np.pi*freq*3*t)+.07*np.sin(2*np.pi*freq*5*t))*envelope(len(t),.08,.2)
    else:x=(np.sin(2*np.pi*freq*t)+.2*np.sin(2*np.pi*freq*2*t))*envelope(len(t),.1,.3)
    return x.astype(np.float32)
def add(dst,sound,at,gain=1):
    i=max(0,round(at*SR));n=min(len(sound),len(dst)-i)
    if n>0:dst[i:i+n]+=sound[:n]*gain

def motif(seconds,kind='theme'):
    x=np.zeros(round(seconds*SR),dtype=np.float32)
    if kind=='uncertain':return .25*tone(311.13,seconds)+.08*tone(329.63,seconds)
    if kind=='hum':
        t=np.arange(len(x))/SR;return (.1*np.sin(2*np.pi*73.42*t)+.04*np.sin(2*np.pi*146.83*t))*envelope(len(x),.3,.4)
    step=.38 if kind in ['collapse','crescendo'] else .55
    notes=[293.66,349.23,440,392,293.66]
    for i,f in enumerate(notes):
        at=i*step
        if at>=seconds:break
        n=min(1.4,seconds-at);gain=.17*(.55+i*.15 if kind=='crescendo' else 1)
        add(x,tone(f,n,'reed' if kind=='simple' else 'bell'),at,gain)
        if kind!='simple':add(x,tone(f/2,n,'bow'),at,.075)
    if kind=='collapse':
        for i,f in enumerate([392,369.99,349.23,277.18]):add(x,tone(f,.35,'reed'),1.65+i*.13,.12)
    if kind=='rhythm':
        for at in np.arange(0,seconds,.45):add(x,tone(880,.06),at,.08)
    return x*envelope(len(x),.015,.2)

def effect(direction,seconds):
    s=direction.lower();n=round(seconds*SR);x=np.zeros(n,dtype=np.float32)
    if any(w in s for w in ['crowd','applause']):
        # Stylized stadium wash and hundreds of small claps, no sampled people.
        t=np.arange(n)/SR;x+=noise(seconds,250,2500)*(.11+.06*np.sin(t*3))
        for at in RNG.uniform(.03,max(.04,seconds-.13),round(seconds*40)):
            add(x,noise(.08,800,7000)*np.exp(-np.arange(round(.08*SR))/SR*65),at,.12)
        for at in [.3,1.1,2.0]:add(x,tone(659.25,.12,'reed'),at,.09)
        if 'scoreboard' in s:add(x,tone(130.81,.3,'reed'),.05,.13)
    elif any(w in s for w in ['bell','notification']):
        add(x,tone(1046.5,min(1.5,seconds)),0,.22)
        if 'notification' in s:add(x,tone(1318.51,min(.7,seconds-.2)),.2,.13)
    elif any(w in s for w in ['hum','fan','miner']):
        t=np.arange(n)/SR;x+=(.12*np.sin(2*np.pi*73.42*t)+.04*np.sin(2*np.pi*146.83*t)+.025*noise(seconds,90,1200))*envelope(n,.3,.4)
    elif 'clock' in s:
        for i,at in enumerate(np.arange(0,seconds,.5)):add(x,tone(1400 if i%2 else 1000,.055),at,.12)
    elif 'printer' in s:
        for at in np.arange(0,seconds,.09 if 'speeds up' in s else .18):
            add(x,noise(.11,500,5000),at,.14);add(x,tone(170,.08,'reed'),at,.06)
        x+=noise(seconds,120,600)*.06
    elif any(w in s for w in ['pencil','scratch','paper']):
        for at in np.arange(0,seconds,.22):add(x,noise(min(.16,seconds-at),500,5500),at,.11)
    elif any(w in s for w in ['ledger','pages']):
        if 'slams' in s or 'shut' in s:
            add(x,tone(100,.3,'bow'),.01,.3);add(x,noise(.2,100,3500),0,.3)
        else:
            for at in np.arange(0,seconds,.24):add(x,noise(min(.18,seconds-at),700,4500),at,.12)
    elif any(w in s for w in ['chair','table']):
        add(x,noise(min(.8,seconds),100,1500),0,.18)
        for at in [.5,.9,1.4]:add(x,tone(90,.18,'reed'),at,.18)
    else:add(x,noise(min(.25,seconds),100,3000),0,.12)
    return x*envelope(n,.01,.15)

def cue_duration(e):
    if e['type']=='pause':return e.get('targetDurationSeconds',1.2)
    s=e.get('direction','').lower()
    if e['type']=='music_direction':
        if 'stops' in s:return .2
        if 'final' in s:return 5.5
        return 3.2 if 'theme' in s or 'rhythm' in s else 2.2
    if e['type']=='sound_direction':
        if 'clock stops' in s:return .35
        return 4.5 if 'stadium' in s else 2.2 if any(w in s for w in ['printer','hum','fan','pages','table']) else 1.2
    return .4

def make_timeline():
    plan=json.loads((ROOT/'dialogue-plan-v1.json').read_text());script=json.loads((ROOT/'episode-script-v1.json').read_text())
    assert sha(ROOT/'script-v1.md')==plan['sourceScriptSha256']
    assert sha(ROOT/'episode-script-v1.json')==plan['structuredScriptSha256']
    chunks=[];rows=[];cues=[];chapters=[];cursor=0.;cost=0;requests=0.
    filt=butter(3,[320,3600],btype='bandpass',fs=SR,output='sos')
    for ps,ss in zip(plan['scenes'],script['scenes']):
        sid=ps['sceneId'];p=ROOT/'audio-v1'/(sid+'.mp3');r=json.loads((p.with_suffix('.json')).read_text());assert sha(p)==r['audioSha256']
        raw=read_audio(p);segments=r['voice_segments'];alignment=r['alignment'];chars=alignment['characters']
        starts=alignment['character_start_times_seconds'];ends=alignment['character_end_times_seconds']
        assert {s['dialogue_input_index'] for s in segments}==set(range(len(ps['lines'])))
        cost+=int(r['characterCost']);requests+=r.get('requestWallSeconds',0)
        scene_start=cursor;chunks.append(np.zeros(round(.5*SR),dtype=np.float32));cursor+=.5
        # Reserve source cues between dialogue lines; preserve the continuous take.
        insertions=[];pending=[];line_i=0;event_points={}
        for e in ss['events']:
            if e['type']!='dialogue':pending.append(e);continue
            at=min(s['start_time_seconds'] for s in segments if s['dialogue_input_index']==line_i)
            if pending:
                total=sum(cue_duration(ev) for ev in pending);insertions.append((at,total,pending));pending=[]
            line_i+=1
        if pending:insertions.append((len(raw)/SR,sum(cue_duration(ev) for ev in pending),pending))
        # Insert cues at the start of a line without clipping the prior utterance.
        previous_end=0
        for at,gap,events in insertions:
            preceding=[s['end_time_seconds'] for s in segments if s['end_time_seconds']<=at+.001]
            # Provider may join boundaries; insertion is at exact returned next-line start.
            assert at>=previous_end;previous_end=at
        def shift(t):return sum(gap for point,gap,_ in insertions if point<=t+1e-6)
        for i,line in enumerate(ps['lines']):
            segs=[s for s in segments if s['dialogue_input_index']==i];a=min(s['start_time_seconds'] for s in segs);b=max(s['end_time_seconds'] for s in segs)
            assert all(s['voice_id']==line['voiceId'] for s in segs)
            ca=min(s['character_start_index'] for s in segs);cb=max(s['character_end_index'] for s in segs)
            norm=lambda v:re.sub(r'\s+','',v).casefold()
            assert norm(''.join(chars[ca:cb]))==norm(line['text']),(sid,i,'text mismatch')
            if line['characterId']=='agnolo':
                ia,ib=round(a*SR),min(round(b*SR),len(raw));dry=raw[ia:ib].copy();wet=sosfilt(filt,dry).astype(np.float32)
                ramp=envelope(len(dry),.005,.005);raw[ia:ib]=dry*(1-ramp)+(.9*wet+.1*dry)*ramp
            words=[]
            for match in re.finditer(r'\S+',''.join(chars[ca:cb])):
                wca=ca+match.start();wcb=ca+match.end()-1
                words.append({'text':match.group(),'start':cursor+starts[wca]+shift(a),'end':cursor+ends[wcb]+shift(a)})
            rows.append({**line,'sceneId':sid,'start':cursor+a+shift(a),'end':cursor+b+shift(a),'wordTimings':words})
        prev=0;accum=0.
        for at,gap,events in insertions:
            cut=round(at*SR);chunks.extend([raw[prev:cut],np.zeros(round(gap*SR),dtype=np.float32)]);prev=cut
            point=cursor+at+accum
            for e in events:
                dur=cue_duration(e);cues.append({**e,'sceneId':sid,'start':point,'duration':dur});point+=dur
            accum+=gap
        chunks.append(raw[prev:]);cursor+=len(raw)/SR+accum
        chunks.append(np.zeros(round(.7*SR),dtype=np.float32));cursor+=.7
        chapters.append({'sceneId':sid,'title':ps['title'],'start':scene_start,'end':cursor})
    chunks.append(np.zeros(SR,dtype=np.float32));cursor+=1;chapters[-1]['end']=cursor
    audio=np.concatenate(chunks);duration=len(audio)/SR
    save(ROOT/'timeline-v1.json',{'duration':duration,'dialogue':rows,'cues':cues,'chapters':chapters,'providerCredits':cost,'providerRequestWallSeconds':requests})
    return audio,rows,cues,chapters,cost,requests,plan

def main():
    start=time.monotonic();cpu=time.process_time();out=ROOT/'release-v1';out.mkdir(exist_ok=True)
    dialogue,rows,cues,chapters,cost,requests,plan=make_timeline();duration=len(dialogue)/SR
    # Moderate stereo placement; the radio sits to the right, not hard-panned.
    mix=np.stack([dialogue*.69,dialogue*.69],axis=1);sound=np.zeros_like(dialogue)
    sound_receipts=[]
    for c in cues:
        if c['type'] in ['pause','action']:continue
        s=c['direction'].lower();d=c['duration']
        if c['type']=='music_direction':
            kind='simple' if 'simpler' in s else 'collapse' if 'collapses' in s else 'uncertain' if 'uncertain' in s else 'crescendo' if 'crescendo' in s else 'rhythm' if 'rhythm' in s else 'hum' if 'hum' in s or 'sustained' in s else 'theme'
            x=np.zeros(round(d*SR),dtype=np.float32) if 'stops' in s else motif(d,kind)
        else:x=effect(c['direction'],d)
        add(sound,x,c['start'],.75)
        if c['type']=='music_direction' and 'tick' in s:add(sound,effect('clock',min(d,1.5)),c['start']+max(0,d-1.5),.35)
        sound_receipts.append({'sourceEventId':c['id'],'sceneId':c['sceneId'],'direction':c['direction'],'start':c['start'],'duration':d,'method':'original deterministic procedural synthesis','seed':481700})
    # Carry the miner subtly beneath its exchange and let the final note become it.
    for chap in chapters:
        if 'THE MINER' in chap['title']:
            a=chap['start'];b=chap['end'];add(sound,motif(b-a,'hum'),a,.12)
    end_theme=next((c for c in cues if 'one final time' in c.get('direction','').lower()),None)
    if end_theme:add(sound,motif(4,'hum'),end_theme['start']+max(0,end_theme['duration']-3),.65)
    mix[:,0]+=sound*.70;mix[:,1]+=sound*.62
    peak=float(np.max(np.abs(mix)));mix*=min(1,.87/max(peak,1e-9))
    wav(ROOT/'audio-v1/dialogue-master.wav',dialogue*.8);wav(ROOT/'audio-v1/mix-premaster.wav',mix)
    save(ROOT/'sound-cues-v1.json',sound_receipts)
    # Captions retain every dialogue token and speaker; cues remain separate.
    captions=[]
    for r in rows:
        group=[]
        for w in r['wordTimings']:
            if group and len(' '.join(t['text'] for t in group+[w]))>80:
                captions.append({'start':group[0]['start'],'end':group[-1]['end'],'speaker':r['characterId'].upper(),'text':' '.join(t['text'] for t in group)});group=[]
            group.append(w)
        if group:captions.append({'start':group[0]['start'],'end':group[-1]['end'],'speaker':r['characterId'].upper(),'text':' '.join(t['text'] for t in group)})
    def stamp(t):
        ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    (out/'captions.srt').write_text('\n\n'.join(f'{i}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["speaker"]}: {c["text"]}' for i,c in enumerate(captions,1))+'\n')
    meta=';FFMETADATA1\ntitle=The Computational Treadmill\nartist=Future Radio\nalbum=Season Zero — The Open Game\n'
    for c in chapters:meta+=f'\n[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c["start"]*1000)}\nEND={round(c["end"]*1000)}\ntitle={c["title"]}\n'
    (ROOT/'chapters.ffmetadata').write_text(meta)
    cmd=['ffmpeg','-hide_banner','-nostats','-i',str(ROOT/'audio-v1/mix-premaster.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-']
    first=subprocess.run(cmd,capture_output=True,text=True,check=True);m=json.loads(re.findall(r'\{\s*"input_i".*?\}',first.stderr,re.S)[-1])
    save(out/'premaster-loudness.json',m)
    filt=f'loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true:print_format=json'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(ROOT/'audio-v1/mix-premaster.wav'),'-i',str(ROOT/'chapters.ffmetadata'),'-map_metadata','1','-af',filt,'-ar',str(SR),'-c:a','pcm_s16le',str(out/'the-computational-treadmill.wav')],check=True)
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'the-computational-treadmill.wav'),'-i',str(ROOT/'chapters.ffmetadata'),'-map_metadata','1','-map_chapters','1','-c:a','libmp3lame','-b:a','192k',str(out/'the-computational-treadmill.mp3')],check=True)
    check=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(out/'the-computational-treadmill.mp3'),'-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    loud=json.loads(re.findall(r'\{\s*"input_i".*?\}',check.stderr,re.S)[-1]);save(out/'loudness.json',loud)
    assert -17<float(loud['input_i'])<-15,loud
    assert float(loud['input_tp'])<=-1.0,loud
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-show_chapters','-of','json',str(out/'the-computational-treadmill.mp3')]))
    assert abs(float(probe['format']['duration'])-duration)<.15
    assert len(probe['chapters'])==7
    assert len(rows)==sum(len(s['lines']) for s in json.loads((ROOT/'dialogue-plan-v1.json').read_text())['scenes'])
    for src,dst in [('script-v1.md','script.md'),('source-brief.txt','source-brief.txt'),('sound-cues-v1.json','sound-cues.json'),('timeline-v1.json','timeline.json')]:shutil.copyfile(ROOT/src,out/dst)
    save(out/'chapters.json',chapters)
    receipt={'title':'The Computational Treadmill','benchmarkId':'001','status':'complete_local_audio_review_cut','referenceScriptSha256':plan['sourceScriptSha256'],'referencePreserved':True,'runtimeSeconds':float(probe['format']['duration']),'targetRuntimeSeconds':None,'runtimeWithinTarget':None,'dialogueLines':len(rows),'chapters':len(chapters),'soundCues':len(sound_receipts),'musicAndEffects':'Original deterministic local Orchestra and foley synthesis.','voices':'Established Future Radio voices, verified via ElevenLabs account.','model':'eleven_v4','providerCredits':cost,'providerRequestWallSeconds':round(requests,3),'dollarEquivalent':None,'dollarEquivalentReason':'Provider reports credits; grant account has no defensible marginal dollar conversion.','agentComputeCostUsd':None,'humanLaborMinutes':None,'humanLaborNote':'Not independently timed; review time remains pending.','energyKwh':None,'energyNote':'No wall-plug or process power meter. Do not substitute a fabricated estimate.','hardwareDepreciationUsd':None,'localMixWallSeconds':round(time.monotonic()-start,3),'localMixCpuSeconds':round(time.process_time()-cpu,3),'integratedLufs':float(loud['input_i']),'truePeakDbtp':float(loud['input_tp']),'decodeCheck':'Complete MP3 decode and loudness scan passed.','alignmentCheck':f'All {len(rows)} requested lines match provider character alignment; not independent transcription.','humanListeningReview':'pending','scriptAdaptation':'Treatment adapted to a demonstration-in-progress episode; no technical results invented.','experimentLedgerUrl':'https://future-radio-computational-treadmill.hitchhiker2thefuture.chatgpt.site/ledger','showPayoutConfigured':False,'publication':'approved public experimental review cut; human listening review pending','independentSubmissions':0,'deadline':None,'hashes':{p.name:sha(p) for p in out.iterdir() if p.is_file() and p.name!='receipt.json'}}
    save(out/'receipt.json',receipt)
    print(json.dumps({k:receipt[k] for k in ['status','runtimeSeconds','runtimeWithinTarget','providerCredits','integratedLufs','truePeakDbtp']}))
if __name__=='__main__':main()
