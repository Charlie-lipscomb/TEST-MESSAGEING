self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{self.clients.claim()});
self.addEventListener("push",e=>{
  const data=e.data?.json()||{};
  e.waitUntil(self.registration.showNotification(data.title||"Whisp",{body:data.body||"",icon:"https://cdn-icons-png.flaticon.com/512/906/906349.png"}));
});
