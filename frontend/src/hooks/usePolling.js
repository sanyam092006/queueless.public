import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg } from '../api.js';

// Calls fetcher() now and then every `interval` ms. Pauses while the tab is hidden.
export default function usePolling(fetcher, interval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      setData(await fetcherRef.current());
      setError('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  return { data, loading, error, refresh };
}
