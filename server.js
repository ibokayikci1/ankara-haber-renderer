import express from 'express';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(express.json({limit:'1mb'}));
const dir=path.dirname(fileURLToPath(import.meta.url));
const templatePath=path.join(dir,'public','template.html');
let browser;
const safe = value => String(value ?? '').slice(0,500);
app.get('/health',(_req,res)=>res.json({ok:true}));
app.post('/render', async(req,res)=>{
  if(!process.env.RENDER_API_KEY || req.get('X-API-Key')!==process.env.RENDER_API_KEY) return res.status(401).json({error:'Unauthorized'});
  const d=req.body||{};
  if(!d.photo_data_uri || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d.photo_data_uri) || d.photo_data_uri.length>8_000_000) return res.status(422).json({error:'Licensed photo_data_uri is required (jpeg/png/webp base64; maximum 8 MB). No fake news photos.'});
  let page;
  try{
    browser ||= await chromium.launch({headless:true,args:['--no-sandbox']});
    page=await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
    await page.route('**/*',route=>route.abort());
    const html=await fs.readFile(templatePath,'utf8');
    const logo=await fs.readFile(path.join(dir,'public','logo.png'));
    await page.setContent(html.replace('src="logo.png"',`src="data:image/png;base64,${logo.toString('base64')}"`),{waitUntil:'load'});
    await page.evaluate(d=>{
      const put=(id,v)=>document.getElementById(id).textContent=String(v??'').slice(0,250);
      put('category',d.kategori||'GÜNDEM'); put('title',d.baslik);put('subtitle',d.alt_baslik);put('source','Kaynak: '+(d.kaynak_adi||'Belirtilmedi'));put('date',d.tarih||'');
      document.getElementById('placeholder').remove();
      const img=document.createElement('img');img.src=d.photo_data_uri;img.alt='İzinli haber fotoğrafı';document.getElementById('photo').prepend(img);
      if(d.fotograf_kredisi){const credit=document.getElementById('photoCredit');credit.style.display='block';credit.textContent='Fotoğraf: '+String(d.fotograf_kredisi).slice(0,100);}
    },{kategori:safe(d.kategori),baslik:safe(d.baslik),alt_baslik:safe(d.alt_baslik),kaynak_adi:safe(d.kaynak_adi),tarih:safe(d.tarih),photo_data_uri:d.photo_data_uri,fotograf_kredisi:safe(d.fotograf_kredisi)});
    await page.locator('.photo img').evaluate(img=>img.decode());
    const title=page.locator('#title');
    let size=63;
    while(size>37 && await title.evaluate(e=>e.scrollHeight>e.clientHeight)){size-=2;await title.evaluate((e,s)=>e.style.fontSize=s+'px',size)}
    const png=await page.screenshot({type:'png'});
    res.set('Content-Type','image/png').send(png);
  }catch(error){res.status(500).json({error:'Render failed',detail:String(error.message).slice(0,250)});}finally{if(page)await page.close();}
});
app.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Ankara renderer ready'));
