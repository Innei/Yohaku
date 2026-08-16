export const ASSET_SCHEME = 'yohaku-asset'

export function normalizeSiteReferer(origin: string): string {
  const trimmed = origin.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return ''
    }
    return `${url.origin}/`
  } catch {
    return ''
  }
}

export function rewriteMediaUrl(
  raw: string,
  siteReferer: string,
  base = 'http://localhost',
): string {
  if (!raw) return raw
  if (raw.startsWith(`${ASSET_SCHEME}:`)) return raw
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw
  let parsed: URL
  try {
    parsed = raw.startsWith('//') ? new URL(`https:${raw}`) : new URL(raw, base)
  } catch {
    return raw
  }
  if (parsed.protocol !== 'https:') return raw
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
    return raw
  }
  const referer = encodeURIComponent(normalizeSiteReferer(siteReferer))
  const target = encodeURIComponent(parsed.href)
  return `${ASSET_SCHEME}://image?r=${referer}&u=${target}`
}

export function rewriteSrcSet(
  srcset: string,
  siteReferer: string,
  base = 'http://localhost',
): string {
  return srcset
    .split(',')
    .map((part) => {
      const trimmed = part.trim()
      if (!trimmed) return part
      const [url, ...rest] = trimmed.split(/\s+/)
      return [rewriteMediaUrl(url, siteReferer, base), ...rest].join(' ')
    })
    .join(', ')
}

export function parseAssetRequest(
  rewritten: string,
): { referer: string; url: string } | null {
  try {
    const parsed = new URL(rewritten)
    if (parsed.protocol !== `${ASSET_SCHEME}:`) return null
    const url = parsed.searchParams.get('u')
    const referer = parsed.searchParams.get('r')
    if (!url || referer == null) return null
    return { referer, url }
  } catch {
    return null
  }
}

export function buildMediaRewriteScript(siteReferer: string): string {
  const referer = JSON.stringify(normalizeSiteReferer(siteReferer))
  const scheme = JSON.stringify(ASSET_SCHEME)
  return `(function(){
var SITE=${referer};
var SCHEME=${scheme};
function rewrite(raw){
  if(!raw)return raw;
  if(raw.indexOf(SCHEME+':')===0||raw.indexOf('data:')===0||raw.indexOf('blob:')===0)return raw;
  var parsed;
  try{parsed=raw.indexOf('//')===0?new URL('https:'+raw):new URL(raw,location.href);}catch(e){return raw;}
  if(parsed.protocol!=='https:')return raw;
  if(parsed.hostname==='localhost'||parsed.hostname==='127.0.0.1')return raw;
  return SCHEME+'://image?r='+encodeURIComponent(SITE)+'&u='+encodeURIComponent(parsed.href);
}
function rewriteSrcSet(value){
  return String(value).split(',').map(function(part){
    var trimmed=part.trim();
    if(!trimmed)return part;
    var bits=trimmed.split(/\\s+/);
    bits[0]=rewrite(bits[0]);
    return bits.join(' ');
  }).join(', ');
}
function patch(proto,name,fn){
  var desc=Object.getOwnPropertyDescriptor(proto,name);
  if(!desc||!desc.set)return;
  Object.defineProperty(proto,name,{
    configurable:true,
    enumerable:desc.enumerable,
    get:function(){return desc.get.call(this);},
    set:function(v){desc.set.call(this,fn(v));}
  });
}
patch(HTMLImageElement.prototype,'src',function(v){return rewrite(String(v==null?'':v));});
patch(HTMLImageElement.prototype,'srcset',function(v){return rewriteSrcSet(v==null?'':v);});
if(typeof HTMLSourceElement!=='undefined'){
  patch(HTMLSourceElement.prototype,'srcset',function(v){return rewriteSrcSet(v==null?'':v);});
}
if(typeof HTMLVideoElement!=='undefined'){
  patch(HTMLVideoElement.prototype,'poster',function(v){return rewrite(String(v==null?'':v));});
}
var setAttribute=Element.prototype.setAttribute;
Element.prototype.setAttribute=function(name,value){
  if(this instanceof HTMLImageElement){
    if(name==='src')return setAttribute.call(this,name,rewrite(String(value==null?'':value)));
    if(name==='srcset')return setAttribute.call(this,name,rewriteSrcSet(value==null?'':value));
  }
  if(typeof HTMLSourceElement!=='undefined'&&this instanceof HTMLSourceElement&&name==='srcset'){
    return setAttribute.call(this,name,rewriteSrcSet(value==null?'':value));
  }
  if(typeof HTMLVideoElement!=='undefined'&&this instanceof HTMLVideoElement&&name==='poster'){
    return setAttribute.call(this,name,rewrite(String(value==null?'':value)));
  }
  return setAttribute.call(this,name,value);
};
})();`
}
