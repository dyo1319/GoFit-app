import { useEffect, useRef } from "react";

export function usePhoneDuplicate(apiBase, phone, onResult, onStart, wait = 600) {
  const cbRef = useRef(onResult);
  const startCbRef = useRef(onStart);
  
  useEffect(() => { 
    cbRef.current = onResult; 
  }, [onResult]);
  
  useEffect(() => { 
    startCbRef.current = onStart; 
  }, [onStart]);

  useEffect(() => {
    const clean = (val) => (val || "").replace(/\D/g, "");
    const p = clean(phone);

    if (p.length !== 10) { 
      cbRef.current?.(false); 
      return; 
    }

    const controller = new AbortController();
    
    startCbRef.current?.();
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBase}/U/search?q=${encodeURIComponent(p)}`, { 
          signal: controller.signal 
        });
        
        if (!res.ok) { 
          cbRef.current?.(false); 
          return; 
        }
        
        const json = await res.json();
        const exists = Array.isArray(json) ? json.length > 0 : !!json?.exists;
        cbRef.current?.(exists);
      } catch (e) {
        if (e.name !== "AbortError") {
          cbRef.current?.(false);
        }
      }
    }, wait);

    return () => { 
      controller.abort(); 
      clearTimeout(timer); 
    };
  }, [apiBase, phone, wait]); 
}