import{H as r,l as s,e as i,P as a,c as m}from"./index-DRvXHWsk.js";/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */const d=()=>{const e=window;e.addEventListener("statusTap",()=>{r(()=>{const n=document.elementFromPoint(e.innerWidth/2,e.innerHeight/2);if(!n)return;const t=s(n);t&&new Promise(o=>i(t,o)).then(()=>{a(async()=>{t.style.setProperty("--overflow","hidden"),await m(t,300),t.style.removeProperty("--overflow")})})})})};export{d as startStatusTap};
