import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверка сессии при загрузке страницы
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((userData) => setUser(userData), []);
  
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  // 🔥 Метод загрузки аватара
  const updateAvatar = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch('/api/users/avatar', {
      method: 'POST',
      credentials: 'include',
      body: formData // Браузер сам поставит Content-Type: multipart/form-data
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Ошибка загрузки');
    }
    const data = await res.json();
    setUser(data.user); // Обновляем объект пользователя с новым URL
    return data.user;
  }, []);

  // 🔥 Метод удаления аватара
  const removeAvatar = useCallback(async () => {
    const res = await fetch('/api/users/avatar', {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Ошибка удаления');
    // Обновляем локально, убирая URL
    setUser(prev => ({ ...prev, avatar_url: null }));
  }, []);

  const value = { user, loading, login, logout, updateAvatar, removeAvatar };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};