// PICKYLA v18 Session 4 - Coach Kyle operational workflow adoption
(function(){
  const q=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>'₱'+Number(v||0).toLocaleString('en-PH',{maximumFractionDigits:2});
  const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const todayKey=()=>ymd(new Date());
  const hour=h=>{h=Number(h);if(h===24)return'12:00 MN';return `${h%12||12}:00 ${h<12?'AM':'PM'}`;};
  const cancelled=b=>b.status==='cancelled'||['client_cancelled','coach_cancelled'].includes(b.session_status);
  let state={rows:[],paid:new Map(),expanded:{upcoming:false,past:false,payment:false,completed:false}};

  function addNavLinks(){
    const nav=document.querySelector('.admin-menu-links');if(!nav||nav.querySelector('[href="#v18s4UpcomingSection"]'))return;
    const today=nav.querySelector('[href="#todayCommandSection"]');
    const links=[['#v18s4UpcomingSection','Upcoming'],['#v18s4PastSection','Past Sessions'],['#v18s4PaymentSection','Payment Follow-up'],['#v18s4CompletedSection','Completed']];
    let anchor=today;links.forEach(([href,label])=>{const a=document.createElement('a');a.href=href;a.textContent=label;anchor.after(a);anchor=a;});
  }
  function sectionHtml(id,eyebrow,title,note,listId,countId,toggleId){
    return `<section class="panel v18s4-ops-panel" id="${id}"><div class="panel-head v18s4-panel-head"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2><p class="panel-note">${note}</p></div><span id="${countId}" class="v18s4-count">0</span></div><div id="${listId}" class="v18s4-list"><div class="empty">Loading…</div></div><div class="v18s4-toggle-row"><button id="${toggleId}" class="secondary" type="button">Show All</button></div></section>`;
  }
  function installSections(){
    if(q('v18s4OperationsFlow'))return;
    const today=q('todayCommandSection'),payments=q('paymentDashboardSection');if(!today||!payments)return;
    const wrap=document.createElement('div');wrap.id='v18s4OperationsFlow';wrap.className='v18s4-operations-flow';
    wrap.innerHTML=`<section class="v18s4-flow-heading"><div><span class="eyebrow">BOOKING FLOW</span><h2>Daily coaching operations</h2><p>Today stays focused on active sessions. Future, overdue, collection, and completed records move into their own sections automatically.</p></div><button id="v18s4ManualBookingBtn" class="secondary" type="button">+ Manual Booking</button></section>
      ${sectionHtml('v18s4UpcomingSection','UPCOMING','Upcoming Bookings','Future scheduled sessions only. Today is kept separate so bookings never appear twice.','v18s4UpcomingList','v18s4UpcomingCount','v18s4UpcomingToggle')}
      ${sectionHtml('v18s4PastSection','PAST • NEEDS COMPLETION','Past Sessions','Past scheduled sessions stay here until you close them as Completed, No Show, Client Cancelled, or Coach Cancelled.','v18s4PastList','v18s4PastCount','v18s4PastToggle')}
      ${sectionHtml('v18s4PaymentSection','PAYMENT FOLLOW-UP','Completed Sessions with Balance','Completed coaching sessions that still need collection. Record the remaining payment directly here.','v18s4PaymentList','v18s4PaymentCount','v18s4PaymentToggle')}
      ${sectionHtml('v18s4CompletedSection','COMPLETED','Completed Sessions','Fully settled completed sessions. Latest three are shown by default.','v18s4CompletedList','v18s4CompletedCount','v18s4CompletedToggle')}`;
    payments.before(wrap);q('collectionAlertSection')?.classList.add('v18s4-legacy-hidden');
    q('v18s4ManualBookingBtn').onclick=()=>{q('bookingToolsSection')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>q('bookingDate')?.focus(),500);};
    [['upcoming','v18s4UpcomingToggle'],['past','v18s4PastToggle'],['payment','v18s4PaymentToggle'],['completed','v18s4CompletedToggle']].forEach(([key,id])=>q(id).onclick=()=>{state.expanded[key]=!state.expanded[key];renderAll();});
    addNavLinks();
  }
  function installManualPaymentFields(){
    const amount=q('amountPaid');if(!amount||q('bookingPaymentMethod'))return;
    const label=amount.closest('label');if(!label)return;
    label.insertAdjacentHTML('afterend',`<label>Payment method<select id="bookingPaymentMethod"><option>Cash</option><option>GCash</option><option>Bank Transfer</option><option>Maya</option><option>Other</option></select></label><label>Payment date<input id="bookingPaymentDate" type="date"></label>`);
    q('bookingPaymentDate').value=todayKey();
    const date=q('bookingDate');if(date&&!date.closest('label')?.querySelector('.v18s4-past-help')){const small=document.createElement('small');small.className='v18s4-past-help';small.textContent='Past dates are allowed for missed entries. Close the session afterward so Earned Income reflects the actual session date.';date.closest('label').appendChild(small);}
  }
  function paidFor(b){return Number(state.paid.get(b.id)||0);}
  function paymentState2(b){const total=Number(b.total_amount||0),paid=paidFor(b),balance=Math.max(0,total-paid);return{total,paid,balance,status:balance<=.001?'Paid':paid>0?'Partial':'Unpaid'};}
  function endMoment(b){const d=new Date(String(b.session_date)+'T00:00:00');d.setHours(Number(b.end_hour||0),0,0,0);return d;}
  async function load(){
    installSections();installManualPaymentFields();if(typeof db==='undefined')return;
    const {data,error}=await db.from('bookings').select('*').order('session_date',{ascending:false}).order('start_hour',{ascending:true}).limit(700);
    if(error){['v18s4UpcomingList','v18s4PastList','v18s4PaymentList','v18s4CompletedList'].forEach(id=>{if(q(id))q(id).innerHTML=`<div class="empty">${esc(error.message)}</div>`;});return;}
    state.rows=data||[];state.paid=new Map();const ids=state.rows.map(x=>x.id);
    if(ids.length){const {data:p,error:pe}=await db.from('booking_payments').select('booking_id,amount').in('booking_id',ids);if(!pe)(p||[]).forEach(x=>state.paid.set(x.booking_id,(state.paid.get(x.booking_id)||0)+Number(x.amount||0)));else state.rows.forEach(b=>state.paid.set(b.id,Number(b.amount_paid||0)));}
    renderAll();
  }
  function buckets(){
    const today=todayKey(),active=state.rows.filter(b=>!cancelled(b)),scheduled=active.filter(b=>(b.session_status||'scheduled')==='scheduled');
    const upcoming=scheduled.filter(b=>String(b.session_date)>today).sort((a,b)=>String(a.session_date).localeCompare(String(b.session_date))||Number(a.start_hour)-Number(b.start_hour));
    const past=scheduled.filter(b=>String(b.session_date)<today).sort((a,b)=>String(b.session_date).localeCompare(String(a.session_date))||Number(a.start_hour)-Number(b.start_hour));
    const completed=active.filter(b=>b.session_status==='completed');
    const payment=completed.filter(b=>paymentState2(b).balance>.001).sort((a,b)=>String(b.session_closed_at||b.session_date).localeCompare(String(a.session_closed_at||a.session_date)));
    const settled=completed.filter(b=>paymentState2(b).balance<=.001).sort((a,b)=>String(b.session_closed_at||b.session_date).localeCompare(String(a.session_closed_at||a.session_date)));
    return{upcoming,past,payment,completed:settled};
  }
  function renderAll(){const b=buckets();renderList('upcoming',b.upcoming,'v18s4UpcomingList','v18s4UpcomingCount','v18s4UpcomingToggle',5);renderList('past',b.past,'v18s4PastList','v18s4PastCount','v18s4PastToggle',5);renderList('payment',b.payment,'v18s4PaymentList','v18s4PaymentCount','v18s4PaymentToggle',5);renderList('completed',b.completed,'v18s4CompletedList','v18s4CompletedCount','v18s4CompletedToggle',3);}
  function renderList(kind,rows,listId,countId,toggleId,limit){
    const list=q(listId),count=q(countId),toggle=q(toggleId);if(!list)return;count.textContent=String(rows.length);const shown=state.expanded[kind]?rows:rows.slice(0,limit);
    list.innerHTML=shown.length?shown.map(b=>cardHtml(b,kind)).join(''):`<div class="empty">${emptyText(kind)}</div>`;toggle.hidden=rows.length<=limit;toggle.textContent=state.expanded[kind]?'Show Less':`Show All (${rows.length})`;toggle.setAttribute('aria-expanded',String(state.expanded[kind]));bindActions(list,shown);
  }
  function emptyText(kind){return{upcoming:'No upcoming confirmed bookings.',past:'No past sessions need completion.',payment:'No completed sessions need payment follow-up.',completed:'No fully settled completed sessions yet.'}[kind];}
  function cardHtml(b,kind){
    const p=paymentState2(b),court=b.court_name||'Not specified',date=new Date(String(b.session_date)+'T00:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}),status=kind==='past'?'Needs Closing':kind==='payment'?'Completed • Balance Due':kind==='completed'?'Completed':'Scheduled';
    const paymentLine=b.client_program_id?'Program package payment tracked separately':`${p.status} • Collected ${money(p.paid)} • Balance ${money(p.balance)}`;
    let actions=`<button type="button" data-act="profile" data-id="${b.id}">Profile</button><button type="button" data-act="card" data-id="${b.id}">Confirmation Card</button>`;
    if((kind==='upcoming'||kind==='payment')&&p.balance>.001&&!b.client_program_id)actions+=`<button type="button" class="primary" data-act="pay" data-id="${b.id}">${kind==='payment'?'Record Remaining Payment':'Record Payment'}</button>`;
    if(kind==='past')actions+=`<button type="button" class="v18s4-complete" data-act="status" data-status="completed" data-id="${b.id}">Completed</button><button type="button" data-act="status" data-status="no_show" data-id="${b.id}">No Show</button><button type="button" data-act="status" data-status="client_cancelled" data-id="${b.id}">Client Cancelled</button><button type="button" data-act="status" data-status="coach_cancelled" data-id="${b.id}">Coach Cancelled</button>`;
    return `<article class="v18s4-booking-card"><div class="v18s4-card-top"><div><span class="v18s4-date">${esc(date)} • ${hour(b.start_hour)}–${hour(b.end_hour)}</span><h3>${esc(b.client_name)}</h3><p>${Number(b.participant_count||1)} player${Number(b.participant_count||1)===1?'':'s'} • ${esc(b.coaching_type||'Coaching')}<br><strong>Court:</strong> ${esc(court)}</p></div><span class="v18s4-state ${kind}">${esc(status)}</span></div><div class="v18s4-money"><strong>${money(p.total)}</strong><span>${esc(paymentLine)}</span></div><div class="v18s4-actions">${actions}</div></article>`;
  }
  function bindActions(list,rows){const map=new Map(rows.map(b=>[String(b.id),b]));list.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=async()=>{const b=map.get(btn.dataset.id);if(!b)return;if(btn.dataset.act==='profile'){if(b.client_id&&typeof openV17Client==='function')return openV17Client(b.client_id);alert('No linked player profile for this booking yet.');return;}if(btn.dataset.act==='card'){if(typeof openConfirmationCard==='function')return openConfirmationCard(b);return;}if(btn.dataset.act==='pay'){if(typeof updatePayment==='function')return updatePayment(b);return;}if(btn.dataset.act==='status'&&typeof setV17SessionStatus==='function'){await setV17SessionStatus(b,btn.dataset.status);await load();}});}
  function wrapRefreshes(){
    if(window.__pickylaS4Wrapped)return;window.__pickylaS4Wrapped=true;
    const pf=q('paymentForm');if(pf&&pf.onsubmit){const old=pf.onsubmit;pf.onsubmit=async function(e){await old.call(this,e);setTimeout(load,250);};}
    const qb=q('quickBookingForm');if(qb&&qb.onsubmit){const old=qb.onsubmit;qb.onsubmit=async function(e){await old.call(this,e);setTimeout(load,350);};}
    const priorSet=typeof setV17SessionStatus==='function'?setV17SessionStatus:null;if(priorSet)setV17SessionStatus=async function(...args){const r=await priorSet(...args);await load();return r;};
  }
  function install(){installSections();installManualPaymentFields();wrapRefreshes();load();window.addEventListener('focus',()=>setTimeout(load,120));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(load,120);});window.pickylaV18Session4Ready=true;}
  let tries=0,t=setInterval(()=>{tries++;if(typeof db!=='undefined'&&q('todayCommandSection')&&q('quickBookingForm')){clearInterval(t);install();}else if(tries>40)clearInterval(t);},250);
})();