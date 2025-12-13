'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mek_claim_session';

export interface MobileResumeData {
  isResume: boolean;
  rid: string | null;
  addr: string | null;
  cid: string | null;
  // Specific failure reasons for better error messages
  failureReason: 'expired' | 'invalid_params' | 'no_reservation' | null;
}

interface StoredSession {
  rid: string;
  addr: string;
  cid: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Hook for handling mobile resume flow
 *
 * Flow:
 * 1. User copies resume link on mobile browser
 * 2. saveSession() stores session in localStorage as backup
 * 3. User pastes link in wallet browser
 * 4. This hook detects URL params OR falls back to localStorage
 * 5. Returns session data for resuming the claim
 */
export function useMobileResume(): MobileResumeData & {
  saveSession: (rid: string, addr: string, cid: string, expiresAt: number) => void;
  clearSession: () => void;
  getStoredSession: () => StoredSession | null;
} {
  const [data, setData] = useState<MobileResumeData>({
    isResume: false,
    rid: null,
    addr: null,
    cid: null,
    failureReason: null,
  });

  // Save session to localStorage (called when generating resume URL)
  const saveSession = useCallback((rid: string, addr: string, cid: string, expiresAt: number) => {
    try {
      const session: StoredSession = {
        rid,
        addr,
        cid,
        createdAt: Date.now(),
        expiresAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      console.log('[🔐RESUME] Session saved to localStorage backup');
    } catch (e) {
      console.warn('[🔐RESUME] Could not save session to localStorage:', e);
    }
  }, []);

  // Clear session from localStorage (called after successful claim or expiry)
  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[🔐RESUME] Session cleared from localStorage');
    } catch (e) {
      console.warn('[🔐RESUME] Could not clear session from localStorage:', e);
    }
  }, []);

  // Get stored session (for checking if backup exists)
  const getStoredSession = useCallback((): StoredSession | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const session: StoredSession = JSON.parse(stored);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        console.log('[🔐RESUME] Stored session expired, clearing');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return session;
    } catch (e) {
      console.warn('[🔐RESUME] Could not read session from localStorage:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    // First, try to get params from URL
    const params = new URLSearchParams(window.location.search);
    const claimResume = params.get('claimResume') === 'true';
    const urlRid = params.get('rid');
    const urlAddr = params.get('addr');
    const urlCid = params.get('cid');

    // Check if URL has resume flag
    if (claimResume) {
      // URL says this is a resume - validate params
      const hasAllParams = urlRid && urlRid.length > 0 &&
                          urlAddr && urlAddr.length > 0 &&
                          urlCid && urlCid.length > 0;

      if (hasAllParams) {
        console.log('[🔐RESUME] Valid resume detected from URL params');
        setData({
          isResume: true,
          rid: urlRid,
          addr: urlAddr,
          cid: urlCid,
          failureReason: null,
        });
        return;
      } else {
        // URL says resume but params are incomplete - check localStorage backup
        console.log('[🔐RESUME] URL has claimResume but missing params, checking localStorage...');
        const stored = getStoredSession();

        if (stored) {
          console.log('[🔐RESUME] Found valid session in localStorage backup');
          setData({
            isResume: true,
            rid: stored.rid,
            addr: stored.addr,
            cid: stored.cid,
            failureReason: null,
          });
          return;
        } else {
          // Resume attempted but no valid data anywhere
          console.warn('[🔐RESUME] Resume failed - invalid or missing params, no backup');
          setData({
            isResume: false,
            rid: null,
            addr: null,
            cid: null,
            failureReason: 'invalid_params',
          });
          return;
        }
      }
    }

    // No URL resume flag - check if there's a localStorage session anyway
    // (e.g., user navigated back without the URL params)
    const stored = getStoredSession();
    if (stored) {
      console.log('[🔐RESUME] No URL params but found localStorage session');
      // Don't auto-resume without URL flag, but make it available
      setData({
        isResume: false, // Not auto-resuming
        rid: stored.rid,
        addr: stored.addr,
        cid: stored.cid,
        failureReason: null,
      });
    } else {
      // Fresh visit, no resume
      setData({
        isResume: false,
        rid: null,
        addr: null,
        cid: null,
        failureReason: null,
      });
    }
  }, [getStoredSession]);

  return {
    ...data,
    saveSession,
    clearSession,
    getStoredSession,
  };
}

/**
 * Simple hook for components that just need to know if this is a resume
 * Uses the same logic as useMobileResume (including localStorage fallback)
 */
export function useIsMobileResume(): boolean {
  const { isResume } = useMobileResume();
  return isResume;
}
