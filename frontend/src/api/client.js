import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export async function getCities() {
  const { data } = await api.get('/cities');
  return data;
}

export async function getDashboard(slug, { days = 7, source } = {}) {
  const params = { days };
  if (source) params.source = source;
  const { data } = await api.get(`/dashboard/${slug}`, { params });
  return data;
}

export async function getArticles(slug, params = {}) {
  const { data } = await api.get(`/articles/${slug}`, { params });
  return data;
}

export async function triggerIngest(slug) {
  const { data } = await api.post(`/cities/${slug}/ingest`);
  return data;
}

export default api;
