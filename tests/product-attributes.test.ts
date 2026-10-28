import assert from "node:assert/strict";
import test from "node:test";
import {
  validateAttributeDefinition,validateProductAttributes,publicSpecifications,
  validateAttributeStateChange,
} from "../lib/admin/product-attributes";
type Type="TEXT"|"NUMBER"|"SELECT"|"MULTI_SELECT"|"BOOLEAN"|"COLOR"|"DATE"|"IMAGE_REQUEST";
const definition=(slug:string,type:Type,options:unknown=[],required=false)=>({
  slug,name:slug,type,active:true,required,options,sortOrder:0,
});
test("Cline-compatible attribute definition validates category, bounded type, options",()=>{
  assert.deepEqual(validateAttributeDefinition({
    categoryId:"cat-1",name:"RAM",type:"SELECT",options:["4 GB","8 GB","4 GB"],required:true,
  }),{
    categoryId:"cat-1",name:"RAM",slug:"ram",type:"SELECT",
    options:["4 GB","8 GB"],required:true,active:true,sortOrder:0,
  });
  for(const input of [
    null,{},[],{categoryId:"cat-1",name:"RAM",type:"INVALID"},
    {categoryId:"cat-1",name:"RAM",type:"SELECT",options:[]},
    {categoryId:"cat-1",name:"RAM",type:"TEXT",options:["bad"]},
    {categoryId:"cat-1",name:"RAM",type:"NUMBER",required:"yes"},
    {categoryId:"cat-1",name:"a".repeat(90)},
    {categoryId:"cat-1",name:"スペック"},
    {categoryId:"cat-1",name:"RAM",sortOrder:1.5},
  ])assert.throws(()=>validateAttributeDefinition(input));
});
test("draft permits missing required values but activation rejects them",()=>{
  const defs=[definition("ram","SELECT",["4 GB","8 GB"],true)];
  assert.deepEqual(validateProductAttributes(defs,{},false),{});
  assert.throws(()=>validateProductAttributes(defs,{},true),/required before publishing/);
  assert.deepEqual(validateProductAttributes(defs,{ram:"8 GB"},true),{ram:"8 GB"});
  assert.throws(()=>validateProductAttributes(defs,{ram:"64 GB"},true),/allowed option/);
});
test("typed specifications reject invalid values and unknown attributes",()=>{
  const defs=[
    definition("material","TEXT"),
    definition("battery-mah","NUMBER"),
    definition("sim-support","BOOLEAN"),
    definition("colours","MULTI_SELECT",["black","blue"]),
    definition("colour","COLOR",["black","blue"]),
    definition("release","DATE"),
    definition("product-image","IMAGE_REQUEST"),
  ];
  const values={
    material:" Aluminium ", "battery-mah":650, "sim-support":false,
    colours:["black","blue"], colour:"blue", release:"2026-10-28",
    "product-image":"https://images.unsplash.com/photo-1234567890",
  };
  const clean=validateProductAttributes(defs,values,true);
  assert.equal(clean.material,"Aluminium");
  assert.equal(clean["sim-support"],false);
  for(const invalid of [
    {ram:"2 GB"}, {"battery-mah":"650"}, {"battery-mah":Infinity},
    {"sim-support":"no"}, {colours:["black","black"]}, {colours:["green"]},
    {release:"2026-02-30"}, {"product-image":"https://evil.example/image.png"},
    {"__proto__":"evil"},
  ]){
    if(Object.keys(invalid).length)assert.throws(()=>validateProductAttributes(defs,invalid,true));
  }
});
test("safe public specs only show active defined values, preserve numeric zero and boolean false",()=>{
  const defs=[
    definition("ram","TEXT"),
    definition("power","NUMBER"),
    definition("sim","BOOLEAN"),
    {...definition("hidden","TEXT"),active:false},
    definition("picture","IMAGE_REQUEST"),
  ];
  const view=publicSpecifications(defs,{ram:"4 GB",power:0,sim:false,hidden:"do not leak",picture:"https://images.unsplash.com/test",unknown:"secret"});
  assert.deepEqual(view,[
    {label:"ram",value:"4 GB"},{label:"power",value:"0"},{label:"sim",value:"No"},
  ]);
  assert.deepEqual(publicSpecifications(defs,null),[]);
});
test("only active state can change through owner Attribute API",()=>{
  assert.deepEqual(validateAttributeStateChange({id:"attr-id",active:false}),
    {id:"attr-id",active:false});
  for(const invalid of [{id:"x",active:"false"},{id:"x",active:true,type:"TEXT"},{}])
    assert.throws(()=>validateAttributeStateChange(invalid));
});
