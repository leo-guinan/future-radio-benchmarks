#!/usr/bin/env python3
"""Content-tracked pipeline runs. Cloud synthesis is opt-in; runs are immutable inputs."""
import argparse,datetime,hashlib,json,math,os,re,resource,shutil,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads(Path(p).read_text())
def save(p,v):Path(p).parent.mkdir(parents=True,exist_ok=True);Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def sha(p):
    h=hashlib.sha256()
    with Path(p).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()
def files(base,patterns):
    found={}
    for pattern in patterns:
        for p in sorted(base.glob(pattern)):
            if p.is_file() and '__pycache__' not in p.parts:found[p.relative_to(base).as_posix()]=sha(p)
    return found

def baseline_costs():
    evidence=ROOT/'benchmarks/000/baseline/evidence';r=read(evidence/'receipt.json');attempts=r['localProductionAttempts']
    scenes=[]
    for p in sorted((ROOT/'benchmarks/000/reference/audio-v1').glob('scene-??.json')):
        s=read(p);scenes.append({'scene':s['sceneId'],'synthesisCredits':int(s['characterCost']),'requestWallSeconds':s['requestWallSeconds'],'evidence':str(p.relative_to(ROOT))})
    known_local=attempts['totalMixWallSeconds']+attempts['styleSampleWallSeconds']+attempts['fullVideoCaptureAndInitialMuxWallSeconds']
    return {'benchmark':'000','measurementStatus':'partial_cost_baseline','currency':'USD','measured':{'providerCredits':sum(s['synthesisCredits'] for s in scenes),'providerRequests':len(scenes),'providerRequestWallSeconds':round(sum(s['requestWallSeconds'] for s in scenes),3),'mixAttempts':attempts['mixCount'],'mixWallSeconds':attempts['totalMixWallSeconds'],'styleSampleWallSeconds':attempts['styleSampleWallSeconds'],'videoCaptureAndInitialMuxWallSeconds':attempts['fullVideoCaptureAndInitialMuxWallSeconds'],'recordedLocalStageWallSeconds':round(known_local,3),'orchestrationElapsedSeconds':r['elapsedSinceProductionPreparationSeconds'],'episodeSeconds':r['runtimeSeconds']},'unknown':{'providerCashUsd':None,'creditValueUsd':None,'agentTokens':None,'agentComputeUsd':None,'humanActiveMinutes':None,'humanLaborUsd':None,'electricityKwh':None,'electricityUsd':None,'hardwareDepreciationUsd':None,'setupAndAuthoringTimeSeconds':None,'verificationTimeSeconds':None,'finalAudioRemuxSeconds':None,'uploadTimeSeconds':None},'accounting':{'account':'Grant-backed ElevenLabs account. Credit expenditure is measured; no cash-equivalent rate is inferred.','timing':'Provider request timers include network and provider waits. Local stage timers exclude uninstrumented preparation, tests, QA and final remux. Stage sum is not total active time.','orchestration':'991.9 s is elapsed since script preparation through original packaging; includes approval wait and agent work, not independently measured human active effort.','reusedAssets':'Renderer, canonical voices, Foley and prior production tooling existed before this run. Their historical creation cost is unmeasured and excluded from incremental totals, not assumed free.','mixes':'Both mixing attempts included; printer revision reused all paid takes and video frames.','cashTotal':'Cannot calculate a complete total from the retained evidence. Unknown is never zero.'},'scenes':scenes,'evidence':'benchmarks/000/baseline/evidence/receipt.json'}

def estimates(costs,rates):
    for name,value in rates.items():
        if value is not None and (not isinstance(value,(int,float)) or not math.isfinite(value) or value<0):raise ValueError('Rates must be finite nonnegative numbers or null: '+name)
    measured=costs['measured'];out={}
    mappings=[('synthesisScenarioUsd','usdPerSynthesisCredit',measured['providerCredits']),('recordedLocalEnergyScenarioKwh','averageLocalWatts',measured['recordedLocalStageWallSeconds']/3600000),('humanLaborScenarioUsd','humanUsdPerHour',rates.get('humanActiveMinutes',0)/60)]
    for name,key,quantity in mappings:
        if rates.get(key) is not None and (key!='humanUsdPerHour' or rates.get('humanActiveMinutes') is not None):out[name]=float(rates[key])*quantity
    if 'recordedLocalEnergyScenarioKwh' in out and rates.get('electricityUsdPerKwh') is not None:out['recordedLocalElectricityScenarioUsd']=out['recordedLocalEnergyScenarioKwh']*rates['electricityUsdPerKwh']
    return {'status':'user-supplied-rate scenario; not observed charges','assumptions':rates,'results':out,'scope':'Energy uses only recorded local stage seconds, excluding setup, QA, waiting, cloud power and other unrecorded work. No complete total is claimed.'}

def verify_baseline():
    base=ROOT/'benchmarks/000';ref=base/'reference';plan=read(ref/'dialogue-plan-v1.json')
    assert sha(ref/'script-v1.md')==plan['sourceScriptSha256']
    assert sha(ref/'episode-script-v1.json')==plan['structuredScriptSha256']
    script=read(ref/'episode-script-v1.json')
    import jsonschema
    jsonschema.validate(script,read(ROOT/'schemas/episode-script.schema.json'))
    source=(ref/'source-brief.txt').read_text().split("The episode's real-world game")[0]
    expected=[(name.replace(' ','').lower(),text) for name,text in re.findall(r'^(LEONARDO|BORGES|AGN OLO):\s*(.+)$',source,re.M)]
    actual=[(e['characterId'],e['text']) for scene in script['scenes'] for e in scene['events'] if e['type']=='dialogue']
    assert expected==actual
    credits=0;lines=0
    for s in plan['scenes']:
        r=read(ref/'audio-v1'/(s['sceneId']+'.json'));req=read(ref/'audio-v1'/(s['sceneId']+'.request.json'))
        assert sha(ref/'audio-v1'/(s['sceneId']+'.mp3'))==r['audioSha256']
        assert hashlib.sha256(json.dumps(req['body'],sort_keys=True).encode()).hexdigest()==r['requestSha256']
        for i,line in enumerate(s['lines']):
            segments=[v for v in r['voice_segments'] if v['dialogue_input_index']==i];assert segments
            assert all(v['voice_id']==line['voiceId'] for v in segments)
            a=min(v['character_start_index'] for v in segments);b=max(v['character_end_index'] for v in segments)
            norm=lambda t:re.sub(r'\s+','',t).casefold()
            assert norm(''.join(r['alignment']['characters'][a:b]))==norm(line['text']);lines+=1
        credits+=int(r['characterCost'])
    assert lines==len(actual)==283 and credits==6689
    expected_manifest=read(base/'baseline/source-manifest.json')
    for name,digest in expected_manifest.items():assert sha(ROOT/name)==digest,name
    checked_assets=0
    for asset in read(base/'baseline/artifacts.json')['assets']:
        p=ROOT/asset['path']
        if p.exists():assert p.stat().st_size==asset['bytes'] and sha(p)==asset['sha256'];checked_assets+=1
    return {'lines':lines,'credits':credits,'frozenSourceFilesVerified':len(expected_manifest),'localReleaseAssetsVerified':checked_assets,'missingAssets':'Use fetch-outputs to retrieve any absent release media.'}

def initialize(run_id,config):
    if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}',run_id):raise ValueError('Run ID must be a short filename, without path separators')
    run=ROOT/'runs'/run_id;work=run/'work'
    if not work.exists():
        run.mkdir(parents=True,exist_ok=True)
        shutil.copytree(ROOT/config['recipe'],work)
        shutil.copytree(ROOT/config['reference'],work,dirs_exist_ok=True)
        shutil.copytree(ROOT/'benchmarks/000/baseline/evidence',work,dirs_exist_ok=True)
        save(run/'config.json',config);save(run/'input-snapshot.json',files(work,['**/*']))
    elif read(run/'config.json')!=config:raise ValueError('Run config changed. Choose a new run ID to preserve the prior experiment.')
    return run,work

def append_event(run,event):
    p=run/'events.jsonl';prior=p.read_text().splitlines() if p.exists() else []
    event={'sequence':len(prior),'previousHash':read_event(prior[-1])['hash'] if prior else None,**event}
    event['hash']=hashlib.sha256(json.dumps(event,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    with p.open('a') as f:f.write(json.dumps(event,sort_keys=True)+'\n')
def read_event(line):return json.loads(line)
def ordered_steps(config,target):
    by={s['id']:s for s in config['steps']};ordered=[];visiting=set()
    def visit(sid):
        if sid in visiting:raise ValueError('Dependency cycle: '+sid)
        if any(s['id']==sid for s in ordered):return
        visiting.add(sid)
        for dep in by[sid].get('dependsOn',[]):visit(dep)
        visiting.remove(sid);ordered.append(by[sid])
    visit(target);return ordered

def run_pipeline(args,config):
    run,work=initialize(args.run_id,config)
    for step in ordered_steps(config,args.target):
        inputs=files(work,step['inputs']);signature=hashlib.sha256(json.dumps({'step':step,'inputs':inputs},sort_keys=True).encode()).hexdigest();checkpoint=run/(step['id']+'.json')
        if checkpoint.exists():
            old=read(checkpoint)
            if old['signature']==signature and old['outputs']==files(work,step['outputs']) and old['outputs']:
                print(step['id']+' cached',flush=True);continue
        before=files(work,['audio-v1/scene-??.json']);cmd=[part.replace('{python}',sys.executable) for part in step['command']]
        if step.get('paid') and args.allow_paid:cmd.append('--allow-paid')
        started=datetime.datetime.now(datetime.timezone.utc).isoformat();clock=time.monotonic();usage=resource.getrusage(resource.RUSAGE_CHILDREN)
        append_event(run,{'stage':step['id'],'status':'started','startedAt':started,'signature':signature,'paidRequestsAllowed':bool(args.allow_paid and step.get('paid')),'inputs':inputs})
        result=subprocess.run(cmd,cwd=work)
        after=resource.getrusage(resource.RUSAGE_CHILDREN);elapsed=time.monotonic()-clock
        receipts=files(work,['audio-v1/scene-??.json']);new=[name for name,h in receipts.items() if before.get(name)!=h]
        credits=sum(int(read(work/name)['characterCost']) for name in new)
        unresolved=[p.name for p in (work/'audio-v1').glob('*.request.json') if not p.with_name(p.name.replace('.request.json','.json')).exists()]
        if step.get('paid') and unresolved:credits=None
        outputs=files(work,step['outputs']);record={'stage':step['id'],'status':'passed' if result.returncode==0 else 'failed','signature':signature,'command':cmd,'startedAt':started,'wallSeconds':round(elapsed,6),'childUserCpuSeconds':round(after.ru_utime-usage.ru_utime,6),'childSystemCpuSeconds':round(after.ru_stime-usage.ru_stime,6),'newSynthesisCredits':credits,'newProviderReceipts':new,'unresolvedProviderRequests':unresolved,'outputs':outputs,'unmeasured':{'cashUsd':None,'agentComputeUsd':None,'humanActiveMinutes':None,'energyKwh':None}}
        append_event(run,record)
        if result.returncode:raise SystemExit(result.returncode)
        if not outputs:raise RuntimeError('Step produced no declared outputs: '+step['id'])
        save(checkpoint,record)
    print('Run evidence: '+str(run/'events.jsonl'))

def verify_run(run_id):
    run=ROOT/'runs'/run_id;previous=None;totals={'wallSeconds':0,'childCpuSeconds':0,'newSynthesisCredits':0};stages=0
    for sequence,line in enumerate((run/'events.jsonl').read_text().splitlines()):
        event=json.loads(line);digest=event.pop('hash')
        assert event['sequence']==sequence and event['previousHash']==previous,'Event chain broken'
        assert hashlib.sha256(json.dumps(event,sort_keys=True,separators=(',',':')).encode()).hexdigest()==digest,'Event changed'
        previous=digest
        if event['status']!='started':
            stages+=1;totals['wallSeconds']+=event['wallSeconds'];totals['childCpuSeconds']+=event['childUserCpuSeconds']+event['childSystemCpuSeconds']
            if event['newSynthesisCredits'] is None:totals['newSynthesisCredits']=None
            elif totals['newSynthesisCredits'] is not None:totals['newSynthesisCredits']+=event['newSynthesisCredits']
    for p in run.glob('*.json'):
        if p.name in ['config.json','input-snapshot.json']:continue
        checkpoint=read(p)
        for name,digest in checkpoint['outputs'].items():assert sha(run/'work'/name)==digest,'Output changed: '+name
    return {'run':run_id,'eventChain':'verified','stageAttempts':stages,'incrementalTotals':totals,'inheritedSynthesisCredits':6689,'unmeasuredCashUsd':None,'unmeasuredEnergyKwh':None}

def main():
    p=argparse.ArgumentParser();p.add_argument('--config',default=str(ROOT/'pipeline/reference-v1.json'));sub=p.add_subparsers(dest='action',required=True)
    sub.add_parser('plan');sub.add_parser('verify-baseline')
    c=sub.add_parser('costs');c.add_argument('--rates');c.add_argument('--out')
    r=sub.add_parser('run');r.add_argument('--run-id',required=True);r.add_argument('--target',default='verify-media');r.add_argument('--allow-paid',action='store_true')
    sub.add_parser('fetch-outputs')
    vr=sub.add_parser('verify-run');vr.add_argument('--run-id',required=True)
    args=p.parse_args();config=read(args.config)
    if args.action=='plan':
        for s in config['steps']:print(f"{s['id']:18} <- {', '.join(s.get('dependsOn',[])) or 'frozen inputs'} | {'paid opt-in / cached default' if s.get('paid') else 'local'}")
    elif args.action=='verify-baseline':print(json.dumps(verify_baseline(),indent=2))
    elif args.action=='costs':
        d=baseline_costs()
        if args.rates:d['scenario']=estimates(d,read(args.rates))
        if args.out:save(args.out,d)
        print(json.dumps(d,indent=2))
    elif args.action=='run':run_pipeline(args,config)
    elif args.action=='verify-run':print(json.dumps(verify_run(args.run_id),indent=2))
    elif args.action=='fetch-outputs':
        d=read(ROOT/'benchmarks/000/baseline/artifacts.json');dest=ROOT/'artifacts/000';dest.mkdir(parents=True,exist_ok=True)
        for a in d['assets']:
            p=dest/a['name']
            if p.exists():
                if sha(p)!=a['sha256']:raise ValueError('Existing asset differs; refusing overwrite: '+a['name'])
                continue
            subprocess.run(['gh','release','download',d['releaseTag'],'--repo','leo-guinan/future-radio-benchmarks','--pattern',a['name'],'--dir',str(dest)],check=True)
            if sha(p)!=a['sha256']:raise ValueError('Downloaded asset hash mismatch: '+a['name'])
        print('All release assets verified.')
if __name__=='__main__':main()
