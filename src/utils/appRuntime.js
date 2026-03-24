const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const trimLeadingSlash = (value = '') => value.replace(/^\/+/, '');

export const getAppBasePath = () => {
  const publicUrl = process.env.PUBLIC_URL || '';
  if (!publicUrl || publicUrl === '/') {
    return '';
  }

  if (/^https?:\/\//i.test(publicUrl)) {
    try {
      return trimTrailingSlash(new URL(publicUrl).pathname);
    } catch (error) {
      return trimTrailingSlash(publicUrl);
    }
  }

  return trimTrailingSlash(publicUrl);
};

export const withAppBase = (path = '/') => {
  const normalizedPath = path === '/' ? '' : `/${trimLeadingSlash(path)}`;
  const basePath = getAppBasePath();

  if (!basePath) {
    return normalizedPath || '/';
  }

  return `${basePath}${normalizedPath}` || '/';
};

export const getRuntimeApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    window.__APP_CONFIG__?.API_BASE_URL ||
    window.localStorage.getItem('app_api_url') ||
    ''
  );
};

export const getApiBaseUrl = () => {
  const runtimeUrl = getRuntimeApiBaseUrl();
  const envUrl = process.env.REACT_APP_API_URL || '';
  const preferredUrl = envUrl || runtimeUrl;

  if (preferredUrl) {
    return trimTrailingSlash(preferredUrl);
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${origin}/api`;
    }
  }

  return 'http://localhost:5001/api';
};
