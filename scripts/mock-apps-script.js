// LOCAL TESTING ONLY: fake Google Sheets/Drive/Mail that runs the real google-apps-script/Code.gs in memory.
// Data is lost when you stop it. Port: MOCK_PORT env (default 4555). Inspect data at http://127.0.0.1:<port>/__state
const fs = require('fs'), vm = require('vm'), http = require('http');
const sheets = {}; const props = {}; const files = []; const mails = [];
function mkSheet(name){ const data=[]; return {
  name, data,
  getLastRow(){ return data.length; },
  getLastColumn(){ return data.reduce((m,r)=>Math.max(m,r.length),0); },
  getMaxRows(){ return Math.max(1000, data.length); },
  appendRow(r){ data.push(r.map(String)); },
  setFrozenRows(){}, 
  getRange(row,col,nr,nc){ return {
    setFontWeight(){return this;}, setNumberFormat(){return this;},
    getValues(){ const out=[]; for(let i=0;i<nr;i++){ out.push((data[row-1+i]||[]).slice(col-1,col-1+nc)); } return out; },
    setValues(v){ v.forEach((r,i)=>{ const cur=data[row-1+i]||[]; r.forEach((c,j)=>{cur[col-1+j]=String(c);}); data[row-1+i]=cur; }); return this; },
    setValue(v){ const cur=data[row-1]||[]; cur[col-1]=String(v); data[row-1]=cur; return this; },
  };},
};}
const ss = { getId:()=> 'SSID', getSheetByName:n=>sheets[n]||null, insertSheet:n=>(sheets[n]=mkSheet(n)) };
let locked=false;
const ctx = {
  console, Logger:{log:(...a)=>console.log('[Logger]',...a)},
  SpreadsheetApp:{ getActiveSpreadsheet:()=>ss, openById:()=>ss, flush(){} },
  PropertiesService:{ getScriptProperties:()=>({ getProperty:k=>props[k]??null, setProperty:(k,v)=>{props[k]=String(v);} }) },
  LockService:{ getScriptLock:()=>({ tryLock(){ if(locked) return false; locked=true; return true; }, releaseLock(){ locked=false; } }) },
  DriveApp:{ createFolder:()=>({getId:()=> 'FOLDER'}), getFolderById:()=>({ createFile(blob){ const f={name:blob.name, trashed:false, bytes:blob.bytes.length,
      getUrl:()=> 'https://drive/'+files.length, getName(){return this.name;}, setName(n){this.name=n;}, setTrashed(t){this.trashed=t;} }; files.push(f); return f; } }) },
  MailApp:{ getRemainingDailyQuota:()=>100, sendEmail:(m)=>mails.push(m) },
  Utilities:{ getUuid:()=> 'uuid-'+Math.random().toString(36).slice(2), formatDate:(d)=>d.toISOString(),
    base64Decode:s=>Buffer.from(s,'base64'), newBlob:(bytes,mime,name)=>({bytes,mime,name}) },
  ContentService:{ MimeType:{JSON:'json'}, createTextOutput:t=>({ text:t, setMimeType(){return this;} }) },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../google-apps-script/Code.gs'),'utf8'), ctx);
props.SECRET = process.env.PLINTH_SCRIPT_SECRET || "local-dev-secret";
// Optional: MOCK_PRELOAD=file.json ({ "TabName": [[header...], [row...]] }) to start with existing data.
if (process.env.MOCK_PRELOAD) {
  const pre = JSON.parse(fs.readFileSync(process.env.MOCK_PRELOAD, 'utf8'));
  for (const [name, rows] of Object.entries(pre)) { const sh = ss.insertSheet(name); rows.forEach(r => sh.appendRow(r)); }
}
try { ctx.setup(); } catch (e) { console.warn("setup():", e.message); }
http.createServer((req,res)=>{
  let b=''; req.on('data',c=>b+=c); req.on('end',()=>{
    if (req.url==='/__state'){ res.end(JSON.stringify({sheets:Object.fromEntries(Object.entries(sheets).map(([k,v])=>[k,v.data])), files, mails:mails.length, props})); return; }
    const out = ctx.doPost({postData:{contents:b}});
    res.setHeader('content-type','application/json'); res.end(out.text);
  });
}).listen(Number(process.env.MOCK_PORT) || 4555, function () { const port = this.address().port; console.log('Mock Apps Script running on http://127.0.0.1:' + port + '  (secret: ' + props.SECRET + ')'); });
