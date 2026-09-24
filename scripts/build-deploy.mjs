// Only public site files enter the production output; keep QA sources private.
import './build.mjs';
import {cpSync,mkdirSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const file of ['index.html','ko','privacy','support','404.html','assets','robots.txt','sitemap.xml','llms.txt','manifest.webmanifest','favicon.ico','apple-touch-icon.png','icon-192.png','icon-512.png'])cpSync(path.join(root,file),path.join(out,file),{recursive:true});
console.log('Prepared public production files in dist/.');
