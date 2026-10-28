/**
 * Filters are scoped to a category AND definition slug, not just to a key:
 * "electronics.ram:8 GB" never matches a fashion category's "ram".
 * Each repeated (category,slug) key is OR'd across values; separate keys
 * combine with AND in the database before page totals and ordering.
 */
export type AttributeFilter={category:string;slug:string;values:string[]};
export type AttributeFiltersParse={filters:AttributeFilter[];invalid:boolean};
const slug=/^[a-z0-9][a-z0-9-]{0,63}$/;
const maxValues=20;
const maxGroups=8;
const maxValueLength=80;
const validValue=(v:string)=>v.length>0&&v.length<=maxValueLength&&
  !/[\u0000-\u001f\u007f]/.test(v);
/** Reject instead of dropping malformed filters; silent dropping broadens queries. */
export function parseAttributeFilters(raw:readonly string[]):AttributeFiltersParse{
  if(raw.length>maxValues)return {filters:[],invalid:true};
  const groups=new Map<string,AttributeFilter>();
  for(const entry of raw){
    if(entry.length>260)return {filters:[],invalid:true};
    const m=/^([a-z0-9-]{1,64})\.([a-z0-9-]{1,64}):(.+)$/.exec(entry);
    if(!m||!slug.test(m[1])||!slug.test(m[2])||!validValue(m[3]))
      return {filters:[],invalid:true};
    const key=m[1]+"."+m[2];
    const group=groups.get(key)??{category:m[1],slug:m[2],values:[]};
    if(!groups.has(key))groups.set(key,group);
    if(!group.values.includes(m[3]))group.values.push(m[3]);
    if(groups.size>maxGroups||group.values.length>8)
      return {filters:[],invalid:true};
  }
  return {filters:[...groups.values()],invalid:false};
}
export function formatAttributeFilter(filter:AttributeFilter,value:string):string{
  return filter.category+"."+filter.slug+":"+value;
}
export type PublicAttributeFacet={
  category:string;slug:string;label:string;
  type:"SELECT"|"COLOR"|"MULTI_SELECT"|"BOOLEAN"|"TEXT"|"NUMBER";
  options:string[];
};
