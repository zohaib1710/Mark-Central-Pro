import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const dist=path.resolve('dist');const files=(await readdir(dist)).filter(f=>f.endsWith('.html'));let failures=[];
if(files.length!==10)failures.push(`Expected 10 HTML pages, found ${files.length}`);
for(const file of files){const html=await readFile(path.join(dist,file),'utf8');const h1=(html.match(/<h1\b/g)||[]).length;if(h1!==1)failures.push(`${file}: expected one H1, found ${h1}`);for(const token of ['<title>','name="description"','rel="canonical"','property="og:title"','application/ld+json','class="skip-link"','id="lead-modal"'])if(!html.includes(token))failures.push(`${file}: missing ${token}`);if(/type=["']password/i.test(html))failures.push(`${file}: contains a password input`);const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);if(duplicates.length)failures.push(`${file}: duplicate IDs ${[...new Set(duplicates)].join(', ')}`);for(const match of html.matchAll(/href="([^"#]+\.html)"/g)){if(/^https?:/.test(match[1]))continue;const target=path.join(dist,match[1]);try{await stat(target)}catch{failures.push(`${file}: broken link ${match[1]}`)}}}
const js=await readFile(path.join(dist,'js','main.js'),'utf8');if(/fetch\(|XMLHttpRequest|localStorage|sessionStorage/.test(js))failures.push('Form script contains a network or storage API');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Checked ${files.length} pages: metadata, headings, internal links, modal shell, and disconnected forms look good.`);
