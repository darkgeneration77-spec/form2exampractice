const LEVELS=[['foundation','Foundation',1,15],['developing','Developing',16,30],['standard','Standard',31,70],['exam','Exam',71,100],['extra','Extra Practice',101,160],['challenge','Challenge',161,200]];
const STORE={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},remove(k){try{localStorage.removeItem(k)}catch(e){}}};
let BANK=[];
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]))}
function norm(s){return String(s).trim().toLowerCase().replace(/[.,!?;:]+$/,'').replace(/\s+/g,' ')}
function levelName(n){return LEVELS.find(x=>n>=x[2]&&n<=x[3])?.[1]||'Practice'}
async function loadVerifiedBank(){
 const r=await fetch('./form2_english_module2_FINAL_VERIFIED.html?source=20260913-verified',{cache:'no-store'});
 if(!r.ok)throw new Error('Verified source HTTP '+r.status);
 const text=await r.text();
 const doc=new DOMParser().parseFromString(text,'text/html');
 const sheets=[...doc.querySelectorAll('.answer-sheet[data-set]')];
 const bank=[];
 for(const sheet of sheets){
   const n=Number(sheet.dataset.set); if(!n||n<1||n>200)continue;
   const block=sheet.closest('.practice'); if(!block)continue;
   const titleNode=block.querySelector('.q p b');
   let title=titleNode?titleNode.textContent.trim():`Set ${n}`;
   if(title.includes('—'))title=title.split('—').slice(1).join('—').trim();
   const paras=[...block.querySelectorAll('.q .passage-paragraph')].map(p=>p.outerHTML);
   const inputs=[...sheet.querySelectorAll('input.answer-input')].map(inp=>({answer:inp.dataset.answer||'',explanation:inp.dataset.explanation||'',rule:inp.dataset.ruleCn||'',example:inp.dataset.example||''}));
   if(paras.length&&inputs.length===8)bank[n-1]={n,title,paras,inputs};
 }
 BANK=bank.filter(Boolean);
 if(BANK.length!==200)throw new Error('Verified source parsed '+BANK.length+'/200 sets');
 return true;
}
function hasSaved(n){try{return JSON.parse(STORE.get('answers-'+n)||'[]').some(x=>String(x||'').trim())}catch(e){return false}}
function setButton(d){const n=d.n,done=STORE.get('done-'+n)==='1',saved=hasSaved(n);return `<a class="setTile ${done?'done':''}" href="?set=${n}#practice"><span class="setNo">Set ${String(n).padStart(2,'0')}</span><span class="setTitle">${esc(d.title)}</span><span class="setStatus">${done?'✓ Completed':saved?'Continue →':'Start →'}</span></a>`}
function renderMenu(){const root=document.getElementById('practice');root.innerHTML=LEVELS.map(([id,label,a,b])=>{const ss=BANK.filter(d=>d.n>=a&&d.n<=b),done=ss.filter(d=>STORE.get('done-'+d.n)==='1').length;return `<section class="level" id="${id}"><div class="levelTitle"><div><span class="pill">${done} / ${ss.length} COMPLETE</span><h2>${label}</h2></div><small>Sets ${a}–${b}</small></div><div class="setGrid">${ss.map(setButton).join('')}</div></section>`}).join('');updateProgress()}
function renderSet(n){const d=BANK[n-1],root=document.getElementById('practice');if(!d){root.innerHTML=`<section class="level"><h2>Set ${n} is unavailable.</h2><p><a class="btn" href="./">Return to Learning Path</a></p></section>`;return}
 document.querySelector('.hero')?.classList.add('practiceMode');document.querySelector('#guide')?.classList.add('hiddenInPractice');document.querySelector('#learning-path')?.classList.add('hiddenInPractice');
 const start=n>=71?9:1,prev=n>1?n-1:null,next=n<200?n+1:null;
 root.innerHTML=`<section class="level singlePractice"><div class="practiceTop"><a class="backBtn" href="./#learning-path">← Learning Path</a><span class="setCounter">Set ${n} / 200</span></div><article class="set" data-set="${n}"><div class="setHead"><div><span class="pill">${levelName(n)}</span><h3>Set ${n} · ${esc(d.title)}</h3></div><small>8 marks</small></div><p class="instruction">${n>=71?'Questions 9–16. ':''}Read the text below and correct the eight underlined errors. Write the correct word or words in the spaces provided.</p><div class="passage">${d.paras.join('')}</div><div class="answerGrid">${d.inputs.map((q,i)=>`<div class="answerRow"><label>${start+i}.</label><input class="ans" data-i="${i}" autocomplete="off" spellcheck="false" placeholder="Type your correction"></div>`).join('')}</div><div class="actions"><button class="btn mark">Check Answers</button><button class="btn alt reset">Reset</button></div><div class="result"></div><div class="corrections"></div><div class="setNav">${prev?`<a href="?set=${prev}#practice">← Set ${prev}</a>`:'<span></span>'}${next?`<a href="?set=${next}#practice">Set ${next} →</a>`:'<span></span>'}</div></article></section>`;
 restore(n);updateProgress();setTimeout(()=>root.scrollIntoView({behavior:'smooth',block:'start'}),50)
}
function save(n){const a=document.querySelector('.set');if(a)STORE.set('answers-'+n,JSON.stringify([...a.querySelectorAll('.ans')].map(x=>x.value)))}
function restore(n){try{const v=JSON.parse(STORE.get('answers-'+n)||'[]');document.querySelectorAll('.ans').forEach((x,i)=>x.value=v[i]||'')}catch(e){}}
function mark(){const a=document.querySelector('.set'),n=Number(a.dataset.set),d=BANK[n-1],ins=[...a.querySelectorAll('.ans')],blank=ins.find(x=>!x.value.trim()),r=a.querySelector('.result'),c=a.querySelector('.corrections');if(blank){r.textContent='请先完成8题再批改。';c.classList.remove('show');blank.focus();return}let score=0,wrong=[];ins.forEach((inp,i)=>{const q=d.inputs[i],ok=norm(inp.value)===norm(q.answer);inp.classList.toggle('correct',ok);inp.classList.toggle('wrong',!ok);if(ok)score++;else wrong.push([i,q,inp.value])});r.innerHTML=score===8?'<span class="perfect">8 / 8 · Excellent. Set completed.</span>':`<strong>${score} / 8</strong> · Review ${8-score} correction${8-score===1?'':'s'} below.`;c.innerHTML=wrong.map(([i,q,v])=>`<div class="corr"><b>${i+1}. Your answer:</b> ${esc(v)}<br><b>Correct answer:</b> ${esc(q.answer)}<br><b>Why:</b> ${esc(q.explanation)}<div class="cn"><b>订正规则：</b> ${esc(q.rule)}<br><b>Example:</b> ${esc(q.example)}</div></div>`).join('');c.classList.toggle('show',wrong.length>0);save(n);if(score===8)STORE.set('done-'+n,'1');else STORE.remove('done-'+n);updateProgress()}
function reset(){const a=document.querySelector('.set'),n=Number(a.dataset.set);a.querySelectorAll('.ans').forEach(x=>{x.value='';x.className='ans'});a.querySelector('.result').textContent='';const c=a.querySelector('.corrections');c.innerHTML='';c.classList.remove('show');STORE.remove('answers-'+n);STORE.remove('done-'+n);updateProgress()}
function nextSet(){const active=BANK.find(d=>hasSaved(d.n)&&STORE.get('done-'+d.n)!=='1');if(active)return active.n;return BANK.find(d=>STORE.get('done-'+d.n)!=='1')?.n||1}
function updateProgress(){const done=BANK.filter(d=>STORE.get('done-'+d.n)==='1').length,pct=Math.round(done/200*100);const p=document.getElementById('prog'),b=document.getElementById('bar'),h=document.getElementById('heroProgress'),c=document.getElementById('continueBtn');if(p)p.textContent=`${done} / 200 completed`;if(b)b.style.width=pct+'%';if(h)h.textContent=pct+'% complete';if(c&&BANK.length){const n=nextSet();c.href=`?set=${n}#practice`;c.textContent=done?`Continue · Set ${n}`:'Start Learning'}}
document.addEventListener('click',e=>{if(e.target.classList.contains('mark'))mark();if(e.target.classList.contains('reset'))reset()});document.addEventListener('input',e=>{if(e.target.classList.contains('ans'))save(Number(document.querySelector('.set').dataset.set))});document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.classList.contains('ans')){e.preventDefault();const x=[...document.querySelectorAll('.ans')],i=x.indexOf(e.target);i<7?x[i+1].focus():mark()}});
async function boot(){const root=document.getElementById('practice');root.innerHTML='<section class="level"><h2>Loading verified practice bank…</h2><p>Reading the original 200-set source.</p></section>';try{await loadVerifiedBank();const wanted=Number(new URLSearchParams(location.search).get('set')||0);wanted?renderSet(wanted):renderMenu();updateProgress()}catch(err){console.error(err);root.innerHTML=`<section class="level"><h2>Verified practice source could not be read.</h2><p>${esc(err.message)}</p><p><a class="btn" href="form2_english_module2_FINAL_VERIFIED.html#practice">Open the original verified 200-set bank</a></p></section>`}}
const clear=document.getElementById('clearAll');if(clear)clear.onclick=()=>{if(confirm('Clear all saved answers and progress?')){for(let i=1;i<=200;i++){STORE.remove('answers-'+i);STORE.remove('done-'+i)}location.href='./'}};boot();