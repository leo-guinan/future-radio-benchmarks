import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent
plan=json.loads((ROOT/'dialogue-plan-v1.json').read_text())
for name,key in [('script-v1.md','sourceScriptSha256'),('episode-script-v1.json','structuredScriptSha256')]:assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==plan[key]
script=json.loads((ROOT/'episode-script-v1.json').read_text())
source=(ROOT/'source-brief.txt').read_text().split("The episode's real-world game")[0]
a=[(x.replace(' ','').lower(),y) for x,y in re.findall(r'^(LEONARDO|BORGES|AGN OLO):\s*(.+)$',source,re.M)]
b=[(e['characterId'],e['text']) for s in script['scenes'] for e in s['events'] if e['type']=='dialogue'];assert a==b
(ROOT/'input-validation.json').write_text(json.dumps({'passed':True,'dialogueLines':len(b)},indent=2)+'\n')
