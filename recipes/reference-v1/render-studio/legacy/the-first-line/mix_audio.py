import json, numpy as np, wave, subprocess
from scipy.signal import butter, sosfilt, lfilter
SR=48000
d=json.load(open('/tmp/claude-0/audio_env.json'))
T=d['T']; N=int(T*SR)+SR
t=np.arange(N)/SR
def envof(key):
    v=np.array([e[key] for e in d['env']]); x=np.interp(t, np.arange(len(v))/100, v)
    a=np.exp(-1/(0.03*SR)); return lfilter([1-a],[1,-a],x)
rng=np.random.default_rng(4)
noise=rng.standard_normal(N)
bp=lambda lo,hi,x: sosfilt(butter(2,[lo,hi],btype='band',fs=SR,output='sos'),x)
flutter=sosfilt(butter(2,12,fs=SR,output='sos'),rng.standard_normal(N)); flutter=0.6+0.4*np.clip(flutter/np.std(flutter)/2,-1,1)
scratch=bp(2400,4800,noise)*envof('scratch')*flutter*1.6
static=bp(700,2600,rng.standard_normal(N))*envof('stat')*1.6
trem=0.5+0.5*np.sign(np.sin(2*np.pi*20*t))
ring=(np.sin(2*np.pi*440*t)+np.sin(2*np.pi*480*t))*0.5*trem*envof('ring')*2.2
hum=np.sin(2*np.pi*120*t)*envof('hum')*1.5
sfx=scratch+static+ring+hum
for c in d['clicks']:
    i=int(c*SR); k=np.arange(int(.05*SR)); sfx[i:i+len(k)]+=0.25*np.sign(np.sin(2*np.pi*1800*k/SR))*np.exp(-k/(0.008*SR))
vo=np.zeros(N)
for i,s in enumerate(d['subs']):
    w=wave.open(f'vo/p{i+1:02d}.wav'); x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768
    if w.getnchannels()==2: x=x.reshape(-1,2).mean(1)
    j=int(s[0]*SR); vo[j:j+len(x)]+=x[:N-j]
mix=vo*1.0+sfx*0.5
mix=np.clip(mix,-1,1)
out=(mix*32767).astype(np.int16)
w=wave.open('/tmp/claude-0/mix_raw.wav','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(out.tobytes());w.close()
print('peak vo',np.abs(vo).max(),'peak sfx',np.abs(sfx).max())
