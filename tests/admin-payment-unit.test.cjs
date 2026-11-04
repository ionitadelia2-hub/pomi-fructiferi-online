const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
class Element {
  constructor(){this.nodes={};this.handlers={};this.dataset={};this.isConnected=true;this.innerHTML='';this.textContent='';this.disabled=false;}
  querySelector(key){return this.nodes[key] ||= new Element();}
  querySelectorAll(){return [];}
  addEventListener(type,fn){(this.handlers[type] ||= []).push(fn);}
  setAttribute(){} before(){} after(){} append(){} remove(){}
  contains(element){return Object.values(this.nodes).includes(element);}
}
const elements={};const document={head:new Element(),body:new Element(),createElement:()=>new Element(),getElementById:id=>elements[id] ||= new Element()};
const order={id:1,total:150,order_number:'TEST-001',items:[],customer_name:'Client test',created_at:'2026-11-04T12:00:00Z'};
let payment={order_id:1,total:150,paid_total:0,paid_in_account:false,revision:0,cod_amount:150,total_changed:false};
let unavailable=false,failSave=false,confirm=true,posts=0,printed='';
const printWindow={document:{write:s=>printed=s,close(){}},focus(){},print(){},close(){}};
const context=vm.createContext({document,window:{confirm:()=>confirm,open:()=>printWindow,ADMIN_PRODUCTS:[]},URL,AbortController,Intl,Date,Number,String,Set,Boolean,JSON,console,setTimeout,clearTimeout,alert:()=>{},fetch:async(url,options={})=>{
  if(unavailable) return {ok:false,json:async()=>({success:false})};
  if(options.method==='POST') {
    posts++;const b=JSON.parse(options.body);
    if(failSave || b.expected_revision!==payment.revision) return {ok:false,json:async()=>({success:false,error:'Conflict: reîncarcă comenzile.'})};
    payment={...payment,paid_in_account:b.paid_in_account,revision:payment.revision+1,cod_amount:b.paid_in_account?0:150,paid_total:b.paid_in_account?150:0};
  }
  return {ok:true,json:async()=>({success:true,payment_api_version:1,payments:[payment]})};
}});
vm.runInContext(fs.readFileSync(require('node:path').resolve(__dirname,'../src/js/admin-orders.js'),'utf8'),context);
context.order=order;
vm.runInContext('adminToken="test-only";currentOrders=[order]',context);
function banner(){return context.paymentBanner(order);}
const section=new Element(),button=new Element(),checkbox=new Element(),message=new Element();
button.dataset.orderId='1';button.closest=()=>section;
section.nodes={'.admin-payment-checkbox':checkbox,'.admin-payment-message':message};
const paymentHandler=elements['admin-orders-list'].handlers.click[0];
const event={target:{closest:selector=>selector==='.admin-save-payment'?button:null}};
(async()=>{
  await context.loadOrderPayments([order],'test-only');
  assert.match(banner(),/150\.00 lei/);assert.equal(posts,0);
  checkbox.checked=true;assert.doesNotMatch(banner(),/RAMBURS: 0/);
  confirm=false;await paymentHandler(event);assert.equal(posts,0);
  confirm=true;await paymentHandler(event);assert.equal(posts,1);
  assert.match(section.innerHTML,/RAMBURS: 0 LEI/);assert.equal(order.total,150);
  const other={...order,payment:null};await context.loadOrderPayments([other],'test-only');assert.equal(other.payment.paid_in_account,true);
  checkbox.checked=false;context.printOrder(order,printWindow);assert.match(printed,/RAMBURS: 0 LEI/);
  button.disabled=false;await paymentHandler(event);assert.match(section.innerHTML,/150\.00 lei/);
  button.disabled=false;failSave=true;checkbox.checked=true;await paymentHandler(event);
  assert.equal(checkbox.checked,false);assert.match(message.textContent,/Conflict/);assert.doesNotMatch(banner(),/RAMBURS: 0/);
  payment={...payment,paid_in_account:true,total_changed:true,cod_amount:null};await context.loadOrderPayments([order],'test-only');assert.match(banner(),/TOTAL MODIFICAT/);assert.doesNotMatch(banner(),/RAMBURS: 0/);
  unavailable=true;await context.loadOrderPayments([order],'test-only');assert.equal(order.payment,null);
  assert.match(banner(),/PLATĂ NEVERIFICATĂ/);assert.match(context.renderPayment(order),/disabled/);
  context.printOrder(order,printWindow);assert.match(printed,/PLATĂ NEVERIFICATĂ/);assert.doesNotMatch(printed,/RAMBURS: 0/);
  console.log('PASS: UI save/cancel, shared state, immutable order total, printed banner, save failure, changed total and unavailable API');
})().catch(e=>{console.error(e);process.exitCode=1;});
