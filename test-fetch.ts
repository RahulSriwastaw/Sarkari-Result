async function test() {
  const url = 'https://www.sarkariresult.com/railway/rrb-technician-cen-02-2026/';
  
  const proxies = [
    `https://api.microlink.io/?url=${encodeURIComponent(url)}`,
    `https://r.jina.ai/${url}`
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();
      console.log(html);
    } catch(e: any) { console.log(proxy, 'err:', e.message); }
  }
}
test();
