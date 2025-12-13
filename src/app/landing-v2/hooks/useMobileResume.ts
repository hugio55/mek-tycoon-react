'use client';

import { useState, useEffect } from 'react';

interface MobileResumeData {
  isResume: boolean;
  rid: string | null;
  addr: string | null;
  cid: string | null;
}

export function useMobileResume(): MobileResumeData {
  const [data, setData] = useState<MobileResumeData>({
    isResume: false,
    rid: null,
    addr: null,
    cid: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const claimResume = params.get('claimResume') === 'true';
    const rid = params.get('rid');
    const addr = params.get('addr');
    const cid = params.get('cid');

    const isValidResume = claimResume &&
      rid && rid.length > 0 &&
      addr && addr.length > 0 &&
      cid && cid.length > 0;

    if (isValidResume) {
      console.log('[🔐RESUME] Mobile resume detected via useMobileResume hook');
      console.log('[🔐RESUME] Params:', { rid, addr, cid });
    }

    setData({
      isResume: isValidResume,
      rid: rid,
      addr: addr,
      cid: cid,
    });
  }, []);

  return data;
}
