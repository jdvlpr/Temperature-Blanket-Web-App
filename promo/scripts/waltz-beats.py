import subprocess,sys,json,numpy as np
# Beat grid for the Reel's waltz (3 beats a bar). Same method as beats.py; seeded at the
# first note (0.75 s) with a 0.295 s beat. Usage: python -I scripts/waltz-beats.py public/waltz.mp3 40 src/data/waltz-beats.json
# The downbeat phase is a judgement call (lows favor phase 0, flux phase 1): set `phase` in the JSON by ear.
SR=22050;HOP=256;WIN=1024;FR=SR/HOP
x=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout,dtype=np.float32)
n=(len(x)-WIN)//HOP
fr=np.lib.stride_tricks.as_strided(x,(n,WIN),(x.strides[0]*HOP,x.strides[0]))
A=np.abs(np.fft.rfft(fr*np.hanning(WIN),axis=1))
S=np.log1p(100*A)
flux=np.maximum(0,np.diff(S,axis=0)).sum(1);flux=(flux-flux.mean())/flux.std()
low=np.maximum(0,np.diff(S[:,:40],axis=0)).sum(1);low=(low-low.mean())/low.std()  # <~860Hz
peaks=[i for i in range(1,len(flux)-1) if flux[i]>0.8 and flux[i]>=flux[i-1] and flux[i]>=flux[i+1]]
on=np.array(peaks)/FR
def track(seed,end,p):
  b=[seed]
  while b[-1]+p<end:
    pred=b[-1]+p; near=on[np.abs(on-pred)<0.05]
    nb=0.5*pred+0.5*near[np.argmax([flux[int(t*FR)] for t in near])] if len(near) else pred
    p=0.85*p+0.15*(nb-b[-1]); b.append(nb)
  return b
beats=track(0.75,float(sys.argv[2]),0.295)
def pk(a,t): i=int(t*FR); return a[max(0,i-1):i+2].max()
for ph in range(3):
  sel=beats[ph::3]
  print('phase',ph,'flux',round(np.mean([pk(flux,t) for t in sel]),2),'low',round(np.mean([pk(low,t) for t in sel]),2))
json.dump({"//":"From scripts/waltz-beats.py. 3 beats a bar; bar n starts at beats[3n+phase]. phase is chosen by ear (ReelDebug).","phase":0,"musicStart":0.65,"beats":[round(float(t),4) for t in beats]},open(sys.argv[3],"w"),indent=1)
print(len(beats),'beats; bar periods (every 3):',[round(beats[i+3]-beats[i],3) for i in range(0,len(beats)-3,3)])
