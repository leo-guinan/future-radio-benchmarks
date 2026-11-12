"""Portable episode pipeline. Cached replay is the default; paid generation is explicit."""
import argparse,hashlib,json,os,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def verify_inputs():
 expected=json.loads((ROOT/'input-manifest.json').read_text())
 for name,sha in expected.items():
  if digest(ROOT/name)!=sha:raise RuntimeError('Input hash mismatch: '+name)
 return len(expected)
def main():
 p=argparse.ArgumentParser();p.add_argument('action',choices=['plan','verify','replay','generate']);p.add_argument('--output',type=Path);p.add_argument('--allow-paid',action='store_true');a=p.parse_args()
 if a.action=='plan':print((ROOT/'pipeline.json').read_text());return
 count=verify_inputs()
 if a.action=='verify':print(json.dumps({'verifiedInputFiles':count}));return
 if not a.output:raise RuntimeError('--output must name a new directory')
 out=a.output.resolve()
 if out.exists():raise RuntimeError('Output exists; use a new directory to preserve evidence')
 if a.action=='generate' and (not a.allow_paid or not os.environ.get('ELEVENLABS_API_KEY')):raise RuntimeError('New synthesis requires --allow-paid and ELEVENLABS_API_KEY')
 shutil.copytree(ROOT/'reference',out,ignore=shutil.ignore_patterns('__pycache__'))
 if a.action=='generate':
  shutil.rmtree(out/'audio-v1');(out/'audio-v1').mkdir();env=dict(os.environ,FUTURE_RADIO_ALLOW_PAID='1')
  subprocess.run([sys.executable,str(out/'produce_audio.py')],env=env,check=True)
 subprocess.run([sys.executable,str(out/'build_episode.py')],check=True)
 r=json.loads((out/'release-v1/receipt.json').read_text())
 evidence={'action':a.action,'paidRequestsSubmitted':a.action=='generate','cachedReplayCreditsSpent':0 if a.action=='replay' else None,'historicalSourceTakeCredits':r['providerCredits'],'inputFilesVerified':count,'outputHashes':r['hashes'],'runtimeSeconds':r['runtimeSeconds'],'loudnessLufs':r['integratedLufs'],'truePeakDbtp':r['truePeakDbtp'],'note':'A replay proves execution on this environment. Cross-platform byte identity and independent reproduction are not claimed.'}
 (out/'run-evidence.json').write_text(json.dumps(evidence,indent=2)+'\n');print(json.dumps(evidence))
if __name__=='__main__':main()
