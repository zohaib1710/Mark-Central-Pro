import { chromium } from 'playwright-core';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const executablePath='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser=await chromium.launch({headless:true,executablePath});
const pages=(await readdir('dist')).filter(file=>file.endsWith('.html'));
const sizes=process.argv.length>2?process.argv.slice(2).map(Number):[320,375,390,430,768,1024,1280,1440,1920];
const failures=[];

for(const width of sizes){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  for(const file of pages){
    const errors=[];
    page.removeAllListeners('pageerror');
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`http://127.0.0.1:8000/${file}`,{waitUntil:'domcontentloaded'});
    const metrics=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,h1:document.querySelectorAll('h1').length}));
    if(metrics.scrollWidth>metrics.clientWidth+1)failures.push(`${file} at ${width}px overflows by ${metrics.scrollWidth-metrics.clientWidth}px`);
    if(metrics.h1!==1)failures.push(`${file} at ${width}px has ${metrics.h1} H1 elements`);
    if(errors.length)failures.push(`${file} at ${width}px console: ${errors.join('; ')}`);
  }
  await context.close();
}

const desktop=await browser.newContext({viewport:{width:1440,height:900}});
const desktopPage=await desktop.newPage();
await desktopPage.goto('http://127.0.0.1:8000/index.html');
const polish=await desktopPage.evaluate(()=>{const logo=document.querySelector('.footer-brand img');const caption=document.querySelector('.quote figcaption');return{logoFilter:getComputedStyle(logo).filter,logoWidth:logo.getBoundingClientRect().width,captionDirection:getComputedStyle(caption).flexDirection}});
if(polish.logoFilter!=='none'||polish.logoWidth<150)failures.push('Footer logo styling is not visible at desktop size');
if(polish.captionDirection!=='column')failures.push('Testimonial attribution is not stacked');
const animated=desktopPage.locator('.section-head').first();
await animated.scrollIntoViewIfNeeded();
await desktopPage.waitForTimeout(800);
if(Number(await animated.evaluate(el=>getComputedStyle(el).opacity))<.9)failures.push('Entrance animation did not reveal content');
await desktop.close();

const context=await browser.newContext({viewport:{width:390,height:850}});
const page=await context.newPage();
const nonGetRequests=[];
page.on('request',request=>{if(request.method()!=='GET')nonGetRequests.push(`${request.method()} ${request.url()}`)});
await page.goto('http://127.0.0.1:8000/index.html');
await page.click('#menu-toggle');
if(await page.getAttribute('#mobile-panel','aria-hidden')!=='false')failures.push('Mobile menu did not open');
await page.keyboard.press('Escape');
if(await page.getAttribute('#mobile-panel','aria-hidden')!=='true')failures.push('Mobile menu did not close with Escape');
await page.click('.hero [data-modal-trigger]');
if(await page.getAttribute('#lead-modal','aria-hidden')!=='false')failures.push('Lead modal did not open');
await page.fill('#lead-name','Test User');
await page.fill('#lead-email','test@example.com');
await page.fill('#lead-phone','+1 555 555 5555');
await page.fill('#lead-business','Accessibility and form validation check.');
await page.click('#lead-form [type="submit"]');
const statusClass=await page.locator('#lead-form .form-status').getAttribute('class');
if(!statusClass.includes('show'))failures.push('Disconnected form status did not appear');
if(nonGetRequests.length)failures.push(`Form made network requests: ${nonGetRequests.join(', ')}`);
await page.click('[data-modal-backdrop]',{position:{x:5,y:5}});
if(await page.getAttribute('#lead-modal','aria-hidden')!=='true')failures.push('Lead modal did not close from backdrop');
await page.goto('http://127.0.0.1:8000/faq.html');
await page.click('.faq-button');
if(await page.getAttribute('.faq-button','aria-expanded')!=='true')failures.push('FAQ did not expand');
await page.waitForTimeout(350);
if(await page.locator('.faq-panel').first().evaluate(el=>el.getBoundingClientRect().height)<20)failures.push('FAQ answer panel remained collapsed');
await page.goto(pathToFileURL(resolve('dist/faq.html')).href);
await page.click('.faq-button');
if(await page.getAttribute('.faq-button','aria-expanded')!=='true')failures.push('FAQ did not expand from a local file');
await page.waitForTimeout(350);
if(await page.locator('.faq-panel').first().evaluate(el=>el.getBoundingClientRect().height)<20)failures.push('FAQ answer panel remained collapsed from a local file');
await context.close();
await browser.close();

await mkdir('reports',{recursive:true});
const result=failures.length?failures.join('\n'):`Visual and interaction checks passed for ${pages.length} pages at ${sizes.join(', ')}px.`;
await writeFile(`reports/visual-check-${sizes.join('-')}.txt`,result);
if(failures.length){console.error(result);process.exit(1)}
console.log(result);
