// PICKYLA v18 Session 5 - Coach Kyle finance, quick actions, and content polish
(function(){
  const q=id=>document.getElementById(id);
  const peso=v=>'₱'+Number(v||0).toLocaleString('en-PH',{maximumFractionDigits:2});
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function installQuickActions(){
    const host=document.querySelector('.admin-top-actions');if(!host||q('v18s5ShareLink'))return;
    const publicLink=host.querySelector('.top-public-link');
    const share=document.createElement('button');share.id='v18s5ShareLink';share.type='button';share.className='v18s5-quick';share.title='Share booking link';share.setAttribute('aria-label','Share booking link');share.textContent='🔗';
    const weekly=document.createElement('button');weekly.id='v18s5Weekly';weekly.type='button';weekly.className='v18s5-quick';weekly.title='Weekly availability';weekly.setAttribute('aria-label','Weekly availability');weekly.textContent='🗓️';
    if(publicLink){publicLink.after(share);share.after(weekly);}else{host.prepend(weekly);host.prepend(share);}
    share.onclick=async()=>{const url='https://pickyla-coaching.xbalanced.net/';if(navigator.share){try{await navigator.share({title:'PICKYLA Coaching',text:'Book your PICKYLA coaching session:',url});return;}catch(e){if(e?.name==='AbortError')return;}}try{await navigator.clipboard.writeText(url);if(typeof toast==='function')toast('Booking link copied');}catch(_e){prompt('Copy booking link:',url);}};
    weekly.onclick=()=>{q('weeklyShareSection')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>q('generateWeeklyBtn')?.focus(),450);};
  }
  function installFinanceSnapshot(){
    if(q('v18s5Finance'))return;const anchor=q('paymentDashboardSection');if(!anchor)return;
    const s=document.createElement('section');s.id='v18s5Finance';s.className='panel v18s5-finance';
    s.innerHTML=`<div class="panel-head"><div><span class="eyebrow">FINANCE SNAPSHOT</span><h2>This month at a glance</h2><p class="panel-note">Confirmed value is booked coaching. Cash collected is actual money received. Earned income counts completed sessions. Advance is money received for sessions not yet completed.</p></div><span class="panel-tag">CLEAR VIEW</span></div><div class="v18s5-finance-grid"><article><span>Confirmed Value</span><strong id="v18s5Confirmed">₱0</strong><small>Non-cancelled coaching booked this month</small></article><article><span>Cash Collected</span><strong id="v18s5Collected">₱0</strong><small>Payments received this month</small></article><article><span>Earned • Completed</span><strong id="v18s5Earned">₱0</strong><small>Value of completed sessions this month</small></article><article><span>Outstanding</span><strong id="v18s5Outstanding">₱0</strong><small>Uncollected balance on booked sessions</small></article><article><span>Advance / Prepaid</span><strong id="v18s5Advance">₱0</strong><small>Collected on sessions not yet completed</small></article></div>`;
    anchor.before(s);
  }
  async function loadFinance(){
    if(!q('v18s5Finance')||typeof db==='undefined')return;const now=new Date(),from=dateKey(new Date(now.getFullYear(),now.getMonth(),1)),to=dateKey(new Date(now.getFullYear(),now.getMonth()+1,0));
    const [{data:books,error:be},{data:pays,error:pe}]=await Promise.all([db.from('bookings').select('id,session_date,total_amount,status,session_status').gte('session_date',from).lte('session_date',to),db.from('booking_payments').select('booking_id,amount,paid_at').gte('paid_at',from).lte('paid_at',to)]);
    if(be||pe)return;const rows=(books||[]).filter(b=>b.status!=='cancelled'),payRows=pays||[],ids=rows.map(b=>b.id),paidByBooking=new Map();if(ids.length){const {data:allPays,error:ape}=await db.from('booking_payments').select('booking_id,amount').in('booking_id',ids);if(ape)return;(allPays||[]).forEach(p=>paidByBooking.set(p.booking_id,(paidByBooking.get(p.booking_id)||0)+Number(p.amount||0)));}
    const confirmed=rows.reduce((a,b)=>a+Number(b.total_amount||0),0),collected=payRows.reduce((a,p)=>a+Number(p.amount||0),0),earned=rows.filter(b=>b.session_status==='completed').reduce((a,b)=>a+Number(b.total_amount||0),0),outstanding=rows.reduce((a,b)=>a+Math.max(0,Number(b.total_amount||0)-Number(paidByBooking.get(b.id)||0)),0),advance=payRows.filter(p=>{const b=rows.find(x=>x.id===p.booking_id);return b&&b.session_status!=='completed';}).reduce((a,p)=>a+Number(p.amount||0),0);
    q('v18s5Confirmed').textContent=peso(confirmed);q('v18s5Collected').textContent=peso(collected);q('v18s5Earned').textContent=peso(earned);q('v18s5Outstanding').textContent=peso(outstanding);q('v18s5Advance').textContent=peso(advance);
  }
  function installGalleryCompact(){
    const list=q('v18s3GalleryList');if(!list||q('v18s5GalleryTools'))return;const tools=document.createElement('div');tools.id='v18s5GalleryTools';tools.className='v18s5-gallery-tools';tools.innerHTML='<span id="v18s5GalleryCount">0 photos</span><button id="v18s5GalleryToggle" class="secondary" type="button">Show All</button>';list.before(tools);list.classList.add('v18s5-gallery-compact');let expanded=false;
    const sync=()=>{const cards=[...list.children].filter(x=>!x.classList.contains('empty'));q('v18s5GalleryCount').textContent=`${cards.length} photo${cards.length===1?'':'s'}`;const btn=q('v18s5GalleryToggle');btn.hidden=cards.length<=5;btn.textContent=expanded?'Show Less':`Show All (${cards.length})`;list.classList.toggle('v18s5-gallery-expanded',expanded);};
    q('v18s5GalleryToggle').onclick=()=>{expanded=!expanded;sync();};new MutationObserver(()=>setTimeout(sync,0)).observe(list,{childList:true});sync();
  }
  function install(){installQuickActions();installFinanceSnapshot();installGalleryCompact();loadFinance();window.addEventListener('focus',()=>setTimeout(loadFinance,150));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(loadFinance,150);});window.pickylaV18Session5Ready=true;}
  let tries=0,t=setInterval(()=>{tries++;if(typeof db!=='undefined'&&q('paymentDashboardSection')){clearInterval(t);install();}else if(tries>40)clearInterval(t);},250);
})();