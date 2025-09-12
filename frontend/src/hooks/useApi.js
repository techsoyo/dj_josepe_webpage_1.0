import { useState, useEffect, useCallback } from 'react';
import { handleApiError } from '../lib/utils';

// Generic API hook
export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Mutation hook for POST, PUT, DELETE operations
export const useMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (apiCall) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      return response.data;
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
};

// Paginated data hook
export const usePaginatedApi = (apiCall, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchData = useCallback(async (newParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const requestParams = { ...params, ...newParams };
      const response = await apiCall(requestParams);
      
      setData(response.data.data || []);
      setPagination(response.data.pagination || {});
      setParams(requestParams);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [apiCall, params]);

  useEffect(() => {
    fetchData();
  }, []);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages) {
      fetchData({ page: pagination.page + 1 });
    }
  }, [pagination, fetchData]);

  const goToPage = useCallback((page) => {
    fetchData({ page });
  }, [fetchData]);

  const updateParams = useCallback((newParams) => {
    fetchData({ ...newParams, page: 1 });
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    loadMore,
    goToPage,
    updateParams,
    refetch
  };
};

// Search hook with debouncing
export const useSearch = (apiCall, debounceMs = 300) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiCall({ q: searchQuery });
      setResults(response.data.data || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, search, debounceMs]);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults
  };
};

// File upload hook
export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = useCallback(async (apiCall, files, onProgress) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const formData = new FormData();
      
      if (Array.isArray(files)) {
        files.forEach((file, index) => {
          formData.append('photos', file);
        });
      } else {
        formData.append('photo', files);
      }

      const response = await apiCall(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
          if (onProgress) onProgress(percentCompleted);
        }
      });

      return response.data;
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo);
      throw errorInfo;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  return { upload, uploading, progress, error };
};

// Local storage sync hook
export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }, [key, defaultValue]);

  return [value, setStoredValue, removeValue];
};

// Optimistic updates hook
export const useOptimisticUpdate = (initialData = []) => {
  const [data, setData] = useState(initialData);
  const [pendingOperations, setPendingOperations] = useState(new Set());

  const optimisticAdd = useCallback((item, apiCall) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = { ...item, id: tempId, _optimistic: true };
    
    setData(prev => [optimisticItem, ...prev]);
    setPendingOperations(prev => new Set([...prev, tempId]));

    return apiCall(item)
      .then(response => {
        setData(prev => prev.map(i => 
          i.id === tempId ? { ...response.data, _optimistic: false } : i
        ));
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
        return response.data;
      })
      .catch(error => {
        setData(prev => prev.filter(i => i.id !== tempId));
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
        throw error;
      });
  }, []);

  const optimisticUpdate = useCallback((id, updates, apiCall) => {
    const originalItem = data.find(item => item.id === id);
    
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates, _optimistic: true } : item
    ));
    setPendingOperations(prev => new Set([...prev, id]));

    return apiCall(id, updates)
      .then(response => {
        setData(prev => prev.map(i => 
          i.id === id ? { ...response.data, _optimistic: false } : i
        ));
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        return response.data;
      })
      .catch(error => {
        setData(prev => prev.map(i => 
          i.id === id ? originalItem : i
        ));
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        throw error;
      });
  }, [data]);

  const optimisticDelete = useCallback((id, apiCall) => {
    const originalItem = data.find(item => item.id === id);
    
    setData(prev => prev.filter(item => item.id !== id));
    setPendingOperations(prev => new Set([...prev, id]));

    return apiCall(id)
      .then(response => {
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        return response;
      })
      .catch(error => {
        setData(prev => [...prev, originalItem]);
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        throw error;
      });
  }, [data]);

  return {
    data,
    setData,
    pendingOperations,
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete
  };
};

