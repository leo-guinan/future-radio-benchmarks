"""Resume-safe dialogue production; never automatically retries paid requests."""
import argparse, base64, hashlib, json, os, subprocess, time, datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parent
PLAN = json.loads((ROOT/'dialogue-plan-v1.json').read_text())
OUT = ROOT/'audio-v1'

def key():
    if os.environ.get('ELEVENLABS_API_KEY'):
        return os.environ['ELEVENLABS_API_KEY']
    raise RuntimeError('Set ELEVENLABS_API_KEY in the environment')

def api(path, body=None):
    req=Request('https://api.elevenlabs.io'+path,
        data=json.dumps(body).encode() if body else None,
        headers={'xi-api-key':key(),'Content-Type':'application/json'})
    try:
        with urlopen(req,timeout=240) as response:
            return json.loads(response.read()),dict(response.headers.items())
    except HTTPError as error:
        raise RuntimeError(f'ElevenLabs HTTP {error.code}: '+error.read().decode()[:600]) from None

def save(path, value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def preflight():
    sub,_=api('/v1/user/subscription')
    models,_=api('/v1/models')
    wanted=set(PLAN['voiceMap'].values())
    found=[]
    for voice_id in wanted:
        v,_=api('/v1/voices/'+voice_id)
        found.append({'voiceId':v['voice_id'],'name':v.get('name')})
    needed=sum(s['characterCount'] for s in PLAN['scenes'])
    data={'tier':sub.get('tier'),'characterCount':sub.get('character_count'),
          'characterLimit':sub.get('character_limit'),'plannedTextCharacters':needed,
          'voices':found,'modelAvailable':any(m['model_id']=='eleven_v4' for m in models)}
    OUT.mkdir(exist_ok=True)
    save(OUT/'preflight.json',data)
    print(json.dumps(data),flush=True)
    if not data['modelAvailable']:
        raise RuntimeError('Existing model eleven_v4 unavailable; no generation submitted')
    if isinstance(data['characterLimit'],int) and isinstance(data['characterCount'],int):
        if data['characterLimit']-data['characterCount']<needed:
            raise RuntimeError('Insufficient included credits; no generation submitted')

def generate(only=None):
    if not PLAN.get("paidGenerationAuthorized") or os.environ.get("FUTURE_RADIO_ALLOW_PAID")!="1":
        raise RuntimeError("New episode synthesis authorization is pending; no paid request submitted")
    OUT.mkdir(exist_ok=True)
    assert hashlib.sha256((ROOT/'script-v1.md').read_bytes()).hexdigest()==PLAN['sourceScriptSha256']
    assert hashlib.sha256((ROOT/'episode-script-v1.json').read_bytes()).hexdigest()==PLAN['structuredScriptSha256']
    for scene in PLAN['scenes']:
        sid=scene['sceneId']
        if only and sid!=only: continue
        audio=OUT/(sid+'.mp3'); receipt=OUT/(sid+'.json')
        request={'inputs':[{'text':x['text'],'voice_id':x['voiceId']} for x in scene['lines']],
                 'model_id':'eleven_v4','seed':int(hashlib.sha256(sid.encode()).hexdigest()[:8],16),
                 'apply_text_normalization':'auto'}
        request_hash=hashlib.sha256(json.dumps(request,sort_keys=True).encode()).hexdigest()
        if receipt.exists() and audio.exists():
            old=json.loads(receipt.read_text())
            if old['requestSha256']!=request_hash or old['audioSha256']!=hashlib.sha256(audio.read_bytes()).hexdigest():
                raise RuntimeError('Cached artifact changed; refusing overwrite')
            print(sid+' reused',flush=True);continue
        marker=OUT/(sid+'.request.json')
        if marker.exists():
            raise RuntimeError(sid+' has a previous unresolved request; inspect before spending again')
        save(marker,{'body':request,'requestSha256':request_hash,'authorization':PLAN['authorization'],'submittedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()})
        started=time.monotonic()
        response,headers=api('/v1/text-to-dialogue/with-timestamps?output_format=mp3_44100_128',request)
        audio.write_bytes(base64.b64decode(response.pop('audio_base64')))
        save(receipt,{'sceneId':sid,'requestSha256':request_hash,
                      'audioSha256':hashlib.sha256(audio.read_bytes()).hexdigest(),
                      'requestId':headers.get('request-id') or headers.get('x-request-id'),
                      'characterCost':headers.get('character-cost'),'requestWallSeconds':round(time.monotonic()-started,3),**response})
        print(sid+' generated '+str(audio.stat().st_size)+' bytes',flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--preflight',action='store_true');p.add_argument('--scene');a=p.parse_args()
    if a.preflight: preflight()
    else: generate(a.scene)
