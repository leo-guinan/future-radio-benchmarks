#!/usr/bin/env python3
"""Extract usage counters for one completed local Codex turn, excluding chat content."""
import argparse,datetime,hashlib,json
from pathlib import Path

def extract(path,turn_id):
    current=None;prior={};before={};events=[];meta={}
    for line in Path(path).open():
        event=json.loads(line);payload=event.get('payload',{})
        if event.get('type')=='turn_context':
            current=payload.get('turn_id')
            if current==turn_id:before=dict(prior);meta={'turnId':turn_id,'model':payload.get('model'),'startedAt':event['timestamp']}
        elif event.get('type')=='event_msg' and payload.get('type')=='token_count' and payload.get('info'):
            usage=payload['info']['total_token_usage']
            if current==turn_id:events.append({'timestamp':event['timestamp'],'totalTokenUsage':usage})
            prior=usage
        elif current==turn_id and event.get('type')=='event_msg' and payload.get('type')=='task_complete':meta['completedAt']=event['timestamp']
    if not events or 'completedAt' not in meta:raise ValueError('Selected completed turn and usage evidence required')
    final=events[-1]['totalTokenUsage'];delta={key:value-before.get(key,0) for key,value in final.items()}
    if any(v<0 for v in delta.values()):raise ValueError('Usage counters reset; cannot derive this turn by subtraction')
    duration=(datetime.datetime.fromisoformat(meta['completedAt'].replace('Z','+00:00'))-datetime.datetime.fromisoformat(meta['startedAt'].replace('Z','+00:00'))).total_seconds()
    meta.update({'scope':'Original episode production turn only; repository creation and later replay excluded.','source':'Local Codex session usage telemetry; no chat/tool payloads published.','counterBeforeTurn':before,'counterAtTurnEnd':final,'turnUsage':delta,'uncachedInputTokens':delta['input_tokens']-delta['cached_input_tokens'],'elapsedTurnSeconds':duration,'eventCount':len(events),'cashChargeUsd':None,'accounting':'Cached input is a subset of input; reasoning output is a subset of output. Do not add either subset again. Reported token counters are not an invoice.','eventsSha256':hashlib.sha256(json.dumps(events,sort_keys=True,separators=(',',':')).encode()).hexdigest()})
    return meta,events
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--rollout',required=True);p.add_argument('--turn-id',required=True);p.add_argument('--out-dir',required=True);a=p.parse_args()
    meta,events=extract(a.rollout,a.turn_id);out=Path(a.out_dir);out.mkdir(parents=True,exist_ok=True)
    (out/'agent-usage.json').write_text(json.dumps(meta,indent=2)+'\n');(out/'agent-token-events.json').write_text(json.dumps(events,indent=2)+'\n');print(json.dumps({'model':meta['model'],'tokens':meta['turnUsage'],'elapsedTurnSeconds':meta['elapsedTurnSeconds']}))
