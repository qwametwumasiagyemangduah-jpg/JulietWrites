(() => {
 const node=document.getElementById("poem-data"); if(!node)return;
 let poem;try{poem=JSON.parse(node.textContent)}catch(_){return}
 const $=id=>document.getElementById(id), status=$("reader-response-status"), list=$("approved-reflections"), like=$("poem-like-button"), count=$("poem-like-count");
 async function api(method,body,url="/api/engagement"){
  const r=await fetch(url,{method,credentials:"same-origin",headers:{"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Please try again.");return d;
 }
 async function refresh(){
  try{
   const d=await api("GET",null,"/api/engagement?poemId="+encodeURIComponent(poem.id));
   if(count)count.textContent=d.likes+" "+(d.likes===1?"like":"likes");
   if(list){list.replaceChildren();if(!d.responses.length){list.textContent="No reflections yet. You could be the first to share one."}
    d.responses.forEach(item=>{const a=document.createElement("article"),p=document.createElement("p"),s=document.createElement("small");a.className="reader-reflection";p.textContent=item.reflection;s.textContent="— "+(item.displayName||"Anonymous");a.append(p,s);list.append(a)})}
  }catch(e){if(count)count.textContent="Likes unavailable";if(list)list.textContent="Reflections are temporarily unavailable."}
 }
 refresh();
 like?.addEventListener("click",async()=>{like.disabled=true;try{const d=await api("POST",{action:"like",poemId:poem.id});count.textContent=d.likes+" "+(d.likes===1?"like":"likes");like.textContent=d.liked?"♥ Liked":"♡ Like this poem";if(!d.liked)like.title="Already liked from this browser."}catch(e){count.textContent=e.message}finally{like.disabled=false}});
 $("reader-response-form")?.addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget;const b=form.querySelector("button[type=submit]");b.disabled=true;status.textContent="Sending…";try{const d=await api("POST",{poemId:poem.id,reflection:$("reader-reflection").value});status.textContent=d.message;form.reset()}catch(err){status.textContent=err.message}finally{b.disabled=false}});
})();