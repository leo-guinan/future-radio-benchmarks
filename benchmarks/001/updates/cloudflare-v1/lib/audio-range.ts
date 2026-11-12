// Single byte ranges for episode playback; only bounded chunks are held in memory.
export function parseByteRange(value:string,size:number){
 const match=/^bytes=(\d*)-(\d*)$/.exec(value);
 if(!match||(!match[1]&&!match[2]))throw new RangeError('Invalid byte range');
 let start:number,end:number;
 if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<1)throw new RangeError('Invalid suffix');start=Math.max(0,size-suffix);end=size-1;}
 else{start=Number(match[1]);end=match[2]?Number(match[2]):size-1;}
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw new RangeError('Unsatisfiable byte range');
 return {start,end:Math.min(end,size-1)};
}
export async function serveEpisodeAudio(request:Request,assets:Fetcher,expectedSize?:number){
 const range=request.headers.get('Range');const ifRange=request.headers.get('If-Range');
 const inputHeaders=new Headers(request.headers);inputHeaders.delete('Range');inputHeaders.delete('If-Range');
 const full=await assets.fetch(new Request(request,{headers:inputHeaders}));if(full.status!==200)return full;
 const headers=new Headers(full.headers);headers.set('Accept-Ranges','bytes');
 const size=Number(headers.get('Content-Length'))||expectedSize||0;
 if(request.method==='HEAD'||!range||!Number.isSafeInteger(size)||size<1||(ifRange&&ifRange!==headers.get('ETag')&&ifRange!==headers.get('Last-Modified')))return new Response(full.body,{status:200,headers});
 let selected:{start:number;end:number};try{selected=parseByteRange(range,size);}catch{await full.body?.cancel();headers.set('Content-Range',`bytes */${size}`);headers.set('Content-Length','0');return new Response(null,{status:416,headers});}
 if(!full.body)return full;
 const {start,end}=selected,reader=full.body.getReader();let offset=0;
 const body=new ReadableStream<Uint8Array>({async pull(controller){
  while(true){const {done,value}=await reader.read();if(done){controller.close();return;}
   const from=Math.max(0,start-offset),to=Math.min(value.length,end+1-offset);offset+=value.length;
   if(to>from)controller.enqueue(value.subarray(from,to));
   if(offset>end){await reader.cancel();controller.close();return;}
   if(to>from)return;
  }
 },cancel(reason){return reader.cancel(reason);}});
 headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));
 return new Response(body,{status:206,headers});
}
