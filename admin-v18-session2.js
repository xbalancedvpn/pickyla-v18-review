// PICKYLA v18 Session 2 - Progress & Shareable Cards
(function(){
  const S2 = {
    skills: [
      {id:'scoreServe',key:'serve',label:'Serve',group:'Fundamentals'},
      {id:'scoreReturn',key:'return_score',label:'Return of Serve',group:'Fundamentals'},
      {id:'scoreForehand',key:'forehand',label:'Forehand',group:'Fundamentals'},
      {id:'scoreBackhand',key:'backhand',label:'Backhand',group:'Fundamentals'},
      {id:'scoreDinking',key:'dinking',label:'Dinking',group:'Fundamentals'},
      {id:'scoreFootwork',key:'footwork',label:'Footwork',group:'Movement & Court Awareness'},
      {id:'scorePositioning',key:'positioning',label:'Positioning',group:'Movement & Court Awareness'},
      {id:'scoreConsistency',key:'consistency',label:'Consistency',group:'Performance'},
      {id:'scoreStrategy',key:'strategy',label:'Strategy',group:'Performance'},
      {id:'scoreConfidence',key:'confidence',label:'Confidence',group:'Performance'}
    ],
    labels:{1:'Foundation Needed',2:'Emerging',3:'Functional',4:'Consistent',5:'Strong'},
    progressDataUrl:'',
    progressFilename:'',
    confirmationDataUrl:'',
    confirmationFilename:'',
    weeklyDataUrl:'',
    weeklyFilename:''
  };
  const q=id=>document.getElementById(id);
  const clean=v=>String(v??'').trim();
  const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const slug=v=>clean(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'player';
  const dateKey=()=>new Date().toISOString().slice(0,10);
  const phDate=v=>new Date(String(v)+'T00:00:00').toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const hourLabel=h=>{h=Number(h);if(h===24)return'12:00 MN';return `${h%12||12}:00 ${h<12?'AM':'PM'}`;};
  const round=(ctx,x,y,w,h,r,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}};
  const image=src=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src;});
  function wrap(ctx,text,x,y,maxWidth,lineHeight,maxLines=4){
    const words=String(text||'').split(/\s+/).filter(Boolean),lines=[];let line='';
    for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;if(lines.length>=maxLines-1)break;}else line=test;}
    if(line&&lines.length<maxLines)lines.push(line);
    lines.forEach((t,i)=>ctx.fillText(t,x,y+i*lineHeight));
    return y+lines.length*lineHeight;
  }
  async function toFile(dataUrl,filename){
    const blob=await (await fetch(dataUrl)).blob();
    try{return new File([blob],filename,{type:'image/png'});}catch(_e){blob.name=filename;return blob;}
  }
  async function savePng(dataUrl,filename){
    if(!dataUrl)return;
    const file=await toFile(dataUrl,filename),url=URL.createObjectURL(file),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    if(typeof toast==='function')toast('PNG save started');
  }
  async function sharePng(dataUrl,filename,title){
    if(!dataUrl)return;
    const file=await toFile(dataUrl,filename);
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file],title});return;}catch(e){if(e?.name==='AbortError')return;}
    }
    await savePng(dataUrl,filename);
    if(typeof toast==='function')toast('Sharing is not supported here — PNG save started instead');
  }

  // ---- 1-5 progress assessment UI ----
  function buildRatingUi(){
    const grid=document.querySelector('#assessmentDialog .assessment-grid');if(!grid||grid.dataset.v18s2==='1')return;
    grid.dataset.v18s2='1';grid.classList.add('v18s2-assessment-grid');
    const groups=[...new Set(S2.skills.map(s=>s.group))];
    grid.innerHTML='';
    groups.forEach(group=>{
      const sec=document.createElement('section');sec.className='v18s2-skill-group';
      sec.innerHTML=`<div class="v18s2-skill-group-title"><strong>${safe(group)}</strong><span>Tap 1–5</span></div><div class="v18s2-skill-list"></div>`;
      const list=sec.querySelector('.v18s2-skill-list');
      S2.skills.filter(s=>s.group===group).forEach(s=>{
        let select=q(s.id);
        if(!select){select=document.createElement('select');select.id=s.id;}
        select.classList.add('v18s2-native-score');
        const row=document.createElement('div');row.className='v18s2-rating-row';row.dataset.skill=s.key;
        row.innerHTML=`<div class="v18s2-rating-head"><strong>${safe(s.label)}</strong><span id="v18s2_status_${s.key}">Not rated</span></div>
          <div class="v18s2-rating-buttons">${[1,2,3,4,5].map(n=>`<button type="button" data-score="${n}" aria-label="${safe(s.label)} ${n} - ${safe(S2.labels[n])}"><b>${n}</b><small>${safe(S2.labels[n])}</small></button>`).join('')}</div>`;
        row.appendChild(select);list.appendChild(row);
        row.querySelectorAll('[data-score]').forEach(btn=>btn.onclick=()=>{
          const n=btn.dataset.score;select.value=n;
          row.querySelectorAll('[data-score]').forEach(x=>x.classList.toggle('active',x===btn));
          const st=q('v18s2_status_'+s.key);if(st)st.textContent=`${n} • ${S2.labels[n]}`;
        });
      });
      grid.appendChild(sec);
    });
    const note=q('assessmentNote')?.closest('label');
    if(note&&!note.querySelector('.v18s2-note-help'))note.insertAdjacentHTML('beforeend','<small class="v18s2-note-help">Suggested: note what improved, what remains inconsistent, and the next coaching focus.</small>');
  }
  function resetRatingUi(){
    S2.skills.forEach(s=>{const sel=q(s.id);if(sel)sel.value='';const row=document.querySelector(`.v18s2-rating-row[data-skill="${s.key}"]`);row?.querySelectorAll('[data-score]').forEach(b=>b.classList.remove('active'));const st=q('v18s2_status_'+s.key);if(st)st.textContent='Not rated';});
  }
  function installAssessment(){
    buildRatingUi();
    const btn=q('addAssessmentBtn');if(btn&&!btn.dataset.v18s2){
      btn.dataset.v18s2='1';const prior=btn.onclick;
      btn.onclick=function(e){if(prior)prior.call(this,e);buildRatingUi();resetRatingUi();};
    }
  }

  async function activeProgramLine(clientId){
    const {data:ens}=await db.from('client_programs').select('*').eq('client_id',clientId).in('status',['active','completed']).order('created_at',{ascending:false}).limit(1);
    const en=ens?.[0];if(!en)return'';
    const [{data:p},{count}]=await Promise.all([
      db.from('coaching_programs').select('name,session_count').eq('id',en.program_id).maybeSingle(),
      db.from('bookings').select('id',{count:'exact',head:true}).eq('client_program_id',en.id).eq('session_status','completed').neq('status','cancelled')
    ]);
    return p?`${p.name} • ${Number(count||0)}/${p.session_count} sessions completed`:'';
  }

  // ---- Progress Card ----
  async function generateProgressCard(){
    if(typeof v17SelectedClient==='undefined'||!v17SelectedClient)return alert('Open a player profile first.');
    const client=v17SelectedClient;
    const {data:rows,error}=await db.from('progress_assessments').select('*').eq('client_id',client.id).order('assessment_date',{ascending:true}).order('created_at',{ascending:true});
    if(error)return alert(error.message);if(!(rows||[]).length)return alert('Add a progress assessment first.');
    const assessments=rows||[],baseline=assessments.find(x=>x.assessment_type==='initial')||assessments[0],current=assessments.at(-1),program=await activeProgramLine(client.id);
    const rated=S2.skills.filter(s=>current[s.key]!=null);
    const improvements=S2.skills.map(s=>({label:s.label,delta:(Number(current[s.key]||0)-Number(baseline[s.key]||0)),score:Number(current[s.key]||0)})).filter(x=>x.score>0).sort((a,b)=>b.delta-a.delta||b.score-a.score);
    const focus=[...S2.skills].filter(s=>current[s.key]!=null).map(s=>({label:s.label,score:Number(current[s.key])})).sort((a,b)=>a.score-b.score).slice(0,3);
    const W=1600,H=2000,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
    x.fillStyle='#f5f3eb';x.fillRect(0,0,W,H);
    x.fillStyle='#111';x.fillRect(0,0,W,330);x.fillStyle='#f5c400';x.fillRect(0,322,W,8);
    x.fillStyle='rgba(245,196,0,.10)';x.beginPath();x.moveTo(1120,0);x.lineTo(1600,0);x.lineTo(1600,330);x.lineTo(1320,330);x.closePath();x.fill();
    try{const logo=await image('pickyla-emblem-final.png');x.drawImage(logo,72,50,185,185);}catch(_e){}
    x.fillStyle='#fff';x.font='900 60px Arial';x.fillText('PLAYER PROGRESS',305,112);
    x.fillStyle='#f5c400';x.font='900 36px Arial';x.fillText(client.full_name||'PICKYLA Player',305,174);
    x.fillStyle='#cfcfcf';x.font='500 21px Arial';x.fillText(`Latest assessment • ${phDate(current.assessment_date)}`,305,220);
    if(program){x.fillStyle='#fff';x.font='700 20px Arial';wrap(x,program,305,262,900,27,2);}
    x.fillStyle='#111';x.font='900 30px Arial';x.fillText('SKILL DEVELOPMENT',70,405);
    x.fillStyle='#666';x.font='500 18px Arial';x.fillText('1 Foundation Needed  •  2 Emerging  •  3 Functional  •  4 Consistent  •  5 Strong',70,438);
    const top=492,rowH=103,labelX=82,barX=390,barW=620;
    S2.skills.forEach((s,i)=>{
      const y=top+i*rowH,b=Number(baseline[s.key]||0),cur=Number(current[s.key]||0),delta=cur&&b?cur-b:null;
      round(x,58,y-40,1484,82,14,i%2?'#fbfaf6':'#ece9df');
      x.fillStyle='#111';x.font='800 23px Arial';x.fillText(s.label,labelX,y+4);
      x.fillStyle='#d6d2c8';round(x,barX,y-13,barW,22,11,'#d6d2c8');
      if(cur)round(x,barX,y-13,(barW/5)*cur,22,11,'#f5c400');
      x.fillStyle='#555';x.font='700 19px Arial';x.fillText(`BASE ${b||'—'}`,1055,y+3);
      x.fillStyle='#111';x.font='900 21px Arial';x.fillText(`NOW ${cur||'—'}`,1195,y+3);
      if(delta!==null){x.fillStyle=delta>0?'#2b7a3d':delta<0?'#a63a35':'#777';x.font='900 22px Arial';x.fillText(delta>0?`+${delta}`:`${delta}`,1380,y+3);}
    });
    const summaryY=1550;
    round(x,58,summaryY,720,250,22,'#111');
    x.fillStyle='#f5c400';x.font='900 22px Arial';x.fillText('PROGRESS HIGHLIGHTS',88,summaryY+48);
    x.fillStyle='#fff';x.font='700 22px Arial';
    const topImp=improvements.filter(v=>v.delta>0).slice(0,3);
    if(topImp.length)topImp.forEach((v,i)=>x.fillText(`• ${v.label}  +${v.delta}`,92,summaryY+92+i*38));
    else x.fillText('• Keep building consistent repetitions',92,summaryY+98);
    round(x,802,summaryY,740,250,22,'#fff','#d8d3c8');
    x.fillStyle='#111';x.font='900 22px Arial';x.fillText('NEXT COACHING FOCUS',832,summaryY+48);
    x.font='700 21px Arial';focus.forEach((v,i)=>x.fillText(`${i+1}. ${v.label}  •  ${v.score}/5`,836,summaryY+92+i*38));
    x.fillStyle='#111';x.font='900 24px Arial';x.fillText('COACH NOTE',70,1852);
    x.fillStyle='#444';x.font='500 19px Arial';wrap(x,current.coach_note||'Continue building repeatable technique and confident decision-making.',70,1885,1100,27,3);
    x.fillStyle='#111';x.fillRect(0,H-82,W,82);x.fillStyle='#f5c400';x.font='900 22px Arial';x.fillText('PICKYLA',70,H-36);
    x.textAlign='right';x.fillStyle='#bbb';x.font='500 17px Arial';x.fillText(`${assessments.length} assessment${assessments.length===1?'':'s'} • Player-safe card`,W-70,H-36);x.textAlign='left';
    S2.progressDataUrl=cv.toDataURL('image/png');S2.progressFilename=`pickyla-progress-${slug(client.full_name)}-${dateKey()}.png`;
    q('progressCardPreview').src=S2.progressDataUrl;q('progressCardDialog')?.showModal();
  }
  function installProgressCard(){
    const old=q('generateProgressCardBtn');if(old&&!old.dataset.v18s2){
      const btn=old.cloneNode(true);btn.dataset.v18s2='1';btn.textContent='Progress Card';old.replaceWith(btn);btn.onclick=generateProgressCard;
    }
    const oldSave=q('downloadProgressCard');if(oldSave&&!oldSave.dataset.v18s2){
      const save=oldSave.cloneNode(true);save.dataset.v18s2='1';save.textContent='Save PNG';oldSave.replaceWith(save);save.onclick=()=>savePng(S2.progressDataUrl,S2.progressFilename||'pickyla-progress.png');
      const share=document.createElement('button');share.type='button';share.className='secondary';share.id='v18s2ShareProgress';share.textContent='Share';share.onclick=()=>sharePng(S2.progressDataUrl,S2.progressFilename||'pickyla-progress.png','PICKYLA Player Progress');save.before(share);
    }
  }

  // ---- Booking Confirmation Card ----
  async function generateConfirmationCard(b){
    const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
    x.fillStyle='#0d0d0d';x.fillRect(0,0,W,H);
    x.fillStyle='#f5c400';x.beginPath();x.moveTo(650,0);x.lineTo(W,0);x.lineTo(W,340);x.lineTo(850,340);x.closePath();x.fill();
    x.fillStyle='rgba(255,255,255,.04)';x.beginPath();x.moveTo(0,880);x.lineTo(350,650);x.lineTo(470,1350);x.lineTo(0,1350);x.closePath();x.fill();
    try{const logo=await image('pickyla-logo-final.png');const ratio=logo.width/logo.height,h=130,w=h*ratio;x.drawImage(logo,64,54,w,h);}catch(_e){}
    x.fillStyle='#f5c400';x.font='900 20px Arial';x.fillText('SESSION CONFIRMED',68,252);
    x.fillStyle='#fff';x.font='900 54px Arial';wrap(x,b.client_name||'PICKYLA Player',68,318,820,62,2);
    x.fillStyle='#aaa';x.font='500 21px Arial';x.fillText('Your PICKYLA coaching session is reserved.',68,430);
    round(x,58,482,964,590,30,'#171717','#303030');
    const details=[
      ['DATE',phDate(b.session_date)],
      ['TIME',`${hourLabel(b.start_hour)} – ${hourLabel(b.end_hour)}`],
      ['SESSION',b.coaching_type||'Pickleball Coaching'],
      ['PLAYERS',`${b.participant_count||1} player${Number(b.participant_count||1)===1?'':'s'}`],
      ['COURT',b.court_name||'To be confirmed']
    ];
    if(b.client_program_id)details.push(['PROGRAM',`Session ${b.program_session_number||'—'}`]);
    let y=540;
    for(const [lab,val] of details){
      x.fillStyle='#f5c400';x.font='900 16px Arial';x.fillText(lab,100,y);
      x.fillStyle='#fff';x.font='800 28px Arial';y=wrap(x,val,100,y+38,850,35,2)+46;
    }
    x.fillStyle='#f5c400';x.font='900 17px Arial';x.fillText('COACH',72,1140);x.fillStyle='#fff';x.font='800 25px Arial';x.fillText('Kyla Nicole Soriano',72,1177);
    x.fillStyle='#f5c400';x.font='900 17px Arial';x.fillText('LOCATION',72,1225);x.fillStyle='#fff';x.font='700 22px Arial';x.fillText(b.court_name||'Santiago City, Isabela',72,1260);
    x.textAlign='right';x.fillStyle='#888';x.font='500 17px Arial';x.fillText('Please message PICKYLA for schedule changes.',W-64,1298);x.textAlign='left';
    S2.confirmationDataUrl=cv.toDataURL('image/png');S2.confirmationFilename=`pickyla-booking-${slug(b.client_name)}-${b.session_date}.png`;
    q('confirmationCardPreview').src=S2.confirmationDataUrl;q('confirmationCardDialog')?.showModal();
  }
  function installConfirmation(){
    if(typeof openConfirmationCard==='function')openConfirmationCard=generateConfirmationCard;
    const title=q('confirmationCardDialog')?.querySelector('.editor-head h2');if(title)title.textContent='Shareable player card';
    const save=q('downloadConfirmationCard');if(save&&!save.dataset.v18s2){save.dataset.v18s2='1';save.textContent='Save PNG';save.onclick=()=>savePng(S2.confirmationDataUrl,S2.confirmationFilename||'pickyla-booking-confirmation.png');const share=document.createElement('button');share.type='button';share.className='secondary';share.textContent='Share';share.id='v18s2ShareConfirmation';share.onclick=()=>sharePng(S2.confirmationDataUrl,S2.confirmationFilename||'pickyla-booking-confirmation.png','PICKYLA Booking Confirmation');save.before(share);}
  }

  // ---- Weekly Schedule Card ----
  function localDate(s){const [y,m,d]=String(s).split('-').map(Number);return new Date(y,m-1,d);}
  function sunday(input){const d=input instanceof Date?new Date(input):localDate(input);d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return d;}
  function weekDates(input){const a=sunday(input),out=[];for(let i=0;i<7;i++){const d=new Date(a);d.setDate(a.getDate()+i);out.push(d);}return out;}
  function ymd(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function rangeText(input){const d=weekDates(input),a=d[0],b=d[6];return `${a.toLocaleDateString('en-PH',{month:'short',day:'numeric'})} – ${b.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}`;}
  async function generateWeekly(){
    const btn=q('generateWeeklyBtn'),input=q('weeklyWeekDate');if(!btn||!input)return;
    const old=btn.textContent;btn.disabled=true;btn.textContent='Generating…';
    try{
      const days=weekDates(input.value||dateKey()),start=ymd(days[0]),end=ymd(days[6]);
      const {data,error}=await db.from('schedule_slots').select('slot_date,start_hour,status').gte('slot_date',start).lte('slot_date',end).order('slot_date').order('start_hour');if(error)throw error;
      const map=new Map((data||[]).map(r=>[`${r.slot_date}|${Number(r.start_hour)}`,r.status]));
      const W=1920,H=1390,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
      x.fillStyle='#f7f5ee';x.fillRect(0,0,W,H);
      x.fillStyle='#111';x.fillRect(0,0,W,205);x.fillStyle='#f5c400';x.fillRect(0,197,W,8);
      try{const logo=await image('pickyla-logo-final.png');const rh=126,rw=rh*(logo.width/logo.height);x.drawImage(logo,54,34,rw,rh);}catch(_e){}
      x.fillStyle='#f5c400';x.font='900 24px Arial';x.fillText('WEEKLY COACHING SCHEDULE',520,78);
      x.fillStyle='#fff';x.font='800 37px Arial';x.fillText(rangeText(input.value||dateKey()),520,128);
      x.fillStyle='#bbb';x.font='500 19px Arial';x.fillText('Privacy-safe view • booked slots never show player names',520,164);
      const left=48,top=246,timeW=235,gridW=W-left*2,dayW=(gridW-timeW)/7,headH=82,rowH=58;
      round(x,left,top,timeW,headH,12,'#111');x.fillStyle='#fff';x.textAlign='center';x.font='900 22px Arial';x.fillText('TIME',left+timeW/2,top+50);
      const names=['SUN','MON','TUE','WED','THU','FRI','SAT'];
      days.forEach((d,i)=>{const xx=left+timeW+i*dayW;round(x,xx+2,top,dayW-4,headH,12,'#111');x.fillStyle='#f5c400';x.font='900 19px Arial';x.fillText(names[i],xx+dayW/2,top+31);x.fillStyle='#fff';x.font='800 17px Arial';x.fillText(d.toLocaleDateString('en-PH',{month:'short',day:'numeric'}).toUpperCase(),xx+dayW/2,top+58);});
      const now=new Date();
      for(let h=8;h<24;h++){const yy=top+headH+(h-8)*rowH;round(x,left,yy+2,timeW,rowH-4,9,'#e9e6dd');x.fillStyle='#222';x.font='800 15px Arial';x.fillText(`${hourLabel(h)} – ${hourLabel(h+1)}`,left+timeW/2,yy+36);
        days.forEach((d,i)=>{const ds=ymd(d),xx=left+timeW+i*dayW,status=map.get(`${ds}|${h}`)||'available';let bg='#dff4df',fg='#225b2d',label='AVAILABLE';const dt=new Date(d);dt.setHours(h,0,0,0);
          if(status==='booked'){bg='#f7c9c5';fg='#8b2522';label='BOOKED';}
          else if(status==='unavailable'){bg='#d8d8d8';fg='#4b4b4b';label='BLOCKED';}
          else if(dt<=now){bg='#ecebe7';fg='#92918c';label='PAST';}
          round(x,xx+2,yy+2,dayW-4,rowH-4,9,bg);x.fillStyle=fg;x.font='900 14px Arial';x.fillText(label,xx+dayW/2,yy+36);
        });
      }
      x.textAlign='left';const foot=top+headH+16*rowH+34;
      x.fillStyle='#111';x.font='900 20px Arial';x.fillText('STATUS',left,foot+26);
      [['#dff4df','#225b2d','AVAILABLE'],['#f7c9c5','#8b2522','BOOKED'],['#d8d8d8','#4b4b4b','BLOCKED'],['#ecebe7','#92918c','PAST']].forEach((it,i)=>{const xx=left+110+i*245;round(x,xx,foot,215,43,10,it[0]);x.fillStyle=it[1];x.textAlign='center';x.font='900 15px Arial';x.fillText(it[2],xx+107,foot+27);});
      x.textAlign='right';x.fillStyle='#777';x.font='500 15px Arial';x.fillText('PICKYLA • Play • Learn • Improve',W-left,foot+27);x.textAlign='left';
      S2.weeklyDataUrl=cv.toDataURL('image/png');S2.weeklyFilename=`pickyla-weekly-${start}-to-${end}.png`;
      q('weeklyPreview').src=S2.weeklyDataUrl;q('weeklyPreviewWrap')?.classList.remove('hidden');q('weeklyPreviewWrap')?.scrollIntoView({behavior:'smooth',block:'nearest'});
      if(typeof toast==='function')toast('Weekly schedule card ready');
    }catch(e){alert('Could not generate weekly schedule image.\n'+e.message);}finally{btn.disabled=false;btn.textContent=old;}
  }
  function installWeekly(){
    const btn=q('generateWeeklyBtn');if(btn){btn.onclick=generateWeekly;btn.textContent='Generate Weekly Card';}
    const save=q('downloadWeeklyBtn');if(save&&!save.dataset.v18s2){save.dataset.v18s2='1';save.textContent='Save PNG';save.onclick=()=>savePng(S2.weeklyDataUrl,S2.weeklyFilename||'pickyla-weekly-schedule.png');const share=document.createElement('button');share.type='button';share.className='secondary';share.id='v18s2ShareWeekly';share.textContent='Share';share.onclick=()=>sharePng(S2.weeklyDataUrl,S2.weeklyFilename||'pickyla-weekly-schedule.png','PICKYLA Weekly Schedule');save.after(share);}
    const meta=document.querySelector('.weekly-export-meta span');if(meta)meta.textContent='Green = Available • Red = Booked • Gray = Blocked • Light gray = Past • Player names hidden';
  }

  function install(){
    if(typeof db==='undefined'||!q('assessmentDialog'))return false;
    installAssessment();installProgressCard();installConfirmation();installWeekly();
    window.pickylaV18Session2Ready=true;return true;
  }
  let n=0,t=setInterval(()=>{n++;if(install()||n>40)clearInterval(t);},250);
})();