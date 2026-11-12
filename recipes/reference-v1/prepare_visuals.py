import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def main():
    timeline=json.loads((ROOT/'timeline-v1.json').read_text());script=json.loads((ROOT/'episode-script-v1.json').read_text())
    captions=[]
    for row in timeline['dialogue']:
        group=[]
        for word in row['wordTimings']:
            if group and len(' '.join(w['text'] for w in group+[word]))>80:
                captions.append({'start':group[0]['start'],'end':group[-1]['end'],'speaker':row['characterId'].upper(),'text':' '.join(w['text'] for w in group),'eventId':row['eventId']});group=[]
            group.append(word)
        if group:captions.append({'start':group[0]['start'],'end':group[-1]['end'],'speaker':row['characterId'].upper(),'text':' '.join(w['text'] for w in group),'eventId':row['eventId']})
    rows=[{**row,'sequence':i} for i,row in enumerate(timeline['dialogue'])]
    scenes=[{**s,'dialogueStart':next(r['start'] for r in rows if r['sceneId']==s['sceneId'])} for s in timeline['chapters']]
    spec={'title':'The Benchmark Episode','scriptArtifactId':'script-v1.md','scriptSha256':json.loads((ROOT/'dialogue-plan-v1.json').read_text())['sourceScriptSha256'],'scene':{'sceneId':'the-benchmark-episode','sceneTitle':'The Benchmark Episode','characterIds':['leonardo','borges','agnolo'],'shots':[]},'characters':script['characters'],'dialogueTimeline':rows,'captions':captions,'benchmarkScenes':scenes,'directionTimeline':[],'soundMix':{'dialogueGainDb':0,'drawingFoleyGainDb':-20},'duration':timeline['duration']}
    (ROOT/'render-spec-v1.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'duration':spec['duration'],'captions':len(captions),'scenes':len(scenes)}))
if __name__=='__main__':main()
