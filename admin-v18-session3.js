// PICKYLA v18 Session 3 - Public Site & Content Management
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clean=v=>String(v??'').trim();
  const mediaUrl=path=>path?db.storage.from('pickyla-media').getPublicUrl(path).data.publicUrl:'';
  let profile=null, contact=null, gallery=[];

  async function uploadImage(file,prefix){
    if(!file)return null;
    if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Use JPG, PNG, or WebP images only.');
    if(file.size>5*1024*1024)throw new Error('Image must be 5 MB or smaller.');
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
    const path=`${prefix}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const {error}=await db.storage.from('pickyla-media').upload(path,file,{cacheControl:'3600',upsert:false});
    if(error)throw error;
    return path;
  }

  function ensureUi(){
    if($('v18s3ContentHub'))return;
    const anchor=$('shareToolsSection')||$('clientHubSection')?.closest('.v17-grid');
    if(!anchor)return;
    const hub=document.createElement('section');
    hub.id='v18s3ContentHub';
    hub.className='v18s3-content-hub';
    hub.innerHTML=`
      <div class="v18s3-head">
        <div><span class="eyebrow">PUBLIC SITE MANAGEMENT</span><h2>Coach profile, gallery & contact</h2><p>Update public-facing content without editing source files. Changes here affect staging only.</p></div>
        <span class="v18s3-badge">SESSION 3</span>
      </div>
      <div class="v18s3-grid">
        <section class="panel v18s3-panel">
          <div class="panel-head"><div><span class="eyebrow">COACH PROFILE</span><h3>Public coach details</h3><p class="panel-note">Edit the profile shown on the public PICKYLA site.</p></div></div>
          <form id="v18s3ProfileForm" class="v18s3-form">
            <label>Coach name<input id="v18s3CoachName" maxlength="120" required></label>
            <label>Hero intro<textarea id="v18s3HeroLead" rows="3" maxlength="350"></textarea></label>
            <label>Coach bio<textarea id="v18s3CoachBio" rows="6" maxlength="1200"></textarea></label>
            <div class="v18s3-two"><label>Location<input id="v18s3Location" maxlength="160"></label><label>Schedule label<input id="v18s3Schedule" maxlength="160"></label></div>
            <label>Coach photo <small>JPG/PNG/WebP • max 5 MB</small><input id="v18s3CoachPhoto" type="file" accept="image/jpeg,image/png,image/webp"></label>
            <div id="v18s3CoachPreview" class="v18s3-image-preview"></div>
            <button class="primary" type="submit">Save Coach Profile</button>
          </form>
        </section>

        <section class="panel v18s3-panel">
          <div class="panel-head"><div><span class="eyebrow">CONTACT & PRIVACY</span><h3>Public contact controls</h3><p class="panel-note">Hidden contact values are not sent to the public site.</p></div></div>
          <form id="v18s3ContactForm" class="v18s3-form">
            <label>Facebook URL<input id="v18s3Facebook" type="url" placeholder="https://facebook.com/..."></label>
            <label class="v18s3-toggle"><input id="v18s3ShowFacebook" type="checkbox"> Show Facebook publicly</label>
            <label>Messenger URL<input id="v18s3Messenger" type="url" placeholder="https://m.me/..."></label>
            <label class="v18s3-toggle"><input id="v18s3ShowMessenger" type="checkbox"> Show Messenger publicly</label>
            <div class="v18s3-two"><label>Phone<input id="v18s3Phone" type="tel"></label><label>Email<input id="v18s3Email" type="email"></label></div>
            <div class="v18s3-two"><label class="v18s3-toggle"><input id="v18s3ShowPhone" type="checkbox"> Show phone</label><label class="v18s3-toggle"><input id="v18s3ShowEmail" type="checkbox"> Show email</label></div>
            <button class="primary" type="submit">Save Contact Settings</button>
          </form>
        </section>
      </div>

      <section class="panel v18s3-panel v18s3-gallery-admin">
        <div class="panel-head"><div><span class="eyebrow">GALLERY / PHOTOS</span><h3>Public gallery manager</h3><p class="panel-note">Upload coaching photos, preview them, publish/hide them, and control display order.</p></div><button id="v18s3AddPhotoBtn" class="secondary" type="button">+ Add Photo</button></div>
        <label class="v18s3-toggle v18s3-gallery-toggle"><input id="v18s3ShowGallery" type="checkbox"> Show Gallery section on public site</label>
        <div id="v18s3GalleryList" class="v18s3-gallery-list"><div class="empty">Loading gallery…</div></div>
      </section>
    `;
    anchor.insertAdjacentElement('afterend',hub);

    const dlg=document.createElement('dialog');
    dlg.id='v18s3PhotoDialog';
    dlg.innerHTML=`<form id="v18s3PhotoForm" class="editor v18s3-photo-editor">
      <div class="editor-head"><div><span class="eyebrow">GALLERY PHOTO</span><h2 id="v18s3PhotoTitle">Add photo</h2><p class="panel-note">Public photos should not expose private player information without permission.</p></div><button type="button" class="close-btn" data-v18s3-close>×</button></div>
      <input id="v18s3PhotoId" type="hidden">
      <label>Image <small id="v18s3PhotoImageHelp">Required for new photos • JPG/PNG/WebP • max 5 MB</small><input id="v18s3PhotoFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
      <div id="v18s3PhotoPreview" class="v18s3-image-preview"></div>
      <div class="form-grid"><label>Title<input id="v18s3PhotoName" maxlength="120"></label><label>Display order<input id="v18s3PhotoOrder" type="number" min="0" max="999" value="0"></label></div>
      <label>Caption<textarea id="v18s3PhotoCaption" rows="3" maxlength="500"></textarea></label>
      <label>Image description / alt text<input id="v18s3PhotoAlt" maxlength="180" placeholder="Describe the photo for accessibility"></label>
      <label class="v18s3-toggle"><input id="v18s3PhotoPublished" type="checkbox" checked> Published on public site</label>
      <div class="editor-actions"><button type="button" class="soft-danger" data-v18s3-close>Cancel</button><button class="primary" type="submit">Save Photo</button></div>
    </form>`;
    document.body.appendChild(dlg);
    dlg.querySelectorAll('[data-v18s3-close]').forEach(b=>b.onclick=()=>dlg.close());
  }

  function fillProfile(){
    if(!profile)return;
    $('v18s3CoachName').value=profile.coach_name||'';
    $('v18s3HeroLead').value=profile.hero_lead||'';
    $('v18s3CoachBio').value=profile.coach_bio||'';
    $('v18s3Location').value=profile.location_label||'';
    $('v18s3Schedule').value=profile.schedule_label||'';
    $('v18s3ShowGallery').checked=profile.show_gallery!==false;
    $('v18s3CoachPreview').innerHTML=profile.coach_photo_path?`<img src="${esc(mediaUrl(profile.coach_photo_path))}" alt="Coach photo preview"><small>Current public coach photo</small>`:'<small>Current site uses the bundled Kyla coach photo.</small>';
  }
  function fillContact(){
    if(!contact)return;
    $('v18s3Facebook').value=contact.facebook_url||'';
    $('v18s3Messenger').value=contact.messenger_url||'';
    $('v18s3Phone').value=contact.phone||'';
    $('v18s3Email').value=contact.email||'';
    $('v18s3ShowFacebook').checked=!!contact.show_facebook;
    $('v18s3ShowMessenger').checked=!!contact.show_messenger;
    $('v18s3ShowPhone').checked=!!contact.show_phone;
    $('v18s3ShowEmail').checked=!!contact.show_email;
  }

  async function loadSettings(){
    const [{data:p,error:pe},{data:c,error:ce},{data:g,error:ge}]=await Promise.all([
      db.from('site_profile').select('*').eq('id','main').maybeSingle(),
      db.from('site_contact_private').select('*').eq('id','main').maybeSingle(),
      db.from('gallery_photos').select('*').order('sort_order').order('created_at',{ascending:false})
    ]);
    if(pe)throw pe;if(ce)throw ce;if(ge)throw ge;
    profile=p;contact=c;gallery=g||[];
    fillProfile();fillContact();renderGallery();
  }

  function renderGallery(){
    const list=$('v18s3GalleryList');if(!list)return;
    if(!gallery.length){list.innerHTML='<div class="empty">No gallery photos yet. Add your first coaching photo.</div>';return;}
    list.innerHTML='';
    gallery.forEach(item=>{
      const el=document.createElement('article');el.className='v18s3-gallery-item';
      el.innerHTML=`<img src="${esc(mediaUrl(item.image_path))}" alt="${esc(item.alt_text||item.title||'Gallery image')}"><div class="v18s3-gallery-copy"><div><strong>${esc(item.title||'Untitled photo')}</strong><small>Order ${Number(item.sort_order||0)} • ${item.is_published?'Published':'Hidden'}</small></div><p>${esc(item.caption||'No caption')}</p></div><div class="v18s3-gallery-actions"><button type="button" data-edit>Edit</button><button type="button" data-toggle>${item.is_published?'Hide':'Publish'}</button><button type="button" data-delete>Delete</button></div>`;
      el.querySelector('[data-edit]').onclick=()=>openPhoto(item);
      el.querySelector('[data-toggle]').onclick=async()=>{const {error}=await db.from('gallery_photos').update({is_published:!item.is_published,updated_at:new Date().toISOString()}).eq('id',item.id);if(error)return alert(error.message);toast(item.is_published?'Photo hidden':'Photo published');await loadSettings();};
      el.querySelector('[data-delete]').onclick=async()=>{if(!confirm('Delete this gallery photo?'))return;const {error}=await db.from('gallery_photos').delete().eq('id',item.id);if(error)return alert(error.message);await db.storage.from('pickyla-media').remove([item.image_path]);toast('Photo deleted');await loadSettings();};
      list.appendChild(el);
    });
  }

  function openPhoto(item=null){
    const form=$('v18s3PhotoForm');form.reset();
    $('v18s3PhotoId').value=item?.id||'';
    $('v18s3PhotoTitle').textContent=item?'Edit photo':'Add photo';
    $('v18s3PhotoName').value=item?.title||'';
    $('v18s3PhotoCaption').value=item?.caption||'';
    $('v18s3PhotoAlt').value=item?.alt_text||'';
    $('v18s3PhotoOrder').value=String(item?.sort_order||0);
    $('v18s3PhotoPublished').checked=item?!!item.is_published:true;
    $('v18s3PhotoFile').value='';
    $('v18s3PhotoImageHelp').textContent=item?'Choose a new image only if replacing the current photo.':'Required for new photos • JPG/PNG/WebP • max 5 MB';
    $('v18s3PhotoPreview').innerHTML=item?`<img src="${esc(mediaUrl(item.image_path))}" alt="Photo preview">`:'<small>Select an image to preview it here.</small>';
    $('v18s3PhotoDialog').showModal();
  }

  function installEvents(){
    $('v18s3AddPhotoBtn').onclick=()=>openPhoto();
    $('v18s3CoachPhoto').onchange=e=>{const file=e.target.files?.[0];if(file)$('v18s3CoachPreview').innerHTML=`<img src="${URL.createObjectURL(file)}" alt="New coach photo preview"><small>New photo preview</small>`;};
    $('v18s3PhotoFile').onchange=e=>{const file=e.target.files?.[0];if(file)$('v18s3PhotoPreview').innerHTML=`<img src="${URL.createObjectURL(file)}" alt="New gallery photo preview">`;};

    $('v18s3ProfileForm').onsubmit=async e=>{
      e.preventDefault();const btn=e.submitter,old=btn.textContent;btn.disabled=true;btn.textContent='Saving…';
      try{
        let path=profile?.coach_photo_path||null;const file=$('v18s3CoachPhoto').files?.[0];
        if(file){const oldPath=path;path=await uploadImage(file,'coach');if(oldPath)await db.storage.from('pickyla-media').remove([oldPath]);}
        const row={coach_name:clean($('v18s3CoachName').value),hero_lead:clean($('v18s3HeroLead').value),coach_bio:clean($('v18s3CoachBio').value),location_label:clean($('v18s3Location').value),schedule_label:clean($('v18s3Schedule').value),coach_photo_path:path,show_gallery:$('v18s3ShowGallery').checked,updated_at:new Date().toISOString()};
        const {error}=await db.from('site_profile').update(row).eq('id','main');if(error)throw error;toast('Coach profile updated');await loadSettings();
      }catch(err){alert(err.message);}finally{btn.disabled=false;btn.textContent=old;}
    };

    $('v18s3ShowGallery').onchange=async()=>{
      const {error}=await db.from('site_profile').update({show_gallery:$('v18s3ShowGallery').checked,updated_at:new Date().toISOString()}).eq('id','main');
      if(error){alert(error.message);$('v18s3ShowGallery').checked=!$('v18s3ShowGallery').checked;return;}
      toast($('v18s3ShowGallery').checked?'Gallery enabled':'Gallery hidden');
    };

    $('v18s3ContactForm').onsubmit=async e=>{
      e.preventDefault();const btn=e.submitter,old=btn.textContent;btn.disabled=true;btn.textContent='Saving…';
      try{
        const privateRow={facebook_url:clean($('v18s3Facebook').value)||null,messenger_url:clean($('v18s3Messenger').value)||null,phone:clean($('v18s3Phone').value)||null,email:clean($('v18s3Email').value)||null,show_facebook:$('v18s3ShowFacebook').checked,show_messenger:$('v18s3ShowMessenger').checked,show_phone:$('v18s3ShowPhone').checked,show_email:$('v18s3ShowEmail').checked,updated_at:new Date().toISOString()};
        const publicRow={public_facebook_url:privateRow.show_facebook?privateRow.facebook_url:null,public_messenger_url:privateRow.show_messenger?privateRow.messenger_url:null,public_phone:privateRow.show_phone?privateRow.phone:null,public_email:privateRow.show_email?privateRow.email:null,updated_at:new Date().toISOString()};
        const [{error:a},{error:b}]=await Promise.all([db.from('site_contact_private').update(privateRow).eq('id','main'),db.from('site_profile').update(publicRow).eq('id','main')]);
        if(a||b)throw(a||b);toast('Public contact settings updated');await loadSettings();
      }catch(err){alert(err.message);}finally{btn.disabled=false;btn.textContent=old;}
    };

    $('v18s3PhotoForm').onsubmit=async e=>{
      e.preventDefault();const btn=e.submitter,old=btn.textContent;btn.disabled=true;btn.textContent='Saving…';
      try{
        const id=$('v18s3PhotoId').value,item=gallery.find(x=>x.id===id),file=$('v18s3PhotoFile').files?.[0];
        let path=item?.image_path||null;if(!path&&!file)throw new Error('Choose an image first.');
        if(file){const oldPath=path;path=await uploadImage(file,'gallery');if(oldPath)await db.storage.from('pickyla-media').remove([oldPath]);}
        const row={title:clean($('v18s3PhotoName').value)||null,caption:clean($('v18s3PhotoCaption').value)||null,alt_text:clean($('v18s3PhotoAlt').value)||null,image_path:path,is_published:$('v18s3PhotoPublished').checked,sort_order:Number($('v18s3PhotoOrder').value)||0,updated_at:new Date().toISOString()};
        const {error}=id?await db.from('gallery_photos').update(row).eq('id',id):await db.from('gallery_photos').insert(row);
        if(error)throw error;$('v18s3PhotoDialog').close();toast(id?'Gallery photo updated':'Gallery photo added');await loadSettings();
      }catch(err){alert(err.message);}finally{btn.disabled=false;btn.textContent=old;}
    };
  }

  // Featured testimonial support while keeping existing moderation workflow.
  function installFeaturedTestimonials(){
    if(typeof loadV17BTestimonials!=='function'||window.pickylaV18S3Testimonials)return;
    const base=loadV17BTestimonials;
    loadV17BTestimonials=async function(){
      await base();
      const list=$('testimonialAdminList');if(!list)return;
      const cards=[...list.querySelectorAll('.testimonial-admin-card')];
      cards.forEach((card,i)=>{
        const t=v17bTestimonials[i];if(!t)return;
        card.dataset.testimonialId=t.id;
        if(t.is_featured)card.classList.add('v18s3-featured');
        const actions=card.querySelector('.testimonial-admin-actions');if(!actions||actions.querySelector('[data-feature]'))return;
        const b=document.createElement('button');b.type='button';b.dataset.feature='1';b.className='feature';b.textContent=t.is_featured?'Unfeature':'Feature';
        b.onclick=async()=>{const {error}=await db.from('testimonials').update({is_featured:!t.is_featured}).eq('id',t.id);if(error)return alert(error.message);toast(t.is_featured?'Removed from featured':'Featured testimonial updated');loadV17BTestimonials();};
        actions.prepend(b);
      });
    };
    window.pickylaV18S3Testimonials=true;
    loadV17BTestimonials();
  }

  async function install(){
    if(typeof db==='undefined'||!$('shareToolsSection'))return false;
    ensureUi();installEvents();installFeaturedTestimonials();
    try{await loadSettings();window.pickylaV18Session3AdminReady=true;}catch(e){console.error(e);const list=$('v18s3GalleryList');if(list)list.innerHTML=`<div class="empty">${esc(e.message)}</div>`;}
    return true;
  }
  let tries=0,t=setInterval(async()=>{tries++;if(await install()||tries>40)clearInterval(t);},250);
})();