import { ValidationError } from "@/lib/db/errors";
import { getYouTubeVideoId, isDirectVideoUrl, isSupportedPosterUrl } from "@/lib/product-media";

/**
 * Cross-branch media contract:
 *   0 = primary poster, 1 = video, 10..29 = extra gallery.
 * Legacy images below 10 are never silently deleted by gallery updates.
 */
export const GALLERY_START=10;
export const GALLERY_MAX=20;
export type GalleryImage={url:string;alt:string;sortOrder:number};
export function normalizeProductGallery(value:unknown,name:string):GalleryImage[]{
  if(!Array.isArray(value)||value.length>GALLERY_MAX)
    throw new ValidationError("Product gallery must contain up to 20 images.");
  const seen=new Set<string>();
  const title=name.trim().slice(0,160)||"Product";
  return value.map((entry,index)=>{
    const raw=typeof entry==="string"?entry:
      entry && typeof entry==="object"&&!Array.isArray(entry) && "url" in entry
        ? (entry as {url:unknown}).url : null;
    if(typeof raw!=="string" || raw.length>1500)
      throw new ValidationError("Gallery image URL is invalid.");
    const url=raw.trim();
    if(!isSupportedPosterUrl(url))
      throw new ValidationError("Use an approved HTTPS gallery image URL.");
    if(seen.has(url))throw new ValidationError("Duplicate gallery image URL.");
    seen.add(url);
    return {url,alt:title+" image "+(index+1),sortOrder:GALLERY_START+index};
  });
}
export function galleryFromMedia(images:readonly {url:string;sortOrder:number}[]):string[]{
  return images.filter(x=>x.sortOrder>=GALLERY_START&&x.sortOrder<GALLERY_START+GALLERY_MAX
    &&isSupportedPosterUrl(x.url) && !isDirectVideoUrl(x.url) && !getYouTubeVideoId(x.url))
    .sort((a,b)=>a.sortOrder-b.sortOrder).map(x=>x.url);
}
export function primaryMedia(images:readonly {url:string;sortOrder:number}[]){
  const video=images.find(x=>x.sortOrder===1 &&
    (isDirectVideoUrl(x.url)||Boolean(getYouTubeVideoId(x.url))))
    ??images.find(x=>x.sortOrder<GALLERY_START &&
      (isDirectVideoUrl(x.url)||Boolean(getYouTubeVideoId(x.url))));
  const poster=images.find(x=>x.sortOrder===0&&isSupportedPosterUrl(x.url))
    ??images.find(x=>x.sortOrder<GALLERY_START && isSupportedPosterUrl(x.url) &&
      x.url!==video?.url);
  return {videoUrl:video?.url??null,posterUrl:poster?.url??null};
}
