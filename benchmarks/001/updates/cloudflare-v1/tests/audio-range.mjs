import assert from 'node:assert/strict';
import {parseByteRange,serveEpisodeAudio} from '../lib/audio-range.ts';
assert.deepEqual(parseByteRange('bytes=0-1',12),{start:0,end:1});
assert.deepEqual(parseByteRange('bytes=8-',12),{start:8,end:11});
assert.deepEqual(parseByteRange('bytes=-4',12),{start:8,end:11});
assert.deepEqual(parseByteRange('bytes=8-99',12),{start:8,end:11});
for(const value of ['bytes=12-','bytes=5-2','bytes=-0','bytes=0-2,4-5'])assert.throws(()=>parseByteRange(value,12),RangeError);
const bytes=Uint8Array.from({length:12},(_,i)=>i);let cancelled=false;
const assets={async fetch(){return new Response(new ReadableStream({start(c){for(let i=0;i<12;i+=3)c.enqueue(bytes.slice(i,i+3));},cancel(){cancelled=true}}),{headers:{'Content-Length':'12','Content-Type':'audio/mpeg','ETag':'"fixture"'}})}};
const result=await serveEpisodeAudio(new Request('https://example.test/episode.mp3',{headers:{Range:'bytes=2-6'}}),assets);
assert.equal(result.status,206);assert.equal(result.headers.get('Content-Range'),'bytes 2-6/12');assert.deepEqual(new Uint8Array(await result.arrayBuffer()),bytes.slice(2,7));assert.ok(cancelled);
const bad=await serveEpisodeAudio(new Request('https://example.test/episode.mp3',{headers:{Range:'bytes=99-'}}),assets);assert.equal(bad.status,416);
console.log('Audio range parsing, streamed slicing and early cancellation passed.');

const noLength={async fetch(){return new Response(bytes,{headers:{'Content-Type':'audio/mpeg'}})}};
const fallback=await serveEpisodeAudio(new Request('https://example.test/episode.mp3',{headers:{Range:'bytes=0-1'}}),noLength,12);assert.equal(fallback.status,206);assert.deepEqual(new Uint8Array(await fallback.arrayBuffer()),bytes.slice(0,2));
console.log('Build-time length fallback passed for an asset binding without Content-Length.');
