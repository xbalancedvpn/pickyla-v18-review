// PICKYLA v18 Session 3 - Public content layer
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const mediaUrl=path=>path?db.storage.from('pickyla-media').getPublicUrl(path).data.publicUrl:'';

  function ensureGallery(){
    if($('v18s3GallerySection'))return;
    const testimonials=$('testimonialsSection');if(!testimonials)return;
    const sec=document.createElement('section');sec.id='v18s3GallerySection';sec.className='section v18s3-public-gallery';
    sec.innerHTML=`<div class="section-heading"><span class="eyebrow dark">ON THE COURT</span><h2>PICKYLA moments.</h2><p>Coaching, training, and player-development moments shared by PICKYLA.</p></div><div id="v18s3PublicGallery" class="v18s3-public-gallery-grid"><div class="testimonial-empty">Gallery photos will appear here.</div></div>`;
    testimonials.insertAdjacentElement('afterend',sec);
    const nav=$('mainNav');if(nav&&!nav.querySelector('[href="#v18s3GallerySection"]')){const a=document.createElement('a');a.href='#v18s3GallerySection';a.dataset.publicTab='v18s3GallerySection';a.textContent='Gallery';const test=nav.querySelector('[href="#testimonialsSection"]');test?.insertAdjacentElement('afterend',a);}
  }

  async function loadContent(){
    ensureGallery();
    const [{data:p,error:pe},{data:g,error:ge}]=await Promise.all([
      db.from('site_profile').select('*').eq('id','main').maybeSingle(),
      db.from('gallery_photos').select('title,caption,alt_text,image_path,sort_order').eq('is_published',true).order('sort_order').order('created_at',{ascending:false})
    ]);
    if(pe)console.warn(pe);if(ge)console.warn(ge);
    if(p){
      const heroLead=document.querySelector('.hero-lead');if(heroLead&&p.hero_lead)heroLead.textContent=p.hero_lead;
      const about=$('about');if(about){
        const h=about.querySelector('h2'),bio=about.querySelector(':scope > p');if(h&&p.coach_name)h.textContent=p.coach_name;if(bio&&p.coach_bio)bio.textContent=p.coach_bio;
        const info=about.querySelectorAll('.quick-info>div');if(info[0]&&p.location_label){const parts=p.location_label.split(',').map(x=>x.trim());info[0].querySelector('strong').textContent=parts[0]||p.location_label;info[0].querySelector('small').textContent=parts.slice(1).join(', ')||'';}
        if(info[1]&&p.schedule_label){const parts=p.schedule_label.split('•').map(x=>x.trim());info[1].querySelector('strong').textContent=parts[0]||p.schedule_label;info[1].querySelector('small').textContent=parts.slice(1).join(' • ')||'';}
      }
      const photo=document.querySelector('.hero-photo img');if(photo&&p.coach_photo_path)photo.src=mediaUrl(p.coach_photo_path);
      const contact=$('contact');if(contact){
        const actions=contact.querySelector('.contact-actions');if(actions){
          [...actions.querySelectorAll('[data-v18s3-contact]')].forEach(x=>x.remove());
          const existingFb=actions.querySelector('a[href*="facebook.com"]');if(existingFb)existingFb.remove();
          const add=(href,label)=>{if(!href)return;const a=document.createElement('a');a.className='btn primary';a.dataset.v18s3Contact='1';a.href=href;a.target='_blank';a.rel='noopener';a.textContent=label;actions.prepend(a);};
          if(p.public_email)add('mailto:'+p.public_email,'Email PICKYLA');
          if(p.public_phone)add('tel:'+p.public_phone,'Call / Text');
          if(p.public_messenger_url)add(p.public_messenger_url,'Messenger');
          if(p.public_facebook_url)add(p.public_facebook_url,'Facebook • '+(p.coach_name||'PICKYLA'));
        }
      }
      const gallerySec=$('v18s3GallerySection');if(gallerySec)gallerySec.classList.toggle('hidden',p.show_gallery===false);
    }

    const grid=$('v18s3PublicGallery');
    if(grid){
      if(!(g||[]).length)grid.innerHTML='<div class="testimonial-empty">Gallery photos will appear here.</div>';
      else grid.innerHTML=(g||[]).map(x=>`<figure class="v18s3-public-photo"><img src="${esc(mediaUrl(x.image_path))}" alt="${esc(x.alt_text||x.title||'PICKYLA coaching photo')}" loading="lazy"><figcaption>${x.title?`<strong>${esc(x.title)}</strong>`:''}${x.caption?`<span>${esc(x.caption)}</span>`:''}</figcaption></figure>`).join('');
    }
  }

  function installFeaturedTestimonials(){
    if(typeof loadTestimonials!=='function'||window.pickylaV18S3PublicTestimonials)return;
    loadTestimonials=async function(){
      const section=$('testimonialsSection'),grid=$('testimonialGrid');if(!section||!grid)return;section.classList.remove('hidden');
      const {data,error}=await db.from('testimonials').select('display_name,player_level,quote,sort_order,is_featured').eq('is_published',true).eq('review_status','approved').order('is_featured',{ascending:false}).order('sort_order').order('created_at');
      if(error||!(data||[]).length){grid.innerHTML='<div class="testimonial-empty">Published player stories will appear here. You can be the first to share your experience.</div>';return;}
      grid.innerHTML=(data||[]).map(t=>`<article class="testimonial-card ${t.is_featured?'v18s3-featured-story':''}">${t.is_featured?'<span class="v18s3-featured-label">FEATURED</span>':''}<div class="quote-mark">“</div><blockquote>${esc(t.quote)}</blockquote><strong>${esc(t.display_name)}</strong><small>${esc(t.player_level||'PICKYLA Player')}</small></article>`).join('');
    };
    window.pickylaV18S3PublicTestimonials=true;loadTestimonials();
  }

  async function install(){
    if(typeof db==='undefined'||!$('testimonialsSection'))return false;
    installFeaturedTestimonials();await loadContent();window.pickylaV18Session3PublicReady=true;return true;
  }
  let tries=0,t=setInterval(async()=>{tries++;if(await install()||tries>40)clearInterval(t);},250);
})();