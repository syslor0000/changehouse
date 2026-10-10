import {createStoryStage} from './scene.js';
import {initQuote} from './quote.js';
import {initGallery} from './gallery.js';

const descriptions={
  bedroom:[
    ['평택 · 실제 정리 전','책상과 바닥에 쌓인 물건들.','책과 장난감이 뒤섞여, 공부하고 놀이할 자리가 좁아져 있었습니다.'],
    ['함께 정리해요 · AI 재현','책은 책끼리, 장난감은 장난감끼리.','두 사람이 책과 장난감을 나눠 살펴보고, 남길 물건을 분류합니다.'],
    ['제자리를 만들어요 · AI 재현','아이가 꺼내고, 다시 놓기 쉽게.','수납함에 나눠 담고 책장과 놀이 공간에 놓습니다. 마지막까지 함께 정돈합니다.'],
    ['평택 · 실제 정리 후','짜잔. 공부와 놀이가 함께하는 방.','책상과 바닥에 여유가 생겼습니다. 아이의 생활에 맞는 자리가 보입니다.']
  ],
  kitchen:[
    ['세종 · 이사 후 실제 정리 전','이삿짐으로 가득한 조리대.','이사 후 섞인 물건들 때문에 아일랜드와 조리대를 쓰기 어려웠습니다.'],
    ['함께 정리해요 · AI 재현','그릇은 그릇끼리, 용기는 용기끼리.','두 사람이 그릇과 용기를 살펴, 함께 쓰는 물건끼리 분류합니다.'],
    ['제자리를 만들어요 · AI 재현','꺼내기 쉽게. 다시 놓기도 쉽게.','수납함에 나눠 담고 쓰임에 맞게 배치합니다. 조리대에도 여유가 생깁니다.'],
    ['세종 · 이사 후 실제 정리 후','짜잔. 요리할 자리가 돌아왔어요.','아일랜드 위가 비워지고, 그릇과 조리도구가 쓰임에 따라 정돈되었습니다.']
  ]
};
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=reducedQuery.matches, userChoseMotion=false, frame=0;
const clamp=v=>Math.max(0,Math.min(1,v));
const manualLayout=c=>reduced||getComputedStyle(c.el.querySelector('.chapter-sticky')).position!=='sticky';
const chapters=[...document.querySelectorAll('.chapter')].map(el=>{
  const room=el.dataset.room;
  const photos=room==='bedroom'?{roomLabel:'평택 아이방',before:'assets/pyeongtaek-kids-before.webp',workPhotos:['assets/pyeongtaek-ai-sort.webp','assets/pyeongtaek-ai-store.webp','assets/pyeongtaek-ai-place.webp'],after:'assets/pyeongtaek-kids-after.webp'}:{roomLabel:'세종 주방',before:'assets/sejong-kitchen-before.webp',workPhotos:['assets/sejong-ai-sort.webp','assets/sejong-ai-store.webp','assets/sejong-ai-place.webp'],after:'assets/sejong-kitchen-after.webp'};
  return {el,room,stage:createStoryStage(el.querySelector('.scene-mount'),photos),progress:0,manual:0};
});
function updateChapter(c,p){
  c.progress=p;c.stage.render(p);
  const phase=p<.17?0:p<.37?1:p<.81?2:3;
  const copy=descriptions[c.room][phase];
  c.el.querySelector('.phase-eyebrow').textContent=copy[0];
  c.el.querySelector('.phase-title').textContent=copy[1];
  c.el.querySelector('.phase-description').textContent=copy[2];
  c.el.querySelector('.progress-number').textContent=String(Math.round(p*100)).padStart(2,'0');
  c.el.querySelector('.scene-progress>span').style.width=`${p*100}%`;
  c.el.querySelectorAll('.phase-list li').forEach((li,i)=>{li.classList.toggle('active',i===phase);li.classList.toggle('done',i<phase);if(i===phase)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});
  c.el.querySelectorAll('[data-jump]').forEach(button=>{
    const value=Number(button.dataset.jump), active=value===0?p<.17:value===1?p>=.81:p>=.17&&p<.81;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
}
function update(){
  frame=0;
  const header=document.querySelector('.site-header').offsetHeight;
  chapters.forEach(c=>{
    if(manualLayout(c)){updateChapter(c,c.manual);return;}
    const rect=c.el.getBoundingClientRect();
    const sticky=c.el.querySelector('.chapter-sticky').offsetHeight;
    const distance=Math.max(1,c.el.offsetHeight-sticky);
    updateChapter(c,clamp((header-rect.top)/distance));
  });
}
function schedule(){if(!frame)frame=requestAnimationFrame(update);}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
chapters.forEach(c=>{
  c.el.querySelectorAll('[data-jump]').forEach(button=>button.addEventListener('click',()=>{
    const p=Number(button.dataset.jump);
    if(manualLayout(c)){c.manual=p;updateChapter(c,p);return;}
    const header=document.querySelector('.site-header').offsetHeight;
    const top=c.el.getBoundingClientRect().top+scrollY;
    const distance=c.el.offsetHeight-c.el.querySelector('.chapter-sticky').offsetHeight;
    window.scrollTo({top:top-header+distance*p,behavior:'smooth'});
  }));
});
function applyMotion(){
  document.documentElement.classList.toggle('reduce-motion',reduced);
  const button=document.querySelector('.motion-toggle');
  button.setAttribute('aria-pressed',String(reduced));
  button.querySelector('.motion-icon').textContent=reduced?'▶':'Ⅱ';
  button.querySelector('.motion-label').textContent=reduced?'움직임 켜기':'움직임 줄이기';
  button.title=reduced?'스크롤 정리 과정 보기':'움직임을 줄이고 전후 사진으로 보기';
  button.setAttribute('aria-label',reduced?'움직임 켜기':'움직임 줄이기');
  chapters.forEach(c=>c.manual=c.progress>.5?1:0);
  schedule();
}
document.querySelector('.motion-toggle').addEventListener('click',()=>{userChoseMotion=true;reduced=!reduced;applyMotion();});
reducedQuery.addEventListener('change',e=>{if(!userChoseMotion){reduced=e.matches;applyMotion();}});
applyMotion();
document.fonts?.ready.then(schedule);


initQuote();
initGallery();
