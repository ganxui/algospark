import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import http from 'node:http';
import { once } from 'node:events';

async function start(limit = 100) {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const moduleUrl = new URL('../api/server.mjs', import.meta.url).href;
  const code = `globalThis.fetch = async (_url, options) => {
    const context = JSON.parse(options.body).messages.at(-1).content;
    if (context.includes('\\uFFFD')) return new Response('{}', {status: 422});
    if (context.includes('PROVIDER_FAIL')) return new Response('{}', {status: 503});
    return new Response(JSON.stringify({choices:[{message:{content:'Проверь диапазон повторений.'}}]}), {status:200});
  }; await import(${JSON.stringify(moduleUrl)});`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], {
    env: {...process.env, PORT: String(port), HOST: '127.0.0.1', ALGOSPARK_DEEPSEEK_API_KEY: 'local-test-fixture', ALGOSPARK_AI_DAILY_LIMIT: String(limit)},
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await Promise.race([once(child.stdout, 'data'), once(child, 'exit').then(([status])=>{throw Error(`API exited ${status}`);})]);
  return { child, port, url: `http://127.0.0.1:${port}/api/algospark/chat` };
}
const body = () => ({message:'Как работает цикл?',lessonId:1,lessonCount:12,taskCount:3,taskIndex:1});
async function stop(child) { const done=once(child,'exit');child.kill();await done; }

test('API accepts complete Russian chat context and split UTF-8 chunks', async () => {
  const fixture=await start();
  try {
    const payload={...body(),message:'я'.repeat(1000),lessonTitle:'я'.repeat(160),concept:'я'.repeat(360),taskQuestion:'я'.repeat(500),attempt:'я'.repeat(900),history:Array.from({length:8},()=>({role:'user',content:'я'.repeat(500)}))};
    assert.ok(Buffer.byteLength(JSON.stringify(payload))>12*1024);
    const response=await fetch(fixture.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    assert.equal(response.status,200);
    const encoded=Buffer.from(JSON.stringify(body()));
    const firstRussian=encoded.indexOf(Buffer.from('Как'));
    const split=await new Promise((resolve,reject)=>{
      const request=http.request(fixture.url,{method:'POST',headers:{'Content-Type':'application/json'}},response=>{response.resume();response.on('end',()=>resolve(response.statusCode));});
      request.on('error',reject);
      request.write(encoded.subarray(0,firstRussian+1));
      setTimeout(()=>request.end(encoded.subarray(firstRussian+1)),20);
    });
    assert.equal(split,200);
  }finally{await stop(fixture.child);}
});

test('each of the 36 tasks permits 10 questions; question 11 is refused only for that task', async () => {
  const fixture=await start(500);
  try {
    const send=(lessonId,taskIndex,clientId='11111111-1111-4111-8111-111111111111')=>fetch(fixture.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body(),lessonId,taskIndex,clientId})});
    for(let lessonId=1;lessonId<=12;lessonId++)for(let taskIndex=1;taskIndex<=3;taskIndex++){
      for(let i=0;i<10;i++){
        const response=await send(lessonId,taskIndex);
        assert.equal(response.status,200,`Lesson ${lessonId}, task ${taskIndex}, question ${i+1}`);
        assert.equal((await response.json()).quota.remaining,9-i);
      }
      const denied=await send(lessonId,taskIndex);assert.equal(denied.status,429);assert.equal((await denied.json()).error.code,'TASK_QUESTION_LIMIT');
    }
    assert.equal((await send(1,1,'22222222-2222-4222-8222-222222222222')).status,200);
  }finally{await stop(fixture.child);}
});

test('failed provider calls do not consume the 10 task questions', async () => {
  const fixture=await start(10);
  try{
    const send=message=>fetch(fixture.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body(),message})});
    for(let i=0;i<12;i++)assert.equal((await send('PROVIDER_FAIL')).status,502);
    for(let i=0;i<10;i++)assert.equal((await send('Как работает цикл?')).status,200);
    assert.equal((await send('Ещё вопрос')).status,429);
  }finally{await stop(fixture.child);}
});
