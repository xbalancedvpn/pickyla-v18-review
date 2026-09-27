// PICKYLA v18 - earnings chart views
// Lightweight DOM/CSS renderer: avoids responsive Chart.js canvas resize loops on mobile.
(function(){
  const q=id=>document.getElementById(id);
  const money=n=>'₱'+Number(n||0).toLocaleString('en-PH',{maximumFractionDigits:2});
  const pad=n=>String(n).padStart(2,'0');
  const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
  const monthLabel=(y,m,short=false)=>new Date(y,m,1).toLocaleDateString('en-PH',{month:short?'short':'long'});
  let activeRows=[];
  let mode='month';

  function incomeCard(){
    return q('incomeChart')?.closest('.chart-card')||null;
  }

  function titleEl(){
    return incomeCard()?.querySelector('.chart-head h2')||null;
  }

  function earliestMonth(rows){
    const dates=rows.map(r=>String(r.session_date||'')).filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s)).sort();
    return dates.length?dates[0].slice(0,7):monthKey(new Date());
  }

  function ensureYearOptions(){
    const select=q('v18EarningsYear');
    if(!select)return;
    const years=new Set([new Date().getFullYear()]);
    activeRows.forEach(r=>{
      const y=Number(String(r.session_date||'').slice(0,4));
      if(Number.isFinite(y)&&y>2000)years.add(y);
    });
    const chosen=Number(select.value)||new Date().getFullYear();
    select.innerHTML=[...years].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join('');
    select.value=years.has(chosen)?String(chosen):String(new Date().getFullYear());
  }

  function ensureUI(){
    const card=incomeCard();
    if(!card||q('v18EarningsControls'))return;

    const head=card.querySelector('.chart-head');
    const controls=document.createElement('div');
    controls.id='v18EarningsControls';
    controls.className='v18-earnings-controls';
    controls.innerHTML=`
      <div class="v18-earnings-tabs" role="group" aria-label="Earnings graph view">
        <button type="button" data-earnings-view="month" class="active" aria-pressed="true">This Month</button>
        <button type="button" data-earnings-view="year" aria-pressed="false">Monthly View</button>
        <button type="button" data-earnings-view="custom" aria-pressed="false">Custom Months</button>
      </div>
      <div class="v18-earnings-filter" id="v18EarningsYearWrap" hidden>
        <label>Year
          <select id="v18EarningsYear"></select>
        </label>
      </div>
      <div class="v18-earnings-filter v18-earnings-custom" id="v18EarningsCustomWrap" hidden>
        <label>From
          <input id="v18EarningsFrom" type="month">
        </label>
        <span>to</span>
        <label>To
          <input id="v18EarningsTo" type="month">
        </label>
      </div>
      <div class="v18-earnings-summary" id="v18EarningsSummary"></div>`;
    head?.insertAdjacentElement('afterend',controls);

    const chart=document.createElement('div');
    chart.id='v18EarningsBarChart';
    chart.className='v18-earnings-chart-wrap';
    chart.setAttribute('role','img');
    chart.setAttribute('aria-label','Earnings bar graph');
    q('incomeChart')?.insertAdjacentElement('afterend',chart);
    if(q('incomeChart'))q('incomeChart').style.display='none';
    card.querySelector('.v19-static-chart')?.remove();

    const now=new Date();
    q('v18EarningsFrom').value=earliestMonth(activeRows);
    q('v18EarningsTo').value=monthKey(now);
    ensureYearOptions();

    controls.querySelectorAll('[data-earnings-view]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        mode=btn.dataset.earningsView;
        controls.querySelectorAll('[data-earnings-view]').forEach(b=>{
          const on=b===btn;
          b.classList.toggle('active',on);
          b.setAttribute('aria-pressed',String(on));
        });
        syncFilterVisibility();
        renderEarnings();
      });
    });

    q('v18EarningsYear')?.addEventListener('change',renderEarnings);
    q('v18EarningsFrom')?.addEventListener('change',e=>{
      e.currentTarget.dataset.userSet='1';
      const from=q('v18EarningsFrom'),to=q('v18EarningsTo');
      if(from.value&&to.value&&to.value<from.value)to.value=from.value;
      renderEarnings();
    });
    q('v18EarningsTo')?.addEventListener('change',()=>{
      const from=q('v18EarningsFrom'),to=q('v18EarningsTo');
      if(from.value&&to.value&&to.value<from.value)from.value=to.value;
      renderEarnings();
    });
    syncFilterVisibility();
  }

  function syncFilterVisibility(){
    const year=q('v18EarningsYearWrap'),custom=q('v18EarningsCustomWrap');
    if(year)year.hidden=mode!=='year';
    if(custom)custom.hidden=mode!=='custom';
  }

  function dailyBuckets(){
    const now=new Date(),y=now.getFullYear(),m=now.getMonth(),days=new Date(y,m+1,0).getDate();
    const buckets=[];
    for(let d=1;d<=days;d++){
      const key=`${y}-${pad(m+1)}-${pad(d)}`;
      buckets.push({
        label:String(d),
        fullLabel:new Date(y,m,d).toLocaleDateString('en-PH',{month:'short',day:'numeric'}),
        value:activeRows.filter(r=>r.session_date===key).reduce((a,r)=>a+Number(r.total_amount||0),0)
      });
    }
    return {buckets,title:`${monthLabel(y,m)} ${y} Daily Earnings`,period:`${monthLabel(y,m)} ${y}`};
  }

  function yearlyBuckets(){
    const y=Number(q('v18EarningsYear')?.value)||new Date().getFullYear();
    const buckets=[];
    for(let m=0;m<12;m++){
      const key=`${y}-${pad(m+1)}`;
      buckets.push({
        label:monthLabel(y,m,true),
        fullLabel:`${monthLabel(y,m)} ${y}`,
        value:activeRows.filter(r=>String(r.session_date||'').startsWith(key+'-')).reduce((a,r)=>a+Number(r.total_amount||0),0)
      });
    }
    return {buckets,title:`${y} Monthly Earnings`,period:`January–December ${y}`};
  }

  function parseMonth(s){
    const m=String(s||'').match(/^(\d{4})-(\d{2})$/);
    return m?{y:Number(m[1]),m:Number(m[2])-1}:null;
  }

  function customBuckets(){
    const from=parseMonth(q('v18EarningsFrom')?.value)||parseMonth(earliestMonth(activeRows));
    const to=parseMonth(q('v18EarningsTo')?.value)||parseMonth(monthKey(new Date()));
    const start=new Date(from.y,from.m,1),end=new Date(to.y,to.m,1),buckets=[];
    if(end<start)return {buckets:[],title:'Custom Monthly Earnings',period:'Choose a valid month range'};
    const d=new Date(start);
    while(d<=end){
      const y=d.getFullYear(),m=d.getMonth(),key=`${y}-${pad(m+1)}`;
      buckets.push({
        label:`${monthLabel(y,m,true)} ${String(y).slice(-2)}`,
        fullLabel:`${monthLabel(y,m)} ${y}`,
        value:activeRows.filter(r=>String(r.session_date||'').startsWith(key+'-')).reduce((a,r)=>a+Number(r.total_amount||0),0)
      });
      d.setMonth(d.getMonth()+1);
    }
    return {
      buckets,
      title:'Custom Monthly Earnings',
      period:`${monthLabel(start.getFullYear(),start.getMonth())} ${start.getFullYear()} – ${monthLabel(end.getFullYear(),end.getMonth())} ${end.getFullYear()}`
    };
  }

  function renderBars(spec){
    const host=q('v18EarningsBarChart');
    if(!host)return;
    const max=Math.max(0,...spec.buckets.map(x=>x.value));
    const total=spec.buckets.reduce((a,x)=>a+x.value,0);
    const count=Math.max(1,spec.buckets.length);
    host.style.setProperty('--earnings-count',String(count));
    host.innerHTML=spec.buckets.length?`<div class="v18-earnings-bars">${spec.buckets.map(b=>{
      const pct=max>0?(b.value/max)*100:0;
      const h=b.value>0?Math.max(4,pct):0;
      return `<div class="v18-earnings-bar-item" title="${b.fullLabel}: ${money(b.value)}" aria-label="${b.fullLabel}, ${money(b.value)}">
        <span class="v18-earnings-value">${b.value?money(b.value):'₱0'}</span>
        <div class="v18-earnings-track"><div class="v18-earnings-fill" style="height:${h.toFixed(2)}%"></div></div>
        <span class="v18-earnings-label">${b.label}</span>
      </div>`;
    }).join('')}</div>`:'<div class="v18-earnings-empty">No months selected.</div>';
    const summary=q('v18EarningsSummary');
    if(summary)summary.innerHTML=`<strong>${money(total)}</strong><span>Booked value • ${spec.period}</span>`;
    const heading=titleEl();
    if(heading)heading.textContent=spec.title;
    host.setAttribute('aria-label',`${spec.title}. Total booked value ${money(total)}.`);
  }

  function renderEarnings(){
    ensureUI();
    ensureYearOptions();
    const spec=mode==='year'?yearlyBuckets():mode==='custom'?customBuckets():dailyBuckets();
    renderBars(spec);
  }

  function renderMix(rows){
    const mix=q('mixChart'),card=mix?.closest('.chart-card');
    if(mix)mix.style.display='none';
    if(!card)return;
    const groups=[1,2,3,4,5].map(n=>rows.filter(x=>Number(x.participant_count)===n).length);
    let box=card.querySelector('.v19-static-chart');
    if(!box){box=document.createElement('div');box.className='v19-static-chart';card.appendChild(box);}
    box.innerHTML=`<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:18px">${groups.map((v,i)=>`<div style="text-align:center;background:#f7f5ee;border-radius:10px;padding:10px 4px"><strong style="display:block;font-size:18px">${v}</strong><small style="font-size:8px;color:#666a70">${i+1}P</small></div>`).join('')}</div><small style="display:block;margin-top:10px;color:#8a8a84">Bookings grouped by number of players.</small>`;
  }

  function replacementRenderCharts(rows){
    activeRows=Array.isArray(rows)?rows:[];
    ensureUI();
    const from=q('v18EarningsFrom');
    if(from&&!from.dataset.userSet){
      const wanted=earliestMonth(activeRows);
      if(from.value!==wanted)from.value=wanted;
    }
    ensureYearOptions();
    renderEarnings();
    renderMix(activeRows);
  }

  // Override the admin chart renderer after admin.js has loaded.
  window.renderCharts=replacementRenderCharts;

  function activate(){
    ensureUI();
    if(typeof window.loadReports==='function'&&q('adminView')&&!q('adminView').classList.contains('hidden')){
      setTimeout(()=>window.loadReports(),80);
    }
  }

  window.addEventListener('pickyla:admin-active',activate);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',activate,{once:true});
  else activate();
  window.pickylaEarningsViewsReady=true;
})();
