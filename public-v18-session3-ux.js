// PICKYLA v18 Session 3 UX - Coach Kyle style hour selection + Moments carousel
(function(){
  const START_HOUR=8, END_HOUR=24;
  const $=id=>document.getElementById(id);
  let selectionNotice='';

  function durationHours(){
    return selectedStart!==null&&selectedEnd!==null&&selectedEnd>selectedStart ? selectedEnd-selectedStart : 0;
  }
  function isOpen(h){
    if(!selectedDate||h<START_HOUR||h>=END_HOUR)return false;
    return statusFor(keyDate(selectedDate),h)==='available';
  }
  function selectedContains(h){
    return selectedStart!==null&&selectedEnd!==null&&h>=selectedStart&&h<selectedEnd;
  }
  function rangeOpen(start,end){
    if(start===null||end===null||end<=start)return false;
    for(let h=start;h<end;h++)if(!isOpen(h))return false;
    return true;
  }
  function selectedRateNumber(){
    const n=Number(String(selectedRate||'').replace(/[^0-9.]/g,''));
    return Number.isFinite(n)&&n>0?n:0;
  }
  function estimatedFee(){
    const hrs=durationHours(),rate=selectedRateNumber(),count=Number(selectedPlayers||1);
    if(!hrs||!rate||!selectedPackage)return 0;
    return /each/i.test(String(selectedRate||'')) ? rate*count*hrs : rate*hrs;
  }
  function peso(v){
    return '₱'+Number(v||0).toLocaleString('en-PH',{maximumFractionDigits:2});
  }

  function validateSelection(){
    if(selectedStart===null||selectedEnd===null)return true;
    if(rangeOpen(selectedStart,selectedEnd))return true;
    selectedStart=null;selectedEnd=null;
    selectionNotice='Previous selection was cleared because a booked or blocked hour is now inside the range.';
    return false;
  }

  function fillStartSelect(){
    if(!clientStart||!clientEnd)return;
    clientStart.innerHTML='';
    if(!selectedDate){
      clientStart.disabled=true;clientEnd.disabled=true;
      clientStart.innerHTML='<option value="">Choose a date first</option>';
      clientEnd.innerHTML='<option value="">Choose start time</option>';
      return;
    }
    const available=[];
    for(let h=START_HOUR;h<END_HOUR;h++)if(isOpen(h))available.push(h);
    if(!available.length){
      clientStart.disabled=true;clientEnd.disabled=true;
      clientStart.innerHTML='<option value="">No available times</option>';
      clientEnd.innerHTML='<option value="">Fully booked / unavailable</option>';
      return;
    }
    const ph=document.createElement('option');ph.value='';ph.textContent='Choose start time';clientStart.appendChild(ph);
    available.forEach(h=>{const o=document.createElement('option');o.value=String(h);o.textContent=hourName(h);clientStart.appendChild(o);});
    clientStart.disabled=false;
    clientStart.value=selectedStart===null?'':String(selectedStart);
  }

  function fillEndSelect(){
    if(!clientEnd)return;
    clientEnd.innerHTML='';
    if(!selectedDate||selectedStart===null||!isOpen(selectedStart)){
      clientEnd.disabled=true;
      clientEnd.innerHTML='<option value="">Choose start time</option>';
      return;
    }
    const ends=[];
    for(let h=selectedStart;h<END_HOUR;h++){
      if(!isOpen(h))break;
      ends.push(h+1);
    }
    if(!ends.length){
      clientEnd.disabled=true;selectedEnd=null;
      clientEnd.innerHTML='<option value="">No consecutive time</option>';
      return;
    }
    ends.forEach(h=>{const o=document.createElement('option');o.value=String(h);o.textContent=hourName(h);clientEnd.appendChild(o);});
    clientEnd.disabled=false;
    if(selectedEnd===null||!ends.includes(selectedEnd))selectedEnd=selectedStart+1;
    clientEnd.value=String(selectedEnd);
  }

  function updateDurationDisplay(){
    if(!durationSummary)return;
    const hrs=durationHours();
    if(!selectedDate){
      durationSummary.textContent='Select a date, then tap one or more consecutive available hours.';
      return;
    }
    if(!hrs){
      durationSummary.textContent=selectionNotice||'No hours selected. Tap an available hour to begin.';
      selectionNotice='';
      return;
    }
    let text=`${hrs} hour${hrs>1?'s':''} selected • ${hourName(selectedStart)} – ${hourName(selectedEnd)}`;
    const fee=estimatedFee();
    if(fee)text+=` • Estimated coaching: ${peso(fee)}`;
    if(selectionNotice)text+=` • ${selectionNotice}`;
    durationSummary.textContent=text;
    selectionNotice='';
  }

  function renderSlotsOnly(){
    if(!slotsEl)return;
    slotsEl.innerHTML='';
    if(!selectedDate){selectedDateText.textContent='Choose a date';return;}
    validateSelection();
    const ds=keyDate(selectedDate);
    selectedDateText.textContent=niceDate(selectedDate);
    for(let h=START_HOUR;h<END_HOUR;h++){
      const s=statusFor(ds,h),b=document.createElement('button');
      b.type='button';b.className='slot v18s3-hour-slot';
      b.innerHTML=`<strong>${hourLabel(h)}</strong><small>${s==='booked'?'Booked':s==='unavailable'?'Blocked':'Available'}</small>`;
      if(s==='booked'){
        b.classList.add('booked');b.disabled=true;
      }else if(s==='unavailable'){
        b.classList.add('unavailable');b.disabled=true;
      }else{
        if(selectedContains(h)){
          b.classList.add('in-range','v18s3-selected');
          if(h===selectedStart)b.classList.add('v18s3-range-start');
          if(h===selectedEnd-1)b.classList.add('v18s3-range-end');
        }
        b.onclick=()=>chooseHour(h);
      }
      slotsEl.appendChild(b);
    }
  }

  function syncSelectionUi(){
    validateSelection();
    fillStartSelect();
    fillEndSelect();
    renderSlotsOnly();
    updateDurationDisplay();
    try{updateSummary();}catch(_e){}
  }

  function chooseHour(h){
    if(!isOpen(h))return;
    selectionNotice='';

    if(selectedStart===null||selectedEnd===null){
      selectedStart=h;selectedEnd=h+1;
    }else if(selectedContains(h)){
      const dur=durationHours();
      if(dur===1){
        selectedStart=null;selectedEnd=null;
      }else if(h===selectedStart){
        selectedStart+=1;
      }else if(h===selectedEnd-1){
        selectedEnd-=1;
      }else{
        selectedStart=h;selectedEnd=h+1;
        selectionNotice='Selection restarted from this hour.';
      }
    }else{
      const candidateStart=Math.min(selectedStart,h);
      const candidateEnd=Math.max(selectedEnd,h+1);
      if(rangeOpen(candidateStart,candidateEnd)){
        selectedStart=candidateStart;selectedEnd=candidateEnd;
      }else{
        selectedStart=h;selectedEnd=h+1;
        selectionNotice='Selection restarted here because a booked or blocked hour separates the range.';
      }
    }
    syncSelectionUi();
  }

  function installHourSelection(){
    if(typeof selectedStart==='undefined'||!slotsEl||!clientStart||!clientEnd)return false;

    renderSlots=function(){
      renderSlotsOnly();
      updateDurationDisplay();
    };
    populateStartTimes=function(){
      validateSelection();fillStartSelect();fillEndSelect();renderSlotsOnly();updateDurationDisplay();
    };
    populateEndTimes=function(){
      if(selectedStart!==null&&selectedEnd===null&&isOpen(selectedStart))selectedEnd=selectedStart+1;
      validateSelection();fillStartSelect();fillEndSelect();renderSlotsOnly();updateDurationDisplay();
      try{updateSummary();}catch(_e){}
    };
    updateDuration=function(){
      validateSelection();fillStartSelect();fillEndSelect();renderSlotsOnly();updateDurationDisplay();
      try{updateSummary();}catch(_e){}
    };

    clientStart.onchange=()=>{
      const v=clientStart.value;
      if(v===''){selectedStart=null;selectedEnd=null;syncSelectionUi();return;}
      const h=Number(v);
      if(!isOpen(h)){selectedStart=null;selectedEnd=null;selectionNotice='That hour is no longer available.';syncSelectionUi();return;}
      selectedStart=h;selectedEnd=h+1;syncSelectionUi();
    };

    clientEnd.onchange=()=>{
      const end=Number(clientEnd.value);
      if(selectedStart===null||!Number.isFinite(end)||!rangeOpen(selectedStart,end)){
        selectionNotice='That range is no longer continuously available.';
        selectedEnd=selectedStart!==null&&isOpen(selectedStart)?selectedStart+1:null;
      }else selectedEnd=end;
      syncSelectionUi();
    };

    document.querySelectorAll('.package-options button').forEach(b=>b.addEventListener('click',()=>setTimeout(updateDurationDisplay,0)));
    groupSize?.addEventListener('change',()=>setTimeout(updateDurationDisplay,0));

    const area=document.querySelector('.slot-area');
    if(area&&!$('v18s3HourHelp')){
      const help=document.createElement('div');help.id='v18s3HourHelp';help.className='v18s3-hour-help';
      help.innerHTML='<strong>Tap available hours</strong><span>Select one hour, then tap another available hour to extend the range. PICKYLA only keeps continuous open hours and will reset the range if a booked/blocked slot is between them.</span>';
      const title=area.querySelector('.availability-title');title?.insertAdjacentElement('afterend',help);
    }

    populateStartTimes();
    window.pickylaV18SmartHoursReady=true;
    return true;
  }

  // ---------- PICKYLA Moments carousel ----------
  let carouselTimer=null;
  function buildMomentsCarousel(){
    const grid=$('v18s3PublicGallery');
    if(!grid||grid.dataset.v18CarouselReady==='1')return false;
    const slides=[...grid.querySelectorAll('.v18s3-public-photo')];
    if(!slides.length)return false;

    grid.dataset.v18CarouselReady='1';
    grid.classList.add('v18s3-moments-carousel');

    const track=document.createElement('div');
    track.className='v18s3-carousel-track';
    slides.forEach((slide,i)=>{
      slide.classList.add('v18s3-carousel-slide');
      slide.classList.toggle('active',i===0);
      slide.setAttribute('aria-hidden',i===0?'false':'true');
      track.appendChild(slide);
    });
    grid.appendChild(track);

    let index=0;
    const controls=document.createElement('div');
    controls.className='v18s3-carousel-controls v18s3-dots-only';
    controls.innerHTML='<div class="v18s3-carousel-dots" aria-label="PICKYLA Moments"></div>';
    grid.after(controls);
    const dots=controls.querySelector('.v18s3-carousel-dots');

    slides.forEach((_,i)=>{
      const d=document.createElement('button');
      d.type='button';
      d.className='v18s3-carousel-dot';
      d.setAttribute('aria-label',`Show photo ${i+1}`);
      d.classList.toggle('active',i===0);
      d.onclick=()=>{show(i);restart();};
      dots.appendChild(d);
    });

    function show(next){
      if(!slides.length)return;
      index=(next+slides.length)%slides.length;
      track.style.transform=`translate3d(-${index*100}%,0,0)`;
      slides.forEach((s,i)=>{
        const active=i===index;
        s.classList.toggle('active',active);
        s.setAttribute('aria-hidden',active?'false':'true');
      });
      [...dots.children].forEach((d,i)=>d.classList.toggle('active',i===index));
      // No focus(), scrollIntoView(), scrollLeft, or page scroll changes.
    }

    function stop(){
      if(carouselTimer){clearInterval(carouselTimer);carouselTimer=null;}
    }
    function start(){
      stop();
      if(slides.length>1&&!document.hidden)carouselTimer=setInterval(()=>show(index+1),10000);
    }
    function restart(){start();}

    // Mobile swipe: horizontal gesture changes photo while vertical scrolling remains native.
    let startX=null,startY=null,pointerId=null;
    grid.addEventListener('pointerdown',e=>{
      if(slides.length<2)return;
      pointerId=e.pointerId;
      startX=e.clientX;
      startY=e.clientY;
    });
    grid.addEventListener('pointerup',e=>{
      if(pointerId!==e.pointerId||startX===null||startY===null)return;
      const dx=e.clientX-startX,dy=e.clientY-startY;
      pointerId=null;startX=null;startY=null;
      if(Math.abs(dx)<45||Math.abs(dx)<=Math.abs(dy))return;
      show(index+(dx<0?1:-1));
      restart();
    });
    grid.addEventListener('pointercancel',()=>{pointerId=null;startX=null;startY=null;});

    document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
    if(slides.length<2)controls.classList.add('single');
    show(0);
    start();
    window.pickylaV18MomentsCarouselReady=true;
    return true;
  }

  function watchMoments(){
    const grid=$('v18s3PublicGallery');if(!grid)return false;
    if(buildMomentsCarousel())return true;
    const obs=new MutationObserver(()=>{if(buildMomentsCarousel())obs.disconnect();});
    obs.observe(grid,{childList:true,subtree:false});
    setTimeout(()=>obs.disconnect(),15000);
    return true;
  }

  function install(){
    const hours=installHourSelection();
    const gallery=watchMoments();
    return hours&&gallery;
  }
  let tries=0,t=setInterval(()=>{tries++;if(install()||tries>50)clearInterval(t);},200);
})();