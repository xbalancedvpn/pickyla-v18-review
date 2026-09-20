// PICKYLA v18 - Weekly navigation hotfix (Monday-Sunday)
(function(){
  const $=id=>document.getElementById(id);
  let weeklyDataUrl="", weeklyFilename="";

  const pad=n=>String(n).padStart(2,"0");
  const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const localDate=s=>{const [y,m,d]=String(s).split("-").map(Number);return new Date(y,m-1,d);};
  const mondayOf=input=>{
    const d=input instanceof Date?new Date(input):localDate(input);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()-((d.getDay()+6)%7));
    return d;
  };
  const weekDates=input=>{
    const start=mondayOf(input), out=[];
    for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);out.push(d);}
    return out;
  };
  const hourName=h=>{h=Number(h);if(h===24)return "12:00 MN";return `${h%12||12}:00 ${h<12?"AM":"PM"}`;};
  const rangeText=input=>{
    const days=weekDates(input),a=days[0],b=days[6];
    const sameMonth=a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear();
    if(sameMonth)return `${a.toLocaleDateString("en-PH",{month:"long"})} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`;
    return `${a.toLocaleDateString("en-PH",{month:"short",day:"numeric"})} – ${b.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}`;
  };
  const round=(ctx,x,y,w,h,r,fill)=>{
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
  };
  const loadImage=src=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src;});

  function thisMonday(offsetWeeks=0){
    const d=mondayOf(new Date());
    d.setDate(d.getDate()+offsetWeeks*7);
    return d;
  }
  function selectedOffset(){
    const input=$("weeklyWeekDate"); if(!input?.value)return null;
    const diff=Math.round((mondayOf(input.value)-thisMonday(0))/(7*86400000));
    return [-1,0,1].includes(diff)?diff:null;
  }
  function refreshNav(){
    const input=$("weeklyWeekDate"), label=$("weeklyRangeLabel"); if(!input)return;
    if(label)label.textContent=`Monday–Sunday • ${rangeText(input.value||ymd(thisMonday(0)))}`;
    const active=selectedOffset();
    document.querySelectorAll("[data-week-offset]").forEach(btn=>{
      btn.classList.toggle("active",Number(btn.dataset.weekOffset)===active);
    });
  }
  async function chooseWeek(offset){
    const input=$("weeklyWeekDate"); if(!input)return;
    input.value=ymd(thisMonday(offset));
    refreshNav();
    if(!$("weeklyPreviewWrap")?.classList.contains("hidden"))await generateWeeklyCard();
  }

  async function savePng(){
    if(!weeklyDataUrl)return;
    const a=document.createElement("a");
    a.href=weeklyDataUrl;a.download=weeklyFilename||"pickyla-weekly-schedule.png";
    document.body.appendChild(a);a.click();a.remove();
  }
  async function sharePng(){
    if(!weeklyDataUrl)return;
    const blob=await (await fetch(weeklyDataUrl)).blob();
    const file=new File([blob],weeklyFilename||"pickyla-weekly-schedule.png",{type:"image/png"});
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      try{await navigator.share({title:"PICKYLA Weekly Schedule",files:[file]});return;}catch(e){if(e?.name==="AbortError")return;}
    }
    await savePng();
  }

  async function generateWeeklyCard(){
    const btn=$("generateWeeklyBtn"), input=$("weeklyWeekDate");
    if(!btn||!input||typeof db==="undefined")return;
    const old=btn.textContent;btn.disabled=true;btn.textContent="Generating…";
    try{
      const days=weekDates(input.value||ymd(thisMonday(0)));
      const start=ymd(days[0]), end=ymd(days[6]);
      const {data,error}=await db.from("schedule_slots")
        .select("slot_date,start_hour,status")
        .gte("slot_date",start).lte("slot_date",end)
        .order("slot_date").order("start_hour");
      if(error)throw error;
      const map=new Map((data||[]).map(r=>[`${r.slot_date}|${Number(r.start_hour)}`,r.status]));

      const W=1920,H=1390,canvas=document.createElement("canvas");
      canvas.width=W;canvas.height=H;const ctx=canvas.getContext("2d");
      ctx.fillStyle="#f7f5ee";ctx.fillRect(0,0,W,H);
      ctx.fillStyle="#111";ctx.fillRect(0,0,W,205);
      ctx.fillStyle="#f5c400";ctx.fillRect(0,197,W,8);

      try{
        const logo=await loadImage("pickyla-logo-final.png");
        const rh=126,rw=rh*(logo.width/logo.height);
        ctx.drawImage(logo,54,34,rw,rh);
      }catch(_e){}

      ctx.fillStyle="#f5c400";ctx.font="900 24px Arial";ctx.fillText("WEEKLY COACHING SCHEDULE",520,72);
      ctx.fillStyle="#fff";ctx.font="800 36px Arial";ctx.fillText(rangeText(input.value||start),520,121);
      ctx.fillStyle="#bbb";ctx.font="500 19px Arial";ctx.fillText("Monday → Sunday • Privacy-safe • Player names hidden",520,158);

      const left=48,top=246,timeW=235,gridW=W-left*2,dayW=(gridW-timeW)/7,headH=82,rowH=58;
      round(ctx,left,top,timeW,headH,12,"#111");
      ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="900 22px Arial";ctx.fillText("TIME",left+timeW/2,top+50);

      const names=["MON","TUE","WED","THU","FRI","SAT","SUN"];
      days.forEach((d,i)=>{
        const x=left+timeW+i*dayW;
        round(ctx,x+2,top,dayW-4,headH,12,"#111");
        ctx.fillStyle="#f5c400";ctx.font="900 19px Arial";ctx.fillText(names[i],x+dayW/2,top+31);
        ctx.fillStyle="#fff";ctx.font="800 17px Arial";ctx.fillText(d.toLocaleDateString("en-PH",{month:"short",day:"numeric"}).toUpperCase(),x+dayW/2,top+58);
      });

      const now=new Date();
      for(let h=8;h<24;h++){
        const y=top+headH+(h-8)*rowH;
        round(ctx,left,y+2,timeW,rowH-4,9,"#e9e6dd");
        ctx.fillStyle="#222";ctx.font="800 15px Arial";ctx.fillText(`${hourName(h)} – ${hourName(h+1)}`,left+timeW/2,y+36);

        days.forEach((d,i)=>{
          const ds=ymd(d),x=left+timeW+i*dayW,status=map.get(`${ds}|${h}`)||"available";
          let bg="#dff4df",fg="#225b2d",label="AVAILABLE";
          const dt=new Date(d);dt.setHours(h,0,0,0);
          if(status==="booked"){bg="#f7c9c5";fg="#8b2522";label="BOOKED";}
          else if(status==="unavailable"){bg="#d8d8d8";fg="#4b4b4b";label="BLOCKED";}
          else if(dt<=now){bg="#ecebe7";fg="#92918c";label="PAST";}
          round(ctx,x+2,y+2,dayW-4,rowH-4,9,bg);
          ctx.fillStyle=fg;ctx.font="900 14px Arial";ctx.fillText(label,x+dayW/2,y+36);
        });
      }

      ctx.textAlign="left";
      const foot=top+headH+16*rowH+34;
      ctx.fillStyle="#111";ctx.font="900 20px Arial";ctx.fillText("STATUS",left,foot+26);
      [["#dff4df","#225b2d","AVAILABLE"],["#f7c9c5","#8b2522","BOOKED"],["#d8d8d8","#4b4b4b","BLOCKED"],["#ecebe7","#92918c","PAST"]].forEach((it,i)=>{
        const x=left+110+i*245;round(ctx,x,foot,215,43,10,it[0]);ctx.fillStyle=it[1];ctx.textAlign="center";ctx.font="900 15px Arial";ctx.fillText(it[2],x+107,foot+27);
      });
      ctx.textAlign="right";ctx.fillStyle="#777";ctx.font="500 15px Arial";ctx.fillText("PICKYLA • Play • Learn • Improve",W-left,foot+27);ctx.textAlign="left";

      weeklyDataUrl=canvas.toDataURL("image/png");
      weeklyFilename=`pickyla-weekly-${start}-to-${end}.png`;
      const preview=$("weeklyPreview"),wrap=$("weeklyPreviewWrap");
      if(preview)preview.src=weeklyDataUrl;
      wrap?.classList.remove("hidden");
      wrap?.scrollIntoView({behavior:"smooth",block:"nearest"});
      if(typeof toast==="function")toast("Monday–Sunday weekly card ready");
    }catch(e){
      alert("Could not generate weekly schedule image.\n"+e.message);
    }finally{
      btn.disabled=false;btn.textContent=old;
    }
  }

  function install(){
    const section=$("weeklyShareSection"),input=$("weeklyWeekDate"),gen=$("generateWeeklyBtn");
    if(!section||!input||!gen||typeof db==="undefined")return false;

    document.querySelectorAll("[data-week-offset]").forEach(btn=>{
      btn.onclick=()=>chooseWeek(Number(btn.dataset.weekOffset));
    });

    input.onchange=refreshNav;
    input.value=ymd(thisMonday(0));
    refreshNav();

    gen.onclick=generateWeeklyCard;
    gen.textContent="Generate Weekly Card";

    const save=$("downloadWeeklyBtn");
    if(save){save.textContent="Save PNG";save.onclick=savePng;}

    const share=$("v18s2ShareWeekly");
    if(share)share.onclick=sharePng;

    window.pickylaV18MondayWeekReady=true;
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer);},250);
})();