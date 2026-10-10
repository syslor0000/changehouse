// Real before/after photographs frame three clearly identified AI work scenes.
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const smooth=v=>v*v*(3-2*v);
export function createStoryStage(container,{roomLabel,before,workPhotos,after}){
  if(workPhotos.length!==3)throw new Error('Three work scenes are required.');
  const sources=[before,...workPhotos,after];
  const titles=['실제 정리 전','두 사람이 함께 분류해요','수납함에 나눠 담아요','쓰임에 맞게 제자리에','실제 정리 후'];
  container.classList.add('story-stage');container.setAttribute('role','img');
  const frame=document.createElement('div');frame.className='photo-sequence';container.append(frame);
  const images=sources.map((src,i)=>{const image=new Image();image.src=src;image.alt='';image.decoding='async';image.className='sequence-frame';image.style.zIndex=String(i);image.style.opacity=i===0?'1':'0';frame.append(image);return image;});
  const badge=document.createElement('span');badge.className='sequence-badge';container.append(badge);
  const steps=document.createElement('div');steps.className='sequence-steps';steps.setAttribute('aria-hidden','true');
  titles.forEach(()=>{const step=document.createElement('i');steps.append(step);});container.append(steps);
  let last=0,disposed=false;
  function render(progress){
    if(disposed)return;last=clamp(progress);
    const boundaries=[.12,.32,.52,.76], blendWidth=.10;
    let active=0;
    images.forEach((img,i)=>{if(i===0){img.style.opacity='1';return;}const t=clamp((last-boundaries[i-1])/blendWidth);const ready=img.complete&&img.naturalWidth>0;img.style.opacity=ready?smooth(t).toFixed(4):'0';if(t>=.5&&ready)active=i;});
    const kind=active===0?'BEFORE':active===4?'AFTER':`AI 재현 · 0${active}/03`;
    badge.textContent=`${kind} · ${titles[active]}`;badge.dataset.complete=String(active===4);
    [...steps.children].forEach((el,i)=>el.classList.toggle('active',i<=active));container.dataset.phase=String(active);
    container.setAttribute('aria-label',`${roomLabel}: ${titles[active]}.${active>0&&active<4?' 두 명이 정리하는 AI 재현 장면입니다.':' 실제 현장 사진입니다.'}`);
  }
  images.forEach(image=>image.addEventListener('load',()=>render(last)));render(0);
  return {render,getPhase:p=>{const index=[.17,.37,.57,.81].filter(value=>clamp(p)>=value).length;return {index,label:titles[index]};},destroy(){disposed=true;frame.remove();badge.remove();steps.remove();}};
}
