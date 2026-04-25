import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 🔥 Добавь onShare в пропсы
const ResumeList = ({ userId, onShare }) => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await fetch('/api/resumes', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setResumes(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки резюме:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const handleEdit = (id) => navigate(`/editor/${id}`);
  
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Удалить это резюме?')) return;
    try {
      const res = await fetch(`/api/resumes/${id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      if (res.ok) setResumes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (resumes.length === 0) return (
    <p>У вас пока нет резюме. 
      <button onClick={() => navigate('/editor/new')} className="btn btn-outline">
        Создать первое
      </button>
    </p>
  );

  return (
    <>
      {resumes.map(r => (
        <div 
          key={r.id} 
          className="resume-card" 
          onClick={() => handleEdit(r.id)} 
          style={{ cursor: 'pointer' }}
        >
          <div className="resume-info">
            <h3>{r.title}</h3>
            <p>Шаблон: {r.template} • Обновлено: {new Date(r.updatedAt).toLocaleDateString('ru-RU')}</p>
          </div>
          
          <div className="resume-actions" onClick={e => e.stopPropagation()}>
            <button className="btn-sm" onClick={() => handleEdit(r.id)}>
              <i className="fas fa-edit"></i> Редактировать
            </button>
            
            {/* 🔗 КНОПКА "ПОДЕЛИТЬСЯ" — используем r (не resume!) */}
            <button 
              className="btn-sm" 
              onClick={() => onShare?.(r.id)}
              title="Создать публичную ссылку"
            >
              🔗
            </button>
            
            <button className="btn-sm btn-danger" onClick={(e) => handleDelete(r.id, e)}>
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default ResumeList;