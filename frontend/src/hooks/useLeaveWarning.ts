import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/** Warns before the page is left with unsaved changes: in-app links ask, closing the tab gets the browser's prompt. */
export function useLeaveWarning(unsaved: boolean, message: string) {
  const blocker = useBlocker(unsaved);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm(message)) blocker.proceed();
    else blocker.reset();
  }, [blocker, message]);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);
}
