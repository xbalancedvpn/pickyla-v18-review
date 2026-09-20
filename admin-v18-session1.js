// PICKYLA v18 Session 1 - Professional Player Management
(function(){
  const $p=id=>document.getElementById(id);
  const clean=v=>String(v||'').trim().replace(/\s+/g,' ');
  const title=v=>clean(v).split(' ').map(w=>w.split(/([-'])/).map(p=>/[-']/.test(p)?p:(p?p.charAt(0).toUpperCase()+p.slice(1).toLowerCase():p)).join('')).join(' ');
  const levelLabel=v=>({
    beginner:'Beginner',beginner_plus:'Beginner+',intermediate:'Intermediate',
    intermediate_plus:'Intermediate+',advanced:'Advanced',competitive:'Competitive'
  })[v]||'Level not set';
  const handLabel=v=>({right:'Right-handed',left:'Left-handed',ambidextrous:'Ambidextrous'})[v]||'Hand not set';
  const safe=v=>typeof v17Escape==='function'?v17Escape(v):String(v||'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));

  function addFields(){
    const form=$p('clientForm'); if(!form || $p('v18PlayerFields')) return;
    const notes=$p('newClientNotes')?.closest('label');
    const box=document.createElement('div');
    box.id='v18PlayerFields';
    box.className='v18-player-fields';
    box.innerHTML=`
      <div class="v18-section-label">PLAYER DETAILS <small>Optional — useful for coaching preparation</small></div>
      <div class="form-grid">
        <label>Email<input id="v18PlayerEmail" type="email" maxlength="160" placeholder="Optional"></label>
        <label>Messenger / Facebook<input id="v18PlayerMessenger" maxlength="180" placeholder="Profile name or link"></label>
        <label>Birthday<input id="v18PlayerBirthday" type="date"></label>
        <label>Player level<select id="v18PlayerLevel">
          <option value="">Not set</option><option value="beginner">Beginner</option><option value="beginner_plus">Beginner+</option>
          <option value="intermediate">Intermediate</option><option value="intermediate_plus">Intermediate+</option>
          <option value="advanced">Advanced</option><option value="competitive">Competitive</option>
        </select></label>
        <label>Preferred hand<select id="v18PlayerHand"><option value="">Not set</option><option value="right">Right-handed</option><option value="left">Left-handed</option><option value="ambidextrous">Ambidextrous</option></select></label>
        <label>Playing experience<input id="v18PlayerExperience" maxlength="180" placeholder="e.g. 6 months recreational"></label>
        <label class="full">Primary coaching goal<input id="v18PlayerGoal" maxlength="240" placeholder="e.g. Improve doubles positioning and consistency"></label>
      </div>`;
    notes?.parentNode?.insertBefore(box,notes);
  }

  function playerArgs(force=false){
    return {
      p_first_name:title($p('newClientFirstName')?.value),
      p_last_name:title($p('newClientLastName')?.value),
      p_contact:clean($p('newClientContact')?.value)||null,
      p_email:clean($p('v18PlayerEmail')?.value)||null,
      p_messenger:clean($p('v18PlayerMessenger')?.value)||null,
      p_birthday:$p('v18PlayerBirthday')?.value||null,
      p_player_level:$p('v18PlayerLevel')?.value||null,
      p_preferred_hand:$p('v18PlayerHand')?.value||null,
      p_playing_experience:clean($p('v18PlayerExperience')?.value)||null,
      p_primary_goal:clean($p('v18PlayerGoal')?.value)||null,
      p_notes:clean($p('newClientNotes')?.value)||null,
      p_force:force
    };
  }

  async function createPlayer(force=false){
    const args=playerArgs(force);
    if(!args.p_first_name||!args.p_last_name)return alert('First name and last name are required.');
    const {data,error}=await db.rpc('admin_create_player_v18',args);
    if(error)return alert(error.message);
    const result=data||{};
    if(result.status==='duplicate_exact'){
      $p('clientDialog')?.close();
      toast('Player already exists. Opening existing profile.');
      await loadV17Clients();
      if(result.player_id)await openV17Client(result.player_id);
      return;
    }
    if(result.status==='duplicate_possible'){
      const why=result.reason==='same_name'?'same name':result.reason==='same_email'?'same email':'same Messenger';
      const useExisting=confirm(`Possible existing player found (${why}):\n\n${result.full_name||'Existing player'}${result.contact?'\n'+result.contact:''}\n\nOK = Open existing profile\nCancel = Continue creating a separate player`);
      if(useExisting){
        $p('clientDialog')?.close();
        await loadV17Clients();
        if(result.player_id)await openV17Client(result.player_id);
        return;
      }
      return createPlayer(true);
    }
    $p('clientDialog')?.close();
    toast('Player profile created');
    await loadV17Clients();
    if(result.player_id)await openV17Client(result.player_id);
  }

  function installCreateOverride(){
    addFields();
    const form=$p('clientForm'); if(!form)return;
    form.onsubmit=async e=>{
      e.preventDefault();
      const btn=e.submitter||form.querySelector('button[type="submit"]');
      const old=btn?.textContent;
      if(btn){btn.disabled=true;btn.textContent='Saving…';}
      try{await createPlayer(false);}finally{if(btn){btn.disabled=false;btn.textContent=old||'Save Player';}}
    };
    const openBtn=$p('addClientBtn');
    if(openBtn){
      openBtn.textContent='+ Add Player';
      openBtn.onclick=()=>{
        form.reset();
        ['v18PlayerEmail','v18PlayerMessenger','v18PlayerBirthday','v18PlayerLevel','v18PlayerHand','v18PlayerExperience','v18PlayerGoal'].forEach(id=>{const el=$p(id);if(el)el.value='';});
        form.querySelector('.editor-head .eyebrow').textContent='PLAYER PROFILE';
        form.querySelector('.editor-head h2').textContent='Add player';
        form.querySelector('button[type="submit"]').textContent='Save Player';
        $p('clientDialog').showModal();
      };
    }
  }

  const editDialog=document.createElement('dialog');
  editDialog.id='v18EditPlayerDialog';
  editDialog.innerHTML=`<form class="editor v18-edit-player" id="v18EditPlayerForm">
    <div class="editor-head"><div><span class="eyebrow">PLAYER PROFILE</span><h2>Edit player</h2><p class="panel-note">Update coaching details without changing booking, payment, program, or progress history.</p></div><button type="button" class="close-btn" data-v18-close>×</button></div>
    <div class="form-grid"><label>First name<input id="v18EditFirst" required maxlength="60"></label><label>Last name<input id="v18EditLast" required maxlength="80"></label></div>
    <div class="form-grid"><label>Contact / Mobile<input id="v18EditContact" maxlength="120"></label><label>Email<input id="v18EditEmail" type="email" maxlength="160"></label><label>Messenger / Facebook<input id="v18EditMessenger" maxlength="180"></label><label>Birthday<input id="v18EditBirthday" type="date"></label>
    <label>Player level<select id="v18EditLevel"><option value="">Not set</option><option value="beginner">Beginner</option><option value="beginner_plus">Beginner+</option><option value="intermediate">Intermediate</option><option value="intermediate_plus">Intermediate+</option><option value="advanced">Advanced</option><option value="competitive">Competitive</option></select></label>
    <label>Preferred hand<select id="v18EditHand"><option value="">Not set</option><option value="right">Right-handed</option><option value="left">Left-handed</option><option value="ambidextrous">Ambidextrous</option></select></label>
    <label class="full">Playing experience<input id="v18EditExperience" maxlength="180"></label><label class="full">Primary coaching goal<input id="v18EditGoal" maxlength="240"></label></div>
    <label>Coach notes<textarea id="v18EditNotes" rows="4" maxlength="1500" placeholder="Internal coaching notes"></textarea></label>
    <div class="editor-actions"><button type="button" class="soft-danger" data-v18-close>Cancel</button><button type="submit" class="primary">Save Player</button></div>
  </form>`;
  document.body.appendChild(editDialog);
  editDialog.querySelectorAll('[data-v18-close]').forEach(b=>b.onclick=()=>editDialog.close());

  function splitName(c){
    if(c?.first_name||c?.last_name)return{first:c.first_name||'',last:c.last_name||''};
    const a=clean(c?.full_name).split(' ').filter(Boolean);return{first:a.shift()||'',last:a.join(' ')};
  }
  function openEditPlayer(c){
    const n=splitName(c);
    $p('v18EditFirst').value=n.first;$p('v18EditLast').value=n.last;$p('v18EditContact').value=c.contact||'';
    $p('v18EditEmail').value=c.email||'';$p('v18EditMessenger').value=c.messenger||'';$p('v18EditBirthday').value=c.birthday||'';
    $p('v18EditLevel').value=c.player_level||'';$p('v18EditHand').value=c.preferred_hand||'';
    $p('v18EditExperience').value=c.playing_experience||'';$p('v18EditGoal').value=c.primary_goal||'';$p('v18EditNotes').value=c.notes||'';
    editDialog.dataset.playerId=c.id;editDialog.showModal();
  }

  $p('v18EditPlayerForm').onsubmit=async e=>{
    e.preventDefault(); const id=editDialog.dataset.playerId;if(!id)return;
    const btn=e.submitter;const old=btn.textContent;btn.disabled=true;btn.textContent='Saving…';
    const args={
      p_client_id:id,p_first_name:title($p('v18EditFirst').value),p_last_name:title($p('v18EditLast').value),
      p_contact:clean($p('v18EditContact').value)||null,p_email:clean($p('v18EditEmail').value)||null,
      p_messenger:clean($p('v18EditMessenger').value)||null,p_birthday:$p('v18EditBirthday').value||null,
      p_player_level:$p('v18EditLevel').value||null,p_preferred_hand:$p('v18EditHand').value||null,
      p_playing_experience:clean($p('v18EditExperience').value)||null,p_primary_goal:clean($p('v18EditGoal').value)||null,
      p_notes:clean($p('v18EditNotes').value)||null
    };
    const {error}=await db.rpc('admin_update_player_profile_v18',args);
    btn.disabled=false;btn.textContent=old;
    if(error)return alert(error.message);
    editDialog.close();toast('Player profile updated');await loadV17Clients();await openV17Client(id);
  };

  function installProfileEnhancement(){
    if(typeof openV17Client!=='function'||window.pickylaV18ProfileWrapped)return;
    const prior=openV17Client;
    openV17Client=async function(id){
      await prior(id);
      const c=typeof v17SelectedClient!=='undefined'?v17SelectedClient:null;if(!c)return;
      const sec=$p('clientDetailSection');if(!sec)return;
      sec.querySelector('.panel-head .eyebrow').textContent='PLAYER PROFILE';
      const actions=sec.querySelector('.client-detail-actions');
      let edit=$p('v18EditPlayerBtn');if(!edit){edit=document.createElement('button');edit.id='v18EditPlayerBtn';edit.type='button';edit.className='secondary';edit.textContent='Edit Player';actions?.prepend(edit);}
      edit.onclick=()=>openEditPlayer(c);
      let book=$p('v18BookPlayerBtn');if(!book){book=document.createElement('button');book.id='v18BookPlayerBtn';book.type='button';book.className='secondary';book.textContent='Book Session';actions?.prepend(book);}
      book.onclick=()=>{
        const n=splitName(c);
        if(typeof v17dRenderAdminParticipants==='function'){ $p('participantCount').value='1'; v17dRenderAdminParticipants(1,[{first_name:n.first,last_name:n.last,contact:c.contact||null}]); }
        $p('quickBookingForm')?.scrollIntoView({behavior:'smooth',block:'start'});
      };
      let snapshot=$p('v18PlayerSnapshot');
      if(!snapshot){snapshot=document.createElement('section');snapshot.id='v18PlayerSnapshot';snapshot.className='v18-player-snapshot';$p('clientDetailStats')?.insertAdjacentElement('afterend',snapshot);}
      const joined=c.created_at?new Date(c.created_at).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}):'—';
      snapshot.innerHTML=`<div class="v18-snapshot-head"><div><span class="eyebrow">PLAYER OVERVIEW</span><h3>Coaching profile</h3></div><span class="v18-status ${c.is_active===false?'inactive':'active'}">${c.is_active===false?'Inactive':'Active'}</span></div>
        <div class="v18-profile-grid">
          <div><span>Level</span><strong>${safe(levelLabel(c.player_level))}</strong></div>
          <div><span>Preferred hand</span><strong>${safe(handLabel(c.preferred_hand))}</strong></div>
          <div><span>Joined</span><strong>${safe(joined)}</strong></div>
          <div><span>Contact</span><strong>${safe(c.contact||'Not saved')}</strong></div>
          <div><span>Email</span><strong>${safe(c.email||'Not saved')}</strong></div>
          <div><span>Messenger</span><strong>${safe(c.messenger||'Not saved')}</strong></div>
        </div>
        <div class="v18-profile-notes"><div><span>Playing experience</span><p>${safe(c.playing_experience||'Not set')}</p></div><div><span>Primary goal</span><p>${safe(c.primary_goal||'Not set')}</p></div><div><span>Coach notes</span><p>${safe(c.notes||'No notes yet')}</p></div></div>`;
    };
    window.pickylaV18ProfileWrapped=true;
  }

  function renamePlayerLanguage(){
    const hub=$p('clientHubSection');if(hub){
      const eye=hub.querySelector('.panel-head .eyebrow'),h=hub.querySelector('.panel-head h2'),note=hub.querySelector('.panel-note');
      if(eye)eye.textContent='PLAYER MANAGEMENT';if(h)h.textContent='Players & coaching history';if(note)note.textContent='Search players, review coaching history, programs, payments, notes, and development progress.';
    }
    const q=$p('clientSearch');if(q)q.placeholder='Search player name, contact, email, or Messenger';
    document.querySelectorAll('a[href="#clientHubSection"]').forEach(a=>a.textContent='Players');
  }

  function enhanceSearch(){
    const q=$p('clientSearch');if(!q)return;
    q.oninput=()=>{
      const term=clean(q.value).toLowerCase();
      const rows=(typeof v17Clients!=='undefined'?v17Clients:[]).filter(c=>!term||[c.full_name,c.contact,c.email,c.messenger,c.player_level,c.primary_goal].some(v=>String(v||'').toLowerCase().includes(term)));
      $p('clientCountLabel').textContent=`${rows.length} player${rows.length===1?'':'s'}`;
      const list=$p('clientList');list.innerHTML='';
      if(!rows.length){list.innerHTML='<div class="empty">No matching player profiles.</div>';return;}
      rows.forEach(c=>{const el=document.createElement('article');el.className='client-card';el.innerHTML=`<div class="client-card-top"><div><h4>${safe(c.full_name)}</h4><p>${safe(levelLabel(c.player_level))} • ${safe(c.contact||c.messenger||c.email||'No contact saved')}${c.primary_goal?`<br>Goal: ${safe(c.primary_goal)}`:''}</p></div><button type="button">Open Player</button></div>`;el.querySelector('button').onclick=()=>openV17Client(c.id);list.appendChild(el);});
    };
  }

  function install(){
    if(typeof db==='undefined' || typeof loadV17Clients!=='function' || !document.querySelector('.v17g-client-maintenance-dialog'))return false;
    installCreateOverride();installProfileEnhancement();renamePlayerLanguage();enhanceSearch();
    if(typeof loadV17Clients==='function')loadV17Clients();
    window.pickylaV18Session1Ready=true;
    return true;
  }

  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>30)clearInterval(timer);},250);
})();