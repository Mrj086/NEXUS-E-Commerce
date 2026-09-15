import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {Search,ShoppingCart,Heart,User,Package,LayoutDashboard,LogOut,Bot,Mic,Image as ImageIcon,Bell,Plus,Trash2,Power,Download,Wallet,Menu,X,ChevronRight,Upload,Lock,CreditCard,CheckCircle,Truck,CircleCheck,Banknote,Smartphone,Phone,Pencil} from "lucide-react";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from "recharts";
import jsPDF from "jspdf";
import "./styles.css";

const API="http://localhost:5000/api";
const api=async(path,opts={})=>{
  const token=localStorage.getItem("nexus_token");
  const headers=opts.body instanceof FormData?{}:{"Content-Type":"application/json"};
  if(token) headers.Authorization=`Bearer ${token}`;
  const r=await fetch(API+path,{...opts,headers:{...headers,...(opts.headers||{})}});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.message||"Request failed");
  return data;
};
const money=n=>`৳${Number(n||0).toFixed(2)}`;
const payLabel=m=>m==="cod"?"Cash on Delivery":m==="mobile_banking"?"Mobile Banking":"Card";
const payStatusLabel=s=>s==="paid"?"Paid":s==="cod_pending"?"Pay on Delivery":s;

// ========== PDF INVOICE FOR ORDERS ==========
function downloadInvoice(o){
  const doc=new jsPDF();
  doc.setFontSize(22);doc.setTextColor(255,107,44);doc.text("NEXUS",14,20);
  doc.setFontSize(10);doc.setTextColor(90,90,90);doc.text("Marketplace — Payment Invoice",14,27);
  doc.setDrawColor(220);doc.line(14,32,196,32);
  doc.setTextColor(20,20,20);
  let y=44;
  const row=(label,val)=>{
    doc.setFontSize(11);doc.setFont(undefined,"bold");doc.text(label,14,y);
    doc.setFont(undefined,"normal");
    const lines=doc.splitTextToSize(String(val??"-"),110);
    doc.text(lines,70,y);
    y+=9*Math.max(1,lines.length);
  };
  row("Customer Name",o.customer_name||o.name);
  row("Phone",o.customer_phone||o.contact_phone||o.phone);
  row("Order Number","#"+o.id);
  row("Order Status",(o.status||"confirmed").toUpperCase());
  row("Payment Method",payLabel(o.payment_method)+(o.mobile_bank?" ("+o.mobile_bank+")":""));
  if(o.mobile_phone) row("Mobile Number",o.mobile_phone);
  row("Delivery Address",o.shipping_address);
  row("Transaction ID",o.transaction_id);
  row("Amount",money(o.total_amount));
  row("Date",o.created_at?new Date(o.created_at).toLocaleString():new Date().toLocaleString());
  y+=6;
  doc.setDrawColor(220);doc.line(14,y,196,y);y+=10;
  doc.setFontSize(10);doc.setTextColor(120);
  doc.text("This is a demo invoice from NEXUS AI Marketplace.",14,y);
  doc.save(`NEXUS_Invoice_${o.id}.pdf`);
}

// ========== PDF INVOICE FOR BANK TRANSFERS ==========
function downloadTransferInvoice(t, userName, userEmail){
  const doc=new jsPDF();
  doc.setFontSize(22);doc.setTextColor(255,107,44);doc.text("NEXUS",14,20);
  doc.setFontSize(10);doc.setTextColor(90,90,90);doc.text("AI Based Marketplace — Transfer Invoice",14,27);
  doc.setDrawColor(220);doc.line(14,32,196,32);
  doc.setTextColor(20,20,20);
  let y=44;
  const row=(label,val)=>{
    doc.setFontSize(11);doc.setFont(undefined,"bold");doc.text(label,14,y);
    doc.setFont(undefined,"normal");
    const lines=doc.splitTextToSize(String(val??"-"),110);
    doc.text(lines,70,y);
    y+=9*Math.max(1,lines.length);
  };
  row("Account Holder",userName||"-");
  row("Email",userEmail||"-");
  row("Bank Name",t.bank_name||"-");
  row("Account (last 4)","****"+(t.account_last4||""));
  row("Transfer Amount",money(t.amount));
  row("Transaction ID",t.transaction_id||"-");
  row("Status",(t.status||"completed").toUpperCase());
  row("Date",t.completed_at||t.created_at?new Date(t.completed_at||t.created_at).toLocaleString():new Date().toLocaleString());
  y+=6;
  doc.setDrawColor(220);doc.line(14,y,196,y);y+=10;
  doc.setFontSize(10);doc.setTextColor(120);
  doc.text("This is a demo transfer invoice from NEXUS AI Marketplace.",14,y);
  doc.save(`NEXUS_Transfer_${t.id||Date.now()}.pdf`);
}

// ========== ORDER STATUS FLOW COMPONENT ==========
function OrderStatusFlow({ status, customerApproved, onApprove, isCustomer, onShip, onDeliver, isSellerOrAdmin, orderId }){
  const steps=[
    {key:"confirmed",label:"Ordered",icon:<Package size={16}/>},
    {key:"shipped",label:"Shipped",icon:<Truck size={16}/>},
    {key:"delivered",label:"Delivered",icon:<CircleCheck size={16}/>},
  ];
  const idx=steps.findIndex(s=>s.key===status);
  return <div className="orderStatusFlow">
    {steps.map((step,i)=>{
      const isApprovedDelivery = step.key === "delivered" && customerApproved;
      const done = i < idx || isApprovedDelivery;
      const current = i === idx && !isApprovedDelivery;
      
      return <React.Fragment key={step.key}>
        <div className={`statusStep ${done?"done":""} ${current?"current":""}`}>
          <div className="statusIcon">{done?<CheckCircle size={18}/>:(current?step.icon:<Package size={16}/>)}</div>
          <span>{step.label}</span>
          
          {current&&step.key==="delivered"&&isCustomer&&!customerApproved&&(
            <button className="btn greenAction approveBtn" onClick={()=>onApprove&&onApprove(orderId)}>Confirm Delivery</button>
          )}
          {isApprovedDelivery&&(
            <span className="approvedBadge"><CheckCircle size={12}/> Approved</span>
          )}
          
          {current&&step.key==="confirmed"&&isSellerOrAdmin&&(
            <button className="btn greenAction shipBtn" onClick={()=>onShip&&onShip(orderId)}>Mark as Shipped</button>
          )}
          {current&&step.key==="shipped"&&isSellerOrAdmin&&(
            <button className="btn greenAction deliverBtn" onClick={()=>onDeliver&&onDeliver(orderId)}>Mark as Delivered</button>
          )}
        </div>
        {i<steps.length-1&&<div className={`statusLine ${done?"done":""}`}/>}
      </React.Fragment>;
    })}
  </div>;
}

// ========== NOTIFICATION BELL WITH BADGE ============
function NotificationBell({onView, count}){
  return <button className="icon" onClick={onView} title="Notifications">
    <Bell size={18}/>{count>0&&<b>{count>9?"9+":count}</b>}
  </button>;
}

// ========== MAIN APP ==========
function App(){
 const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem("nexus_user")||"null"));
 const [view,setView]=useState("home");
 const [cart,setCart]=useState(()=>JSON.parse(localStorage.getItem("nexus_cart")||"[]"));
 const [product,setProduct]=useState(null);
 const [toast,setToast]=useState("");
 const [sms,setSms]=useState(null);
 const [mobile,setMobile]=useState(false);
 const [headerQ,setHeaderQ]=useState("");
 const [searchSeed,setSearchSeed]=useState("");
 const [unreadCount,setUnreadCount]=useState(0);
 useEffect(()=>localStorage.setItem("nexus_cart",JSON.stringify(cart)),[cart]);
 useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(""),3000);return()=>clearTimeout(t)}},[toast]);
 useEffect(()=>{if(sms){const t=setTimeout(()=>setSms(null),5000);return()=>clearTimeout(t)}},[sms]);
 useEffect(()=>{
   if(!user)return;
   const poll=async()=>{try{const d=await api("/notifications/unread");setUnreadCount(d.count||0)}catch{}};
   poll();const iv=setInterval(poll,15000);return()=>clearInterval(iv);
 },[user]);
 const logout=()=>{localStorage.clear();setUser(null);setCart([]);setView("home")};
 const add=(p,qty=1)=>{setCart(c=>{const x=[...c],i=x.findIndex(a=>a.id===p.id);if(i>=0)x[i].quantity+=qty;else x.push({productId:p.id,id:p.id,name:p.name,price:p.price,quantity:qty,photos:p.photos});return x});setToast("Added to cart.")};
 const nav=v=>{setView(v);setMobile(false)};
 const headerSearch=e=>{e.preventDefault();setSearchSeed(headerQ+" "+Math.random());nav("catalog")};
 const showSms=(message,type="success")=>setSms({message,type});
 return <div className="app">
  <header className="topbar"><div className="brand" onClick={()=>nav("home")}><span>N</span>NEXUS</div>
   <nav className={mobile?"open":""}>
    <button onClick={()=>nav("catalog")}>Shop</button>{user?.role==="customer"&&<button onClick={()=>nav("customer")}>Dashboard</button>}
    {user?.role==="seller"&&<button onClick={()=>nav("seller")}>Seller Hub</button>}
    {user?.role==="admin"&&<button onClick={()=>nav("admin")}>Admin</button>}
   </nav>
   <form className="headerSearch" onSubmit={headerSearch}><Search size={15}/><input value={headerQ} onChange={e=>setHeaderQ(e.target.value)} placeholder="Search NEXUS..."/></form>
   <div className="actions">
    {user && (
      <>
        {user?.role!=="customer"&&<button className="icon" onClick={()=>nav("orders")}><Package size={18}/>{cart.length>0&&<b>{cart.length}</b>}</button>}
        {user?.role==="customer"&&<button className="icon" onClick={()=>nav("cart")}><ShoppingCart size={18}/>{cart.length>0&&<b>{cart.length}</b>}</button>}
        <NotificationBell onView={()=>nav("notifications")} count={unreadCount}/>
      </>
    )}
    {user?<AccountMenu user={user} go={nav} logout={logout}/>:<button className="btn primary" onClick={()=>nav("login")}>Sign in</button>}
    <button className="hamb" onClick={()=>setMobile(m=>!m)}><Menu size={22}/></button>
   </div>
  </header>
  {sms&&<div className={`smsOverlay ${sms.type}`}><CheckCircle size={22}/><span>{sms.message}</span></div>}
  {toast&&<div className="toast">{toast}</div>}
  <main className={view!=="home"?"viewFade":""}>
   {view==="home"&&<Home nav={nav}/>}
   {view==="login"&&<Auth onLogin={u=>{setUser(u);nav(u.role==="customer"?"customer":"seller")}}/>}
   {view==="catalog"&&<Catalog add={add} open={p=>setProduct(p)} onToast={setToast} nav={nav} seed={searchSeed}/>}
   {view==="cart"&&user&&<Cart cart={cart} setCart={setCart} nav={nav} user={user} showSms={showSms}/>}
   {view==="orders"&&user&&<AllOrders nav={nav} user={user} onToast={setToast} showSms={showSms}/>}
   {view==="notifications"&&user&&<NotificationsPage nav={nav}/>}
   {view==="customer"&&user&&<Customer nav={nav} add={add} open={p=>setProduct(p)}/>}
   {view==="seller"&&user&&<Seller onToast={setToast} showSms={showSms} user={user}/>}
   {view==="admin"&&user&&<Admin onToast={setToast} showSms={showSms} user={user}/>}
   {view==="profile"&&user&&<Profile user={user} setUser={setUser} onToast={setToast}/>}
  </main>
  {product&&<ProductModal p={product} close={()=>setProduct(null)} add={add} nav={nav}/>}
  <footer>NEXUS &copy; 2026 AI Based Marketplace.</footer>
 </div>;
}

function AccountMenu({user,go,logout}){
 const[open,setOpen]=useState(false);
 useEffect(()=>{if(!open)return;const h=()=>setOpen(false);document.addEventListener("click",h);return()=>document.removeEventListener("click",h)},[open]);
 return <div className="accountMenu" onClick={e=>e.stopPropagation()}>
  <button className="avatar" onClick={()=>setOpen(o=>!o)}>{user.name?.[0]}</button>
  {open&&<div className="dropdown">
   <div className="ddHead"><b>{user.name}</b><small>{user.email}</small></div>
   <button onClick={()=>go("profile")}><User size={15}/> My Profile</button>
   {user.role==="customer"&&<button onClick={()=>go("orders")}><Package size={15}/> My Orders</button>}
   {user.role==="customer"&&<button onClick={()=>go("customer")}><LayoutDashboard size={15}/> Dashboard</button>}
   {user.role==="seller"&&<button onClick={()=>go("seller")}><LayoutDashboard size={15}/> Seller Hub</button>}
   {user.role==="admin"&&<button onClick={()=>go("admin")}><LayoutDashboard size={15}/> Admin Console</button>}
   <button className="ddLogout" onClick={logout}><LogOut size={15}/> Logout</button>
  </div>}
 </div>;
}

// ========== HOME PAGE ==========
function Home({nav}){
 const [typed,setTyped]=useState("");
 const text="AI-powered commerce, built for your next move.";
 useEffect(()=>{let i=0;const t=setInterval(()=>{setTyped(text.slice(0,++i));if(i>=text.length)clearInterval(t)},55);return()=>clearInterval(t)},[]);
 return <section className="hero"><div className="heroGlow"/>
  <div className="heroCopy"><div className="eyebrow">NEXUS INTELLIGENT COMMERCE</div><h1>{typed}<span className="cursor">|</span></h1>
   <p>Discover products, shop faster, and let local AI turn your activity into smarter recommendations.</p>
   <div className="heroBtns"><button className="btn primary" onClick={()=>nav("catalog")}>Explore marketplace <ChevronRight/></button><button className="btn ghost" onClick={()=>nav("login")}>Join NEXUS</button></div>
   <div className="featureStrip"><span><Bot/> AI assistant</span><span><ImageIcon/> Image search</span><span><Mic/> Voice search</span></div>
  </div>
  <div className="heroPanel">
   <div className="panelTop">NEXUS SHOPPING <span>LIVE</span></div>
   <div className="heroImageWrapper">
     <img src="https://z-cdn-media.chatglm.cn/files/f4e3530b-ab59-451f-af27-c9a0c09e37b9.png?auth_key=1887210487-f84728e9434b4369b39d1c16d77a1491-0-9e7d0fd9e6138001eed7b9fd1651cb22" alt="NEXUS Shopping Bag" className="heroBagImage" />
   </div>
   <div className="miniStats">
     <div><strong>24/7</strong><small>Smart support</small></div>
   </div>
  </div>
 </section>;
}

// ========== AUTH ==========
function Auth({onLogin}){
 const [mode,setMode]=useState("login"),[role,setRole]=useState("customer"),[f,setF]=useState({}),[err,setErr]=useState(""),[busy,setBusy]=useState(false);
 const submit=async e=>{e.preventDefault();setErr("");setBusy(true);try{const d=await api(mode==="login"?"/auth/login":"/auth/register",{method:"POST",body:JSON.stringify({...f,role})});localStorage.setItem("nexus_token",d.token);localStorage.setItem("nexus_user",JSON.stringify(d.user));onLogin(d.user)}catch(e){setErr(e.message)}finally{setBusy(false)}};
 return <section className="auth"><div className="authCard"><div className="eyebrow">NEXUS ACCESS</div><h2>{mode==="login"?"Welcome back":"Create your NEXUS account"}</h2><div className="tabs"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Sign in</button><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Register</button></div>
  {mode==="register"&&<div className="roleTabs"><button className={role==="customer"?"active":""} onClick={()=>setRole("customer")}>Customer</button><button className={role==="seller"?"active":""} onClick={()=>setRole("seller")}>Seller</button></div>}
  <form onSubmit={submit}>{mode==="register"&&<input placeholder="Full name" onChange={e=>setF({...f,name:e.target.value})} required/>}<input type="email" placeholder="Email" onChange={e=>setF({...f,email:e.target.value})} required/><input type="password" placeholder="Password" onChange={e=>setF({...f,password:e.target.value})} required/>
  {mode==="register"&&<div className="grid2"><input type="number" placeholder="Age" onChange={e=>setF({...f,age:e.target.value})}/><select onChange={e=>setF({...f,gender:e.target.value})}><option value="">Gender</option><option>Female</option><option>Male</option><option>Other</option></select><input placeholder="Profession" onChange={e=>setF({...f,profession:e.target.value})}/><input placeholder="Phone number" onChange={e=>setF({...f,phone:e.target.value})}/></div>}
  {err&&<div className="error">{err}</div>}<button className="btn primary wide" disabled={busy}>{busy?"Please wait...":mode==="login"?"Sign in":"Register now"}</button></form>
  {mode==="login"&&<p className="hint">Demo — Admin: admin@nexus.local / Admin123! &middot; Seller: seller@nexus.local / Seller123! &middot; Customer: customer@nexus.local / Customer123!</p>}
 </div></section>;
}

// ========== CATALOG + IMAGE SEARCH MODAL ==========
function Catalog({add,open,onToast,nav,seed}){
 const [products,setProducts]=useState([]),[q,setQ]=useState(""),[cat,setCat]=useState(""),[cats,setCats]=useState([]),[loading,setLoading]=useState(true),[listening,setListening]=useState(false);
 const [showImageSearch,setShowImageSearch]=useState(false);
 const [imageQuery,setImageQuery]=useState("");

 const load=async(term=q)=>{setLoading(true);try{const d=await api(`/products?search=${encodeURIComponent(term)}&category=${encodeURIComponent(cat)}`);setProducts(d);if(!cats.length)setCats(await api("/categories"))}catch(e){onToast(e.message)}finally{setLoading(false)}};
 useEffect(()=>{load()},[cat]);
 useEffect(()=>{if(!seed)return;const term=seed.replace(/\s*[\d.]+$/,"").trim();setQ(term);load(term)},[seed]);

 const search=e=>{e.preventDefault();load();if(localStorage.getItem("nexus_token"))api("/activity",{method:"POST",body:JSON.stringify({action:"search",query:q})}).catch(()=>{})};
 
 const handleImageSearchComplete=(data)=>{
   setProducts(data.products||[]);
   setImageQuery(data.query||"Image Search");
   onToast(`Image search: "${data.query}" · ${data.products?.length || 0} result(s)`);
 };

 const voice=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return onToast("Voice search is not supported in this browser. Try Chrome or Edge.");
  const r=new SR();r.lang="en-US";r.interimResults=false;r.maxAlternatives=1;
  r.onstart=()=>{setListening(true);onToast("Listening...")};
  r.onresult=e=>{const transcript=e.results[0][0].transcript;setQ(transcript);load(transcript)};
  r.onerror=e=>{onToast(e.error==="not-allowed"?"Microphone access was denied.":"Voice search failed. Please try again.")};
  r.onend=()=>setListening(false);
  try{r.start()}catch{onToast("Could not start voice search.")}
 };
 return <section className="page"><div className="pageHead"><div><div className="eyebrow">MARKETPLACE</div><h2>Explore products</h2><p>Search by words, voice, or an uploaded product image.</p></div></div>
  <div className="searchBar">
    <form onSubmit={search}><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products, categories..."/><button>Search</button></form>
    <button type="button" className={listening?"toolBtn active":"toolBtn"} onClick={voice}><Mic/> {listening?"Listening...":"Voice"}</button>
    <button type="button" className="toolBtn" onClick={()=>setShowImageSearch(true)}><ImageIcon/> Image</button>
  </div>
  <div className="chips"><button className={!cat?"active":""} onClick={()=>setCat("")}>All</button>{cats.map(c=><button className={cat===c.name?"active":""} onClick={()=>setCat(c.name)} key={c.id}>{c.name}</button>)}</div>
  
  {imageQuery&&<div className="searchBanner">Showing visual results for: <b>{imageQuery}</b><button className="btn ghost" onClick={()=>{setImageQuery("");load()}}>Clear</button></div>}

  {loading?<div className="empty">Loading marketplace...</div>:!products.length?<div className="empty">No products matched your search.</div>:<div className="productGrid">{products.map(p=><ProductCard key={p.id} p={p} add={add} open={open} nav={nav}/>)}</div>}
  
  {showImageSearch&&<ImageSearchModal close={()=>setShowImageSearch(false)} onSearchComplete={handleImageSearchComplete} onToast={onToast} />}
 </section>;
}

// ========== IMAGE SEARCH MODAL COMPONENT ==========
function ImageSearchModal({close,onSearchComplete,onToast}){
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState("");
  const [loading,setLoading]=useState(false);

  const handleFile=e=>{
    const f=e.target.files?.[0];
    if(!f)return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSearch=async()=>{
    if(!file)return;
    setLoading(true);
    const fd=new FormData();
    fd.append("image",file);
    try{
      const d=await api("/products/image-search",{method:"POST",body:fd});
      onSearchComplete(d);
      close();
    }catch(err){onToast(err.message)}
    finally{setLoading(false)}
  };

  return <div className="modalBack" onClick={close}>
    <div className="modal" style={{maxWidth:"500px",gridTemplateColumns:"1fr"}} onClick={e=>e.stopPropagation()}>
      <button className="close" onClick={close}><X/></button>
      <div className="eyebrow">AI IMAGE SEARCH</div>
      <h2>Find similar products</h2>
      <p className="muted" style={{margin:"10px 0 20px"}}>Upload an image of a product, and our AI will find similar items in the marketplace.</p>
      {!preview?(
        <label className="dropZone">
          <ImageIcon size={40}/>
          <span>Click to upload an image</span>
          <input hidden type="file" accept="image/*" onChange={handleFile}/>
        </label>
      ):(
        <div className="previewBox">
          <img src={preview} alt="Upload preview"/>
          <button className="btn ghost" style={{marginTop:10}} onClick={()=>{setFile(null);setPreview("")}}>Change Image</button>
        </div>
      )}
      {preview&&<button className="btn primary wide" style={{marginTop:16}} disabled={loading} onClick={handleSearch}>{loading?"Analyzing Image...":"Search Similar Products"}</button>}
    </div>
  </div>;
}

function ProductCard({p,add,open,nav}){
 return <article className="productCard" onClick={()=>open(p)}><div className="productImg">{p.photos?.[0]?<img src={API.replace("/api","")+p.photos[0]}/>:<span>{p.name.slice(0,1)}</span>}<button className="wish" onClick={e=>{e.stopPropagation();localStorage.getItem("nexus_token")?api(`/wishlist/${p.id}`,{method:"POST"}):alert("Sign in to wishlist")}}><Heart size={18}/></button></div>
  <div className="productBody"><small>{p.category_name}</small><h3>{p.name}</h3><p>{p.description}</p><div className="price">{money(p.price)}</div><div className="stock"><span className={p.quantity?"ok":"off"}>{p.quantity?"Available":"Not available"}</span><span>{p.quantity} left</span></div>
  <div className="cardBtns"><button disabled={!p.quantity} className="btn primary" onClick={e=>{e.stopPropagation();add(p)}}>Add to cart</button><button disabled={!p.quantity} className="btn dark" onClick={e=>{e.stopPropagation();add(p);nav("cart")}}>Order now</button></div></div>
 </article>;
}

function ProductModal({p,close,add,nav}){
 return <div className="modalBack" onClick={close}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={close}><X/></button><div className="modalImg">{p.photos?.[0]?<img src={API.replace("/api","")+p.photos[0]}/>:p.name[0]}</div><div><small>{p.category_name}</small><h2>{p.name}</h2><p>{p.description}</p><div className="price big">{money(p.price)}</div><div className="stock"><span className={p.quantity?"ok":"off"}>{p.quantity?"Available":"Not available"}</span><span>Quantity: {p.quantity}</span></div><div className="heroBtns"><button className="btn primary" onClick={()=>add(p)}>Add to cart</button><button className="btn dark" onClick={()=>{add(p);close();nav("cart")}}>Order now</button></div></div></div></div>;
}

// ========== CART + NEW PAYMENT GATEWAY ==========
function Cart({cart,setCart,nav,user,showSms}){
 const total=cart.reduce((a,b)=>a+b.price*b.quantity,0);
 const [address,setAddress]=useState("Dhaka, Bangladesh");
 const [phone,setPhone]=useState(user?.phone||"");
 const [showPay,setShowPay]=useState(false);
 const [paid,setPaid]=useState(false);
 const [order,setOrder]=useState(null);
 const [err,setErr]=useState("");
 const openPay=()=>{
  if(!address.trim())return setErr("Please enter a delivery address.");
  if(!phone.trim())return setErr("Please enter a contact phone number.");
  setErr("");setShowPay(true);
 };
 const pay=async(paymentData)=>{
  const d=await api("/orders",{method:"POST",body:JSON.stringify({items:cart,shippingAddress:address,contactPhone:phone,...paymentData})});
  setOrder({id:d.orderId,transactionId:d.transactionId,total_amount:d.total,shipping_address:address,contact_phone:phone,customer_name:user?.name,created_at:new Date().toISOString(),payment_method:paymentData.paymentMethod,status:"confirmed"});
  showSms(paymentData.paymentMethod==="cod"?"Order Placed Successfully":"Payment Successful");
  setPaid(true);setShowPay(false);setCart([]);
 };
 if(!localStorage.getItem("nexus_token"))return <section className="empty"><h2>Sign in to checkout</h2><button className="btn primary" onClick={()=>nav("login")}>Sign in</button></section>;
 if(paid)return <OrderSuccess order={order} nav={nav}/>;
 return <section className="page narrow"><div className="eyebrow">CHECKOUT</div><h2>Your cart</h2>{!cart.length?<div className="empty">Your cart is empty.</div>:<><div className="cartList">{cart.map(i=><div className="cartRow" key={i.id}><div className="cartIcon">{i.name[0]}</div><div className="grow"><b>{i.name}</b><small>{money(i.price)} each</small></div><input type="number" min="1" value={i.quantity} onChange={e=>setCart(c=>c.map(x=>x.id===i.id?{...x,quantity:Number(e.target.value)}:x))}/><b>{money(i.price*i.quantity)}</b><button className="icon" onClick={()=>setCart(c=>c.filter(x=>x.id!==i.id))}><Trash2/></button></div>)}</div><div className="checkout"><label>Delivery address<textarea value={address} onChange={e=>setAddress(e.target.value)}/></label><label>Contact phone number<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 01xxxxxxxxx"/></label>{err&&<div className="error">{err}</div>}<div className="total"><span>Total</span><strong>{money(total)}</strong></div><button className="btn primary wide" onClick={openPay}><CreditCard size={16}/> Pay now</button></div></>}
  {showPay&&<PaymentGateway amount={total} close={()=>setShowPay(false)} onPay={pay} showSms={showSms}/>}
 </section>;
}

// ========== NEW PAYMENT GATEWAY WITH COD, CARD, MOBILE BANKING ==========
function PaymentGateway({amount,close,onPay,showSms}){
 const [method,setMethod]=useState("");
 const [mobileBank,setMobileBank]=useState("");
 const [mobilePhone,setMobilePhone]=useState("");
 const [otp,setOtp]=useState("");
 const [otpSent,setOtpSent]=useState(false);
 const [otpVerified,setOtpVerified]=useState(false);
 const [busy,setBusy]=useState(false);
 const [err,setErr]=useState("");

 const [card,setCard]=useState({cardName:"",cardNumber:"",expiry:"",cvv:""});
 const fmtCard=v=>v.replace(/\D/g,"").slice(0,19).replace(/(.{4})/g,"$1 ").trim();
 const fmtExp=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?`${d.slice(0,2)}/${d.slice(2)}`:d};

 const phoneValid=/^01\d{9}$/.test(mobilePhone);

 const handleSendOtp=()=>{
  if(!phoneValid){setErr("Enter a valid 11-digit number starting with 01.");return;}
  setErr("");
  setOtpSent(true);
  setOtpVerified(false);
  setOtp("");
 };

 const handleVerifyOtp=async()=>{
  if(otp.length!==4||!/^\d{4}$/.test(otp)){setErr("Enter a valid 4-digit OTP.");return;}
  setBusy(true);setErr("");
  try{
   const d=await api("/payment/verify-otp",{method:"POST",body:JSON.stringify({otp})});
   if(d.ok){setOtpVerified(true);}else{setErr(d.message);}
  }catch(e){setErr(e.message)}
  finally{setBusy(false)}
 };

 const handlePay=async()=>{
  setBusy(true);setErr("");
  try{
   if(method==="cod"){
    await onPay({paymentMethod:"cod"});
    close();
   }else if(method==="card"){
    const digits=card.cardNumber.replace(/\s+/g,"");
    if(digits.length<12){setErr("Enter a valid card number.");setBusy(false);return;}
    if(!/^\d{2}\/\d{2}$/.test(card.expiry)){setErr("Enter expiry as MM/YY.");setBusy(false);return;}
    if(!/^\d{3,4}$/.test(card.cvv)){setErr("Enter a valid CVV.");setBusy(false);return;}
    await onPay({paymentMethod:"Card",card:{...card,cardNumber:digits}});
    close();
   }else if(method==="mobile"){
    if(!otpVerified){setErr("Please verify OTP first.");setBusy(false);return;}
    await onPay({paymentMethod:"mobile_banking",mobileBank,mobilePhone});
    close();
   }
  }catch(e){setErr(e.message)}
  finally{setBusy(false)}
 };

 return (
  <div className="modalBack" onClick={close}>
   <div className="payModal" onClick={e=>e.stopPropagation()}>
    <button className="close" onClick={close}><X/></button>
    <div className="eyebrow">SECURE PAYMENT GATEWAY</div>
    <h2>Pay {money(amount)}</h2>
    {!method?<>
     <p className="muted" style={{margin:"16px 0"}}>Select your payment method</p>
     <div className="payMethods">
      <button className="payMethodCard" onClick={()=>setMethod("cod")}><Banknote size={28}/><b>Cash on Delivery</b><small>Pay when you receive</small></button>
      <button className="payMethodCard" onClick={()=>setMethod("card")}><CreditCard size={28}/><b>Card Payment</b><small>Credit / Debit card</small></button>
      <button className="payMethodCard" onClick={()=>setMethod("mobile")}><Smartphone size={28}/><b>Mobile Banking</b><small>bKash / Nagad / UPay</small></button>
     </div>
    </>:<>
     <button className="btn ghost" style={{marginBottom:14}} onClick={()=>{setMethod("");setErr("");setOtpSent(false);setOtpVerified(false)}}>&larr; Back to methods</button>

     {method==="cod"&&<div className="payForm">
      <div className="codInfo"><Banknote size={20}/><span>Pay with cash when your order is delivered to your doorstep.</span></div>
      {err&&<div className="error">{err}</div>}
      <button className="btn primary wide" disabled={busy} onClick={handlePay}><Banknote size={15}/> {busy?"Processing...":"Confirm Order (COD)"}</button>
     </div>}

     {method==="card"&&<form className="payForm" onSubmit={e=>{e.preventDefault();handlePay()}}>
      <input placeholder="Name on card" value={card.cardName} onChange={e=>setCard({...card,cardName:e.target.value})} required/>
      <input placeholder="Card number" value={card.cardNumber} onChange={e=>setCard({...card,cardNumber:fmtCard(e.target.value)})} required/>
      <div className="grid2"><input placeholder="MM/YY" value={card.expiry} onChange={e=>setCard({...card,expiry:fmtExp(e.target.value)})} required/><input placeholder="CVV" value={card.cvv} onChange={e=>setCard({...card,cvv:e.target.value.replace(/\D/g,"").slice(0,4)})} required/></div>
      {err&&<div className="error">{err}</div>}
      <button className="btn primary wide" disabled={busy}><Lock size={15}/> {busy?"Processing payment...":`Pay ${money(amount)}`}</button>
     </form>}

     {method==="mobile"&&<div className="payForm">
      <div className="mobileBanks">
       {['bKash','Nagad','UPay'].map(b=>(
        <button key={b} type="button" className={`mobileBankBtn ${mobileBank===b?"active":""}`} onClick={()=>setMobileBank(b)}>
         <Phone size={16}/>{b}
        </button>
       ))}
      </div>
      {!otpSent?(
       <><input placeholder="Enter mobile number (01XXXXXXXXX)" value={mobilePhone} onChange={e=>setMobilePhone(e.target.value.replace(/\D/g,"").slice(0,11))} maxLength={11}/>
        {!phoneValid&&mobilePhone.length>0&&<small className="muted" style={{fontSize:11}}><Phone size={11}/> Number must be 11 digits starting with 01</small>}
        {err&&<div className="error">{err}</div>}
        <button className="btn primary wide" disabled={!phoneValid} onClick={handleSendOtp}><Smartphone size={15}/> Send OTP</button></>
      ):otpVerified?(
       <><div className="otpSuccess"><CheckCircle size={20}/><span>OTP Verified - Ready to pay</span></div>
        <div className="mobilePaySummary"><b>Pay via {mobileBank}</b><span>Number: {mobilePhone}</span><strong>{money(amount)}</strong></div>
        <button className="btn primary wide" onClick={handlePay} disabled={busy}><Smartphone size={15}/> {busy?"Processing...":"Pay Now"}</button>
       </>
      ):(
       <><div className="otpSection"><Phone size={16}/><span>OTP sent to {mobilePhone}</span></div>
        <input placeholder="Enter 4-digit OTP" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4}/>
        {err&&<div className="error">{err}</div>}
        <button className="btn primary wide" disabled={otp.length!==4||busy} onClick={handleVerifyOtp}>{busy?"Verifying...":"Verify & Submit"}</button>
        <button className="btn ghost" style={{marginTop:8}} onClick={()=>{setOtpSent(false);setOtpVerified(false);setOtp("");setErr("")}}>Resend OTP / Change Number</button>
       </>
      )}
     </div>}
    </>}
   </div>
  </div>
 );
}

// ========== ORDER SUCCESS ==========
function OrderSuccess({order,nav}){
 return <section className="success"><div className="successIcon">✓</div><div className="eyebrow">ORDER CONFIRMED</div><h2>{order.payment_method==="cod"?"Order Placed":"Payment Successful"}</h2><p>Your order <b>#{order.id}</b> has been confirmed. Transaction ID: <b>{order.transactionId||order.transaction_id}</b></p><div className="heroBtns"><button className="btn primary" onClick={()=>nav("orders")}>View my orders</button><button className="btn ghost" onClick={()=>downloadInvoice(order)}><Download/> Download invoice</button></div></section>;
}

// ========== ALL ORDERS ==========
function AllOrders({nav,user,onToast,showSms}){
 const [orders,setOrders]=useState(null);
 const load=async()=>{try{setOrders(await api("/orders"))}catch{setOrders([])}};
 useEffect(()=>{load()},[]);

 const handleShip=async(id)=>{
  try{await api(`/orders/${id}/ship`,{method:"PUT"});showSms("Order #"+id+" marked as Shipped");load()}
  catch(e){onToast(e.message)}
 };
 const handleDeliver=async(id)=>{
  try{await api(`/orders/${id}/deliver`,{method:"PUT"});showSms("Order #"+id+" marked as Delivered");load()}
  catch(e){onToast(e.message)}
 };
 const handleApprove=async(id)=>{
  try{
    await api(`/orders/${id}/approve`,{method:"PUT"});
    showSms("Order #"+id+" Delivery Confirmed");
    setOrders(prev => prev ? prev.map(o => o.id === id ? {...o, customer_approved: 1, status: 'delivered'} : o) : prev);
    load(); 
  } catch(e){onToast(e.message)}
 };

 const isSellerOrAdmin=user?.role==="seller"||user?.role==="admin";

 return <section className="page narrow"><div className="pageHead"><div><div className="eyebrow">ORDERS</div><h2>{user?.role==="customer"?"My Orders":"All Orders"}</h2></div></div>
  {orders===null?<div className="empty">Loading orders...</div>:!orders.length?<div className="empty">No orders found.<div className="heroBtns" style={{justifyContent:"center",marginTop:16}}><button className="btn primary" onClick={()=>nav("catalog")}>Browse products</button></div></div>:
  <div className="ordersList">{orders.map(o=>(
   <div className="orderCard" key={o.id}>
    <div className="orderCardBody">
     <div className="orderInfo"><b>Order #{o.id}</b><small>{new Date(o.created_at).toLocaleString()}</small><small className={`orderStatusBadge status-${o.status}`}>{o.status?.toUpperCase()}</small><small>Payment: {payLabel(o.payment_method)} · {payStatusLabel(o.payment_status)}</small><small>{o.shipping_address}</small></div>
     <OrderStatusFlow status={o.status} customerApproved={o.customer_approved} onApprove={handleApprove} isCustomer={user?.role==="customer"} onShip={handleShip} onDeliver={handleDeliver} isSellerOrAdmin={isSellerOrAdmin} orderId={o.id}/>
    </div>
    <div className="orderActions"><strong>{money(o.total_amount)}</strong><button className="btn ghost" onClick={()=>downloadInvoice(o)}><Download size={14}/> Invoice</button></div>
   </div>
  ))}</div>}
 </section>;
}

// ========== CUSTOMER DASHBOARD ==========
function Customer({nav,add,open}){
 const [dash,setDash]=useState(null),[rec,setRec]=useState({products:[]}),[chat,setChat]=useState([{bot:"Hi! Ask me about products, stock, your orders, payments, or return policy."}]),[msg,setMsg]=useState(""),[sending,setSending]=useState(false);
 useEffect(()=>{Promise.all([api("/dashboard"),api("/recommendations")]).then(([d,r])=>{setDash(d);setRec(r)}).catch(console.error)},[]);
 const send=async()=>{if(!msg||sending)return;const m=msg;setMsg("");setChat(c=>[...c,{me:m}]);setSending(true);try{const d=await api("/ai/chat",{method:"POST",body:JSON.stringify({message:m})});setChat(c=>[...c,{bot:d.answer}])}catch(e){setChat(c=>[...c,{bot:"Sorry, I couldn't process that right now."}])}finally{setSending(false)}};
 return <section className="page"><div className="pageHead"><div><div className="eyebrow">CUSTOMER INTELLIGENCE</div><h2>Welcome back</h2><p>Your recommendations adapt to profile and activity.</p></div><div className="heroBtns"><button className="btn outline" onClick={()=>nav("orders")}><Package/> My Orders</button><button className="btn outline" onClick={()=>nav("profile")}><User/> Profile</button></div></div>
  <div className="statGrid"><Stat icon={<Package/>} label="Orders" value={dash?.orders??"—"}/><Stat icon={<Heart/>} label="Wishlist" value={dash?.wishlist??"—"}/><Stat icon={<Bot/>} label="AI mode" value="Personalized"/></div>
  <div className="sectionTitle"><h3>Recommended for you</h3><span>Age · profession · gender · history</span></div><div className="productGrid">{rec.products.map(p=><ProductCard p={p} key={p.id} add={add} open={open} nav={nav}/>)}</div>
  
  {/* Removed the "Recent orders" panel and made the Chatbot full width */}
  <div className="panel chatbot" style={{marginTop:25}}>
    <h3><Bot/> NEXUS AI Assistant</h3>
    <div className="chat">{chat.map((x,i)=><div key={i} className={x.me?"me":"bot"}>{x.me||x.bot}</div>)}{sending&&<div className="bot">Typing...</div>}</div>
    <div className="chatInput"><input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about products or orders..."/><button onClick={send}>Send</button></div>
  </div>
 </section>;
}
function Stat({icon,label,value,style}){return <div className="stat" style={style}><div>{icon}</div><small>{label}</small><strong>{value}</strong></div>}

// ========== PROFILE ==========
function Profile({user,setUser,onToast}){
 const [f,setF]=useState(user||{});
 const [pw,setPw]=useState({currentPassword:"",newPassword:"",confirm:""});
 const [pwErr,setPwErr]=useState("");
 useEffect(()=>{api("/me").then(d=>setF(f0=>({...f0,...d}))).catch(()=>{})},[]);
 const save=async()=>{try{await api("/me",{method:"PUT",body:JSON.stringify(f)});localStorage.setItem("nexus_user",JSON.stringify({...user,...f}));setUser({...user,...f});onToast("Profile updated.")}catch(e){onToast(e.message)}};
 const changePassword=async()=>{
  setPwErr("");
  if(!pw.newPassword||pw.newPassword.length<6)return setPwErr("New password must be at least 6 characters.");
  if(pw.newPassword!==pw.confirm)return setPwErr("New passwords do not match.");
  try{await api("/me/password",{method:"PUT",body:JSON.stringify(pw)});setPw({currentPassword:"",newPassword:"",confirm:""});onToast("Password updated.")}catch(e){setPwErr(e.message)}
 };
 return <section className="page narrow"><div className="eyebrow">PROFILE</div><h2>Your account</h2>
  <div className="formPanel"><input value={f.name||""} placeholder="Full name" onChange={e=>setF({...f,name:e.target.value})}/><input value={f.age||""} type="number" placeholder="Age" onChange={e=>setF({...f,age:e.target.value})}/><select value={f.gender||""} onChange={e=>setF({...f,gender:e.target.value})}><option value="">Gender</option><option>Female</option><option>Male</option><option>Other</option></select><input value={f.profession||""} placeholder="Profession" onChange={e=>setF({...f,profession:e.target.value})}/><input value={f.phone||""} placeholder="Phone number" onChange={e=>setF({...f,phone:e.target.value})}/><button className="btn primary" onClick={save}>Save profile</button></div>
  <div className="panel"><h3><Lock size={16}/> Change password</h3><div className="formGrid"><input type="password" placeholder="Current password" value={pw.currentPassword} onChange={e=>setPw({...pw,currentPassword:e.target.value})}/><input type="password" placeholder="New password" value={pw.newPassword} onChange={e=>setPw({...pw,newPassword:e.target.value})}/></div><input type="password" placeholder="Confirm new password" value={pw.confirm} onChange={e=>setPw({...pw,confirm:e.target.value})}/>{pwErr&&<div className="error">{pwErr}</div>}<button className="btn primary" style={{marginTop:10}} onClick={changePassword}>Update password</button></div>
 </section>;
}

// ========== EDIT PRODUCT MODAL (Popup Window) ==========
function EditProductModal({product, close, onSave, onToast, cats}){
  const [form, setForm] = useState(product);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(product.photos?.[0] ? API.replace("/api","")+product.photos[0] : "");

  const handleFile = e => {
    const f = e.target.files?.[0];
    if(!f) return;
    setPhotoFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submitUpdate = async () => {
    try {
      const fd = new FormData();
      fd.append("name", form.name || "");
      fd.append("description", form.description || "");
      fd.append("price", form.price || 0);
      fd.append("quantity", form.quantity || 0);
      fd.append("categoryId", form.categoryId || form.category_id || "");
      
      const isActive = form.active === true || form.active === 1 || form.active === "1" || form.active === "true";
      fd.append("active", isActive ? "true" : "false");

      if(photoFile) {
        fd.append("photo", photoFile);
      }

      await api(`/seller/products/${form.id}`, { method: "PUT", body: fd });
      onSave();
      close();
    } catch(e) {
      onToast(e.message);
    }
  };

  return (
    <div className="modalBack" onClick={close}>
      <div className="modal" style={{maxWidth: "600px", gridTemplateColumns: "1fr"}} onClick={e=>e.stopPropagation()}>
        <button className="close" onClick={close}><X/></button>
        <div className="eyebrow">EDIT PRODUCT</div>
        <h2>Update Product Details</h2>
        
        <div className="formGrid" style={{marginTop: 20}}>
          <input placeholder="Product name" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/>
          <select value={form.categoryId||form.category_id||""} onChange={e=>setForm({...form,categoryId:e.target.value})}>
            <option value="">Category</option>
            {cats.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}
          </select>
          <input type="number" step=".01" placeholder="Price" value={form.price||""} onChange={e=>setForm({...form,price:e.target.value})}/>
          <input type="number" placeholder="Quantity" value={form.quantity??""} onChange={e=>setForm({...form,quantity:e.target.value})}/>
        </div>
        
        <textarea placeholder="Description" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} style={{marginTop: 10}}/>

        <div style={{marginTop: 16, marginBottom: 16}}>
          <label className="fileUploadLabel" style={{marginBottom: 10}}>
            <Upload size={15}/> {photoFile?photoFile.name:"Change Product Image"}
            <input hidden type="file" accept="image/*" onChange={handleFile}/>
          </label>
          {preview && (
            <div className="previewBox" style={{marginTop: 10}}>
              <img src={preview} alt="Product preview" style={{maxHeight: 150}}/>
            </div>
          )}
        </div>

        <button className="btn primary wide" onClick={submitUpdate}>
          <CheckCircle size={16}/> Update Product
        </button>
      </div>
    </div>
  );
}

// ========== SELLER HUB ==========
function Seller({onToast,showSms,user}){
 const [dash,setDash]=useState({}),[products,setProducts]=useState([]),[form,setForm]=useState({}),[editing,setEditing]=useState(null),[cats,setCats]=useState([]);
 const [tab,setTab]=useState("inventory");
 const [bankName,setBankName]=useState("");
 const [bankAcct,setBankAcct]=useState("");
 const [transferAmt,setTransferAmt]=useState("");
 const [transferSms,setTransferSms]=useState(null);
 const [lastTransfer,setLastTransfer]=useState(null);
 const [orders,setOrders]=useState([]);
 const [photoFile,setPhotoFile]=useState(null);

 const load=async()=>{const [d,p,c,o]=await Promise.all([api("/dashboard"),api("/seller/products"),api("/categories"),api("/orders")]);setDash(d);setProducts(p);setCats(c);setOrders(o)};
 useEffect(()=>{load()},[]);

 const save=async()=>{
   try{
     if(photoFile){
       const fd=new FormData();
       Object.keys(form).forEach(key=>fd.append(key,form[key]));
       fd.append("photo",photoFile);
       await api("/seller/products",{method:"POST",body:fd});
     } else {
       await api("/seller/products",{method:"POST",body:JSON.stringify(form)});
     }
     setForm({});setPhotoFile(null);load();onToast("Product added successfully.");
   }catch(e){onToast(e.message)}
 };

 const handleTransfer=async()=>{
  if(!bankName.trim()){onToast("Enter bank name.");return;}
  if(!bankAcct.trim()){onToast("Enter account number.");return;}
  if(!transferAmt||Number(transferAmt)<=0){onToast("Enter a valid amount.");return;}
  try{
   const d=await api("/transfers",{method:"POST",body:JSON.stringify({bankName,account:bankAcct,amount:Number(transferAmt)})});
   setLastTransfer(d.transfer);
   setTransferSms({message:"Transfer Completed",transfer:d.transfer});
   setBankName("");setBankAcct("");setTransferAmt("");
   load();
  }catch(e){onToast(e.message)}
 };

 const handleShip=async(id)=>{try{await api(`/orders/${id}/ship`,{method:"PUT"});showSms("Order #"+id+" marked as Shipped");load()}catch(e){onToast(e.message)}};
 const handleDeliver=async(id)=>{try{await api(`/orders/${id}/deliver`,{method:"PUT"});showSms("Order #"+id+" marked as Delivered");load()}catch(e){onToast(e.message)}};

 return <section className="page"><div className="pageHead"><div><div className="eyebrow">SELLER CONTROL</div><h2>Seller Hub</h2><p>Manage inventory, orders and revenue. Seller receives 80% per paid order.</p></div></div>
  <div className="statGrid">
   <Stat icon={<Wallet/>} label="Seller revenue" value={money(dash.revenue)}/>
   <Stat icon={<Package/>} label="Paid orders" value={dash.orders??0}/>
   <Stat icon={<LayoutDashboard/>} label="Products" value={dash.products??0}/>
   <Stat icon={<Download/>} label="Withdrawn" value={money(dash.withdrawn||0)} style={{borderColor:"var(--green)"}}/>
  </div>

  <div className="tabs adminTabs" style={{marginTop:0}}>
   <button className={tab==="inventory"?"active":""} onClick={()=>setTab("inventory")}>Inventory</button>
   <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>Orders</button>
   <button className={tab==="transfer"?"active":""} onClick={()=>setTab("transfer")}>Bank Transfer</button>
  </div>

  {tab==="inventory"&&<div className="twoCol">
    <div className="panel">
      <h3>Add New Product</h3>
      <div className="formGrid">
        <input placeholder="Product name" value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})}/>
        <select value={form.categoryId||""} onChange={e=>setForm({...form,categoryId:e.target.value})}>
          <option value="">Category</option>
          {cats.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}
        </select>
        <input type="number" step=".01" placeholder="Price" value={form.price||""} onChange={e=>setForm({...form,price:e.target.value})}/>
        <input type="number" placeholder="Quantity" value={form.quantity??""} onChange={e=>setForm({...form,quantity:e.target.value})}/>
      </div>
      <textarea placeholder="Description" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})}/>
      <label className="fileUploadLabel">
        <Upload size={15}/> {photoFile?photoFile.name:"Upload Product Image"}
        <input hidden type="file" accept="image/*" onChange={e=>setPhotoFile(e.target.files?.[0])}/>
      </label>
      <button className="btn primary" onClick={save}><Plus/> Add product</button>
    </div>
    
    <div className="panel">
      <h3>Inventory</h3>
      {!products.length&&<p className="muted">No products yet — add your first one.</p>}
      {products.map(p=>
        <div className="manageRow" key={p.id}>
          <div>
            <b>{p.name}</b>
            <small>{p.quantity?"Available":"Not available"} · {p.quantity} units · {p.active?"Active":"Inactive"}</small>
          </div>
          <span>{money(p.price)}</span>
          <button className="icon" title="Edit Product" onClick={()=>setEditing(p)}><Pencil size={17}/></button>
          <button className="icon" title={p.active?"Deactivate":"Activate"} onClick={async()=>{
             try {
               await api(`/seller/products/${p.id}`, {
                 method: "PUT",
                 body: JSON.stringify({
                   name: p.name,
                   description: p.description,
                   price: p.price,
                   quantity: p.quantity,
                   categoryId: p.category_id,
                   active: !p.active
                 })
               });
               load();
               onToast("Product status updated.");
             } catch(e) { onToast(e.message); }
          }}>
            <Power/>
          </button>
          <button className="icon" title="Delete" onClick={async()=>{if(confirm("Delete product?")){await api(`/seller/products/${p.id}`,{method:"DELETE"});load()}}}><Trash2/></button>
        </div>
      )}
    </div>
  </div>}

  {tab==="orders"&&<div className="panel"><h3>Orders</h3>{!orders.length&&<p className="muted">No orders yet.</p>}{orders.map(o=>(
   <div className="orderCard" key={o.id}>
    <div className="orderCardBody">
     <div className="orderInfo"><b>Order #{o.id}</b><small>{new Date(o.created_at).toLocaleString()}</small><small className={`orderStatusBadge status-${o.status}`}>{o.status?.toUpperCase()}</small><small>Customer: {o.customer_name} · {money(o.total_amount)}</small></div>
     <OrderStatusFlow status={o.status} customerApproved={o.customer_approved} onApprove={()=>{}} isCustomer={false} onShip={handleShip} onDeliver={handleDeliver} isSellerOrAdmin={true} orderId={o.id}/>
    </div>
    <div className="orderActions"><button className="btn ghost" onClick={()=>downloadInvoice(o)}><Download size={14}/> Invoice</button></div>
   </div>
  ))}</div>}

  {tab==="transfer"&&<div className="panel"><h3><Wallet/> Bank Transfer</h3>
   <div className="withdrawnSection"><div><small>Total Withdrawn</small><strong>{money(dash.withdrawn||0)}</strong></div><div><small>Available Revenue</small><strong>{money((dash.revenue||0)-(dash.withdrawn||0))}</strong></div></div>
   <div className="formGrid" style={{marginTop:14}}><input placeholder="Bank name" value={bankName} onChange={e=>setBankName(e.target.value)}/><input placeholder="Account number" value={bankAcct} onChange={e=>setBankAcct(e.target.value)}/></div>
   <input type="number" step=".01" placeholder="Amount to withdraw" value={transferAmt} onChange={e=>setTransferAmt(e.target.value)} style={{marginTop:10}}/>
   <button className="btn primary wide" style={{marginTop:12}} onClick={handleTransfer}><Wallet size={15}/> Transfer Now</button>
   {transferSms&&<div className="transferSms"><CheckCircle size={22}/><div><b>Transfer Completed</b><span>{money(transferSms.transfer.amount)} to {transferSms.transfer.bank_name} (****{transferSms.transfer.account_last4})</span><span>TXN: {transferSms.transfer.transaction_id}</span></div><button className="btn ghost" style={{marginTop:10,flexShrink:0}} onClick={()=>downloadTransferInvoice(transferSms.transfer,user?.name,user?.email)}><Download size={14}/> Download Invoice</button></div>}
  </div>}

  {editing && (
    <EditProductModal 
      product={editing} 
      close={()=>setEditing(null)} 
      onSave={()=>{load(); onToast("Product updated successfully.");}} 
      onToast={onToast} 
      cats={cats}
    />
  )}
 </section>;
}

// ========== ADMIN CONSOLE ==========
function Admin({onToast,showSms,user}){
 const [d,setD]=useState({}),[users,setUsers]=useState([]),[products,setProducts]=useState([]),[tab,setTab]=useState("users");
 const [bankName,setBankName]=useState("");
 const [bankAcct,setBankAcct]=useState("");
 const [transferAmt,setTransferAmt]=useState("");
 const [transferSms,setTransferSms]=useState(null);
 const [orders,setOrders]=useState([]);

 const load=async()=>{const [a,u,p,o]=await Promise.all([api("/admin/analytics"),api("/admin/users"),api("/admin/products"),api("/orders")]);setD(a);setUsers(u);setProducts(p);setOrders(o)};
 useEffect(()=>{load()},[]);

 const handleTransfer=async()=>{
  if(!bankName.trim()){onToast("Enter bank name.");return;}
  if(!bankAcct.trim()){onToast("Enter account number.");return;}
  if(!transferAmt||Number(transferAmt)<=0){onToast("Enter a valid amount.");return;}
  try{
   const d=await api("/transfers",{method:"POST",body:JSON.stringify({bankName,account:bankAcct,amount:Number(transferAmt)})});
   setTransferSms({message:"Platform Transfer Completed",transfer:d.transfer});
   setBankName("");setBankAcct("");setTransferAmt("");
   load();
  }catch(e){onToast(e.message)}
 };

 const handleShip=async(id)=>{try{await api(`/orders/${id}/ship`,{method:"PUT"});showSms("Order #"+id+" marked as Shipped");load()}catch(e){onToast(e.message)}};
 const handleDeliver=async(id)=>{try{await api(`/orders/${id}/deliver`,{method:"PUT"});showSms("Order #"+id+" marked as Delivered");load()}catch(e){onToast(e.message)}};

 return <section className="page"><div className="pageHead"><div><div className="eyebrow">PLATFORM COMMAND</div><h2>Admin Console</h2><p>Full visibility across users, sellers, products and revenue.</p></div></div>
  <div className="statGrid">
   <Stat label="Gross revenue" value={money(d.summary?.gross)}/>
   <Stat label="Platform 20%" value={money(d.summary?.platform_revenue)}/>
   <Stat label="Seller 80%" value={money(d.summary?.seller_revenue)}/>
   <Stat icon={<Download/>} label="Total Withdrawn" value={money(d.summary?.withdrawn||0)} style={{borderColor:"var(--green)"}}/>
  </div>
  <div className="panel chart"><h3>Seller revenue distribution</h3>{d.sellers?.length?<ResponsiveContainer width="100%" height={260}><BarChart data={d.sellers||[]}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="revenue" fill="#ff6b2c"/></BarChart></ResponsiveContainer>:<p className="muted">No seller revenue yet.</p>}</div>
  <div className="tabs adminTabs">
   <button className={tab==="users"?"active":""} onClick={()=>setTab("users")}>Users</button>
   <button className={tab==="products"?"active":""} onClick={()=>setTab("products")}>Products</button>
   <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>Orders</button>
   <button className={tab==="transfer"?"active":""} onClick={()=>setTab("transfer")}>Bank Transfer</button>
  </div>
  {tab==="users"&&( <div className="panel">{users.length?users.map(u=><div className="manageRow" key={u.id}><div><b>{u.name}</b><small>{u.email} · {u.role} · {u.active?"Active":"Suspended"}</small></div><span>{u.profession||"—"}</span><button className="icon" title={u.active?"Suspend":"Activate"} onClick={async()=>{await api(`/admin/users/${u.id}`,{method:"PUT",body:JSON.stringify({active:!u.active})});load()}}><Power/></button></div>):<p className="muted">No users yet.</p>}</div>)}
  {tab==="products"&&( <div className="panel">{products.length?products.map(p=><div className="manageRow" key={p.id}><div><b>{p.name}</b><small>{p.seller_name} · {p.category_name} · {p.quantity} units</small></div><span>{money(p.price)}</span><button className="icon" title={p.active?"Deactivate":"Activate"} onClick={async()=>{await api(`/admin/products/${p.id}`,{method:"PUT",body:JSON.stringify({active:!p.active})});load()}}><Power/></button></div>):<p className="muted">No products yet.</p>}</div>)}
  {tab==="orders"&&<div className="panel"><h3>All Orders</h3>{!orders.length&&<p className="muted">No orders yet.</p>}{orders.map(o=>(
   <div className="orderCard" key={o.id}>
    <div className="orderCardBody">
     <div className="orderInfo"><b>Order #{o.id}</b><small>{new Date(o.created_at).toLocaleString()}</small><small className={`orderStatusBadge status-${o.status}`}>{o.status?.toUpperCase()}</small><small>Customer: {o.customer_name} · {payLabel(o.payment_method)} · {money(o.total_amount)}</small></div>
     <OrderStatusFlow status={o.status} customerApproved={o.customer_approved} onApprove={()=>{}} isCustomer={false} onShip={handleShip} onDeliver={handleDeliver} isSellerOrAdmin={true} orderId={o.id}/>
    </div>
    <div className="orderActions"><button className="btn ghost" onClick={()=>downloadInvoice(o)}><Download size={14}/> Invoice</button></div>
   </div>
  ))}</div>}
  {tab==="transfer"&&<div className="panel"><h3><Wallet/> Platform Bank Transfer</h3>
   <div className="withdrawnSection"><div><small>Total Withdrawn</small><strong>{money(d.summary?.withdrawn||0)}</strong></div><div><small>Platform Revenue</small><strong>{money(d.summary?.platform_revenue||0)}</strong></div></div>
   <div className="formGrid" style={{marginTop:14}}><input placeholder="Bank name" value={bankName} onChange={e=>setBankName(e.target.value)}/><input placeholder="Account number" value={bankAcct} onChange={e=>setBankAcct(e.target.value)}/></div>
   <input type="number" step=".01" placeholder="Amount to withdraw" value={transferAmt} onChange={e=>setTransferAmt(e.target.value)} style={{marginTop:10}}/>
   <button className="btn primary wide" style={{marginTop:12}} onClick={handleTransfer}><Wallet size={15}/> Transfer Now</button>
   {transferSms&&<div className="transferSms"><CheckCircle size={22}/><div><b>Transfer Completed</b><span>{money(transferSms.transfer.amount)} to {transferSms.transfer.bank_name} (****{transferSms.transfer.account_last4})</span><span>TXN: {transferSms.transfer.transaction_id}</span></div><button className="btn ghost" style={{marginTop:10,flexShrink:0}} onClick={()=>downloadTransferInvoice(transferSms.transfer,user?.name,user?.email)}><Download size={14}/> Download Invoice</button></div>}
  </div>}
 </section>;
}

// ========== NOTIFICATIONS PAGE ==========
function NotificationsPage({nav}){
 const [n,setN]=useState(null);
 useEffect(()=>{api("/notifications").then(setN).catch(()=>setN([]))},[]);
 const markRead=async(id)=>{try{await api(`/notifications/${id}/read`,{method:"PUT"});setN(ns=>ns.map(x=>x.id===id?{...x,is_read:1}:x))}catch{}};
 return <section className="page narrow"><div className="pageHead"><div><div className="eyebrow">NOTIFICATIONS</div><h2>Activity center</h2></div></div>
 <div className="panel">{n===null?<p className="muted">Loading...</p>:n.map(x=><div className={`line ${x.is_read?"":"unread"}`} key={x.id} onClick={()=>!x.is_read&&markRead(x.id)} style={{cursor:x.is_read?"default":"pointer"}}><div><b>{x.title}</b><small>{x.message}</small></div><span>{new Date(x.created_at).toLocaleString()}</span></div>)}{n&&!n.length&&<p className="muted">No notifications.</p>}</div></section>;
}

createRoot(document.getElementById("root")).render(<BrowserRouter><App/></BrowserRouter>);