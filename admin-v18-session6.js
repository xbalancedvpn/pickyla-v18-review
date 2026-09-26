// PICKYLA v18 Session 6 - player terminology, compact player views, header cleanup
(function(){
  const q=id=>document.getElementById(id);

  function installCompactList(opts){
    const list=q(opts.listId); if(!list||q(opts.buttonId)) return;
    const row=document.createElement('div'); row.className='v18s6-show-row';
    const btn=document.createElement('button'); btn.id=opts.buttonId; btn.type='button'; btn.className='secondary'; row.appendChild(btn);
    list.insertAdjacentElement('afterend',row);
    let expanded=false;
    const apply=()=>{
      const items=[...list.children].filter(el=>!el.classList.contains('empty'));
      items.forEach((el,i)=>el.classList.toggle('v18s6-hidden-item',!expanded&&i>=opts.limit));
      btn.hidden=items.length<=opts.limit;
      btn.textContent=expanded?'Show Less':'Show All ('+items.length+')';
      btn.setAttribute('aria-expanded',String(expanded));
      btn.setAttribute('aria-label',expanded?'Show fewer '+opts.label:'Show all '+opts.label);
    };
    btn.onclick=()=>{expanded=!expanded;apply();};
    new MutationObserver(()=>{expanded=false;setTimeout(apply,0);}).observe(list,{childList:true});
    if(opts.listId==='clientList') q('clientSearch')?.addEventListener('input',()=>{expanded=false;setTimeout(apply,80);});
    apply();
  }

  function cleanupHeader(){
    q('v18s5ShareLink')?.remove();
    document.querySelector('.top-public-link')?.remove();
    document.querySelector('.admin-menu-public')?.remove();
    document.querySelector('.auth-public-link')?.remove();
  }

  function fixPlayerLabels(root=document){
    const top=root.querySelector?.('.v17g-quick-actions [data-jump="clientHubSection"]')||document.querySelector('.v17g-quick-actions [data-jump="clientHubSection"]');
    if(top) top.textContent='Players';
    const dock=root.querySelector?.('.v17g-mobile-dock [data-jump="clientHubSection"]')||document.querySelector('.v17g-mobile-dock [data-jump="clientHubSection"]');
    if(dock) dock.innerHTML='<b>♙</b>Players';
    const remove=root.querySelector?.('#v17gRemoveClientBtn')||document.querySelector('#v17gRemoveClientBtn');
    if(remove) remove.textContent='Remove Player';
    root.querySelectorAll?.('button').forEach(b=>{
      const t=b.textContent.trim();
      if(t==='Client Profile') b.textContent='Player Profile';
      if(t==='Client Cancelled') b.textContent='Player Cancelled';
    });
  }


  function repairDetailedReportLayout(){
    const section=q('adminReportsSection'),grid=section?.querySelector('.report-filter-grid'),status=q('reportStatusWrap'),select=q('reportCollectionFilter'),button=q('generateDetailedReport');
    if(!section||!grid)return;
    section.style.height='auto';section.style.minHeight='0';section.style.maxHeight='none';
    grid.style.height='auto';grid.style.minHeight='0';grid.style.alignContent='start';
    if(status&&!status.classList.contains('hidden')){status.style.height='auto';status.style.minHeight='0';}
    if(select){select.style.visibility='visible';select.style.opacity='1';}
    if(button){button.style.visibility='visible';button.style.opacity='1';}
  }

  function install(){
    cleanupHeader();repairDetailedReportLayout();
    installCompactList({listId:'clientList',buttonId:'v18s6PlayerListToggle',limit:5,label:'players'});
    installCompactList({listId:'clientSessionHistory',buttonId:'v18s6PlayerHistoryToggle',limit:5,label:'player session history'});
    fixPlayerLabels();
    const obs=new MutationObserver(muts=>{for(const m of muts)for(const n of m.addedNodes)if(n.nodeType===1)fixPlayerLabels(n);});
    obs.observe(document.body,{childList:true,subtree:true});
    q('detailedReportType')?.addEventListener('change',()=>setTimeout(repairDetailedReportLayout,0));window.addEventListener('resize',repairDetailedReportLayout);window.pickylaV18Session6Ready=true;
  }

  let tries=0,t=setInterval(()=>{tries++;if(q('adminView')&&q('clientList')){clearInterval(t);install();}else if(tries>50)clearInterval(t);},200);
})();