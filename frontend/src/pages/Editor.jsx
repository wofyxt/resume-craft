import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import html2pdf from 'html2pdf.js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ResumePreview from '../components/ResumePreview';
import './Editor.css';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import ResumeVersionHistory from '../components/ResumeVersionHistory';

const Editor = () => {
  const { resumeId } = useParams();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [professions, setProfessions] = useState([]);
const [selectedProfession, setSelectedProfession] = useState('');
  const [favoriteTemplates, setFavoriteTemplates] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(true);
const [showVersionHistory, setShowVersionHistory] = useState(false);
  const { register, control, handleSubmit, setValue, watch, getValues,formState: { errors } } = useForm({
    defaultValues: {
      personal: {
        fullName: '',
        title: '',
        email: '',
        phone: '',
        address: '',
        summary: '',
      },
      experience: [{ company: '', position: '', startDate: '', endDate: '', description: '' }],
      education: [{ institution: '', degree: '', year: '', description: '' }],
      skills: [{ name: '' }],
      customSections: [],
    }
  });

  const { fields: expFields, append: addExp, remove: removeExp } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields, append: addEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });
  const { fields: skillFields, append: addSkill, remove: removeSkill } = useFieldArray({ control, name: 'skills' });
  const { fields: customFields, append: addCustom, remove: removeCustom } = useFieldArray({ control, name: 'customSections' });

  useEffect(() => {
  const loadResume = async () => {
    // Если это создание нового резюме — ничего не загружаем
    if (!resumeId || resumeId === 'new') return;

    try {
      const res = await fetch(`/api/resumes/${resumeId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Не удалось загрузить резюме');
      
      const resume = await res.json();
      
      // 🔹 Заполняем форму данными из БД
      if (resume.data) {
        Object.keys(resume.data).forEach(key => {
          setValue(key, resume.data[key]);
        });
      }
      if (resume.template) setSelectedTemplate(resume.template);
      if (resume.profession_id) setSelectedProfession(resume.profession_id);
    } catch (err) {
      console.error('Load error:', err);
      alert('❌ Ошибка загрузки резюме');
      navigate('/dashboard');
    }
  };

  loadResume();

  // Загрузка избранных шаблонов
const fetchFavorites = async () => {
  try {
    const res = await fetch('/api/favorites', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      // Сохраняем только css_class для быстрой проверки
      setFavoriteTemplates(data.map(f => f.css_class));
    }
  } catch (e) {
    console.error('Failed to load favorites:', e);
  }
};

fetchFavorites();
// Загрузка списка профессий
fetch('/api/professions', { credentials: 'include' })
  .then(r => r.json())
  .then(setProfessions);
}, [resumeId, setValue, navigate]);

 const onSubmit = async (data) => {
  console.log('🚀 onSubmit вызвана! Данные:', data); 
  try {
    const resumeData = {
      title: data.personal.fullName || 'Без названия',
      data,
      template: selectedTemplate,
      profession_id: selectedProfession || null, // 🔥 Добавлено
    };

    const url = resumeId && resumeId !== 'new' 
      ? `/api/resumes/${resumeId}` 
      : '/api/resumes';
    
    const method = resumeId && resumeId !== 'new' ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(resumeData),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Ошибка сохранения');

    // 🔥 Сохраняем и в localStorage для быстрого доступа (опционально)
    const localResumes = JSON.parse(localStorage.getItem('resumes') || '[]');
    if (resumeId && resumeId !== 'new') {
      const idx = localResumes.findIndex(r => r.id === resumeId);
      if (idx !== -1) localResumes[idx] = { ...result, id: resumeId };
    } else {
      localResumes.push({ ...result, id: result.id || Date.now().toString() });
    }
    localStorage.setItem('resumes', JSON.stringify(localResumes));

    alert('✅ Резюме сохранено!');
    navigate('/dashboard');
  } catch (err) {
    console.error('Save error:', err);
    alert(`❌ Не удалось сохранить: ${err.message}`);
  }
};

  const handleExport = () => {
    const element = document.getElementById('resume-preview');
    if (element) {
      const opt = {
        margin: 0.5,
        filename: `${watch('personal.fullName') || 'resume'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  // 📄 Экспорт в PDF (твоя старая функция, переименованная)
const exportPDF = () => {
  const element = document.getElementById('resume-preview');
  if (!element) return;
  const opt = {
    margin: 0.5,
    filename: `${watch('personal.fullName') || 'resume'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
};

// 📝 Экспорт в DOCX (генерация из данных формы)
const exportDOCX = async () => {
  
  const data = getValues(); // Берём актуальные данные формы
  const { personal, experience, education, skills } = data;
  const children = [];

  // Заголовок (ФИО)
  children.push(new Paragraph({
    children: [new TextRun({ text: personal.fullName || 'ФИО', bold: true, size: 32 })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 }
  }));
  // Должность
  if (personal.title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: personal.title, size: 24, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }));
  }
  // Контакты
  children.push(new Paragraph({
    children: [
      new TextRun({ text: `📧 ${personal.email || ''} `, size: 20 }),
      new TextRun({ text: `📞 ${personal.phone || ''}`, size: 20 })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 }
  }));

  // О себе
  if (personal.summary) {
    children.push(new Paragraph({ text: 'О себе', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    children.push(new Paragraph({ children: [new TextRun(personal.summary)] }));
  }

  // Опыт работы
  if (experience?.length > 0) {
    children.push(new Paragraph({ text: 'Опыт работы', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 100 } }));
    experience.forEach(exp => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.position || '', bold: true, size: 22 }),
          new TextRun({ text: ` | ${exp.company || ''}`, size: 20 })
        ],
        spacing: { after: 40 }
      }));
      children.push(new Paragraph({
        children: [new TextRun({ text: `${exp.startDate || ''} — ${exp.endDate || ''}`, italics: true, size: 18 })],
        spacing: { after: 40 }
      }));
      if (exp.description) {
        children.push(new Paragraph({ children: [new TextRun(exp.description)], spacing: { after: 120 } }));
      }
    });
  }

  // Образование
  if (education?.length > 0) {
    children.push(new Paragraph({ text: 'Образование', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    education.forEach(edu => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.degree || '', bold: true, size: 22 }),
          new TextRun({ text: `, ${edu.institution || ''}`, size: 20 })
        ],
        spacing: { after: 40 }
      }));
      if (edu.year) children.push(new Paragraph({ children: [new TextRun(edu.year)], spacing: { after: 120 } }));
    });
  }

  // Навыки
  if (skills?.length > 0) {
    children.push(new Paragraph({ text: 'Навыки', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }));
    skills.forEach(skill => {
      if (skill.name) children.push(new Paragraph({ children: [new TextRun(`• ${skill.name}`)], spacing: { after: 40 } }));
    });
  }

  // Генерация и скачивание
  try {
   // Стало:
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { 
          font: "Inter",        // Шрифт по умолчанию
          size: 20,             // Размер текста (20 = 10pt)
          color: "1F2937"       // Цвет текста (тёмно-серый, без #)
        },
        paragraph: { 
          spacing: { after: 120 } // Отступ после каждого абзаца
        }
      }
    }
  },
  sections: [{ children }]
});
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${personal.fullName || 'resume'}.docx`);
  } catch (err) {
    console.error('Ошибка генерации DOCX:', err);
    alert('Не удалось создать файл. Проверьте консоль.');
  }
};

// ❤️ Переключение шаблона в избранном
const toggleFavorite = async (cssClass, e) => {
  e.stopPropagation(); // Чтобы не срабатывало переключение шаблона
  
  const isFav = favoriteTemplates.includes(cssClass);
  
  try {
    const method = isFav ? 'DELETE' : 'POST';
    const url = isFav 
      ? `/api/favorites/${cssClass}` 
      : '/api/favorites';
    
    const body = !isFav ? JSON.stringify({ templateId: cssClass }) : undefined;
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body
    });
    
    if (res.ok) {
      setFavoriteTemplates(prev => 
        isFav 
          ? prev.filter(c => c !== cssClass) 
          : [...prev, cssClass]
      );
    }
  } catch (err) {
    console.error('Toggle favorite error:', err);
  }
};
  return (
    <>
      <Header />
      <div className="editor-container">
        <div className="container">
          <div className="editor-header">
            <h1>Редактор резюме</h1>
            <div className="editor-actions">
              <button onClick={() => setPreviewVisible(!previewVisible)} className="btn btn-outline">
                <i className="fas fa-eye"></i> {previewVisible ? 'Скрыть превью' : 'Показать превью'}
              </button>
             
   <div style={{ position: 'relative' }}>
  <button 
    onClick={() => setShowExportMenu(prev => !prev)} 
    className="btn btn-primary" 
    style={{ background: 'var(--success)' }}
  >
    <i className="fas fa-download" style={{ marginRight: '6px' }}></i>
    Экспорт
  </button>
  <button 
  onClick={() => setShowVersionHistory(true)} 
  className="btn btn-outline"
  style={{ background: '#fff', border: '1px solid #cbd5e1' }}
>
  📜 Версии
</button>
  {showExportMenu && (
    <div className="export-dropdown">
      <button 
        onClick={() => { exportPDF(); setShowExportMenu(false); }} 
        className="export-menu-item"
      >
        <i className="fas fa-file-pdf"></i>
        <span>PDF</span>
      </button>
      <button 
        onClick={() => { exportDOCX(); setShowExportMenu(false); }} 
        className="export-menu-item"
      >
        <i className="fas fa-file-word"></i>
        <span>DOCX</span>
      </button>
    </div>
  )}
</div>
            </div>
          </div>

          <div className="editor-layout">
            <div className="editor-form">
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Личная информация */}
                <section className="form-section">
                  <h2>Личная информация</h2>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>ФИО *</label>
                      <input 
  {...register('personal.fullName', { 
    required: 'Введите ФИО',
    minLength: { value: 2, message: 'Минимум 2 символа' },
    maxLength: { value: 50, message: 'Не более 50 символов' },
    pattern: { value: /^[а-яА-ЯёЁa-zA-Z\s\-]+$/, message: 'Только буквы и пробелы' }
  })} 
/>
{errors.personal?.fullName && <span className="error">{errors.personal.fullName.message}</span>}
                    </div>
                    <div className="form-group">
                      <label>Должность</label>
                      <input {...register('personal.title')} />
                    </div>
                    <div className="form-group">
  <label>Профессия / Специализация</label>
  <select 
    value={selectedProfession} 
    onChange={(e) => setSelectedProfession(e.target.value)}
  >
    <option value="">Не выбрано</option>
    {professions.map(p => (
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>
</div>
                    <div className="form-group">
                      <label>Email *</label>
                     <input 
  type="email"
  {...register('personal.email', { 
    required: 'Введите email',
    pattern: { 
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
      message: 'Некорректный email' 
    }
  })} 
/>{errors.personal?.email && <span className="error">{errors.personal.email.message}</span>}
                    </div>
                    <div className="form-group">
                      <label>Телефон</label>
                     <input 
  {...register('personal.phone', { 
    pattern: { 
      value: /^\+7\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/, 
      message: 'Пример: +7 (999) 123-45-67' 
    }
  })} 
  placeholder="+7 (___) ___-__-__"
/>
{errors.personal?.phone && <span className="error">{errors.personal.phone.message}</span>}
                    </div>
                    <div className="form-group">
                      <label>Адрес</label>
                      <input {...register('personal.address')} />
                    </div>
                    <div className="form-group full-width">
                      <label>Краткое описание (о себе)</label>
                      <textarea rows="3" {...register('personal.summary')}></textarea>
                    </div>
                  </div>
                </section>

                {/* Опыт работы */}
                <section className="form-section">
                  <h2>Опыт работы</h2>
                  {expFields.map((field, index) => (
                    <div key={field.id} className="dynamic-field">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Компания</label>
                          <input {...register(`experience.${index}.company`)} />
                        </div>
                        <div className="form-group">
                          <label>Должность</label>
                          <input {...register(`experience.${index}.position`)} />
                        </div>
                        {/* Дата начала */}
<div className="form-group">
  <label>Дата начала *</label>
  <input 
    type="month" 
    {...register(`experience.${index}.startDate`, {
      required: 'Укажите дату начала',
      validate: {
        notFuture: (value) => {
          const today = new Date().toISOString().slice(0, 7); // "2026-01"
          return value <= today || 'Дата не может быть в будущем';
        }
      }
    })} 
  />
  {errors.experience?.[index]?.startDate && (
    <span className="error">{errors.experience[index].startDate.message}</span>
  )}
</div>

{/* Дата окончания */}
<div className="form-group">
  <label>Дата окончания</label>
  <input 
    type="month" 
    {...register(`experience.${index}.endDate`, {
      validate: {
        afterStart: (value, formValues) => {
          const start = formValues.experience?.[index]?.startDate;
          // Если дата начала есть и дата окончания раньше — ошибка
          if (start && value && value < start) {
            return 'Не может быть раньше даты начала';
          }
          return true;
        }
      }
    })} 
  />
  {errors.experience?.[index]?.endDate && (
    <span className="error">{errors.experience[index].endDate.message}</span>
  )}
</div>
                        <div className="form-group full-width">
                          <label>Описание обязанностей</label>
                          <textarea rows="3" {...register(`experience.${index}.description`)}></textarea>
                        </div>
                      </div>
                      {expFields.length > 1 && (
                        <button type="button" onClick={() => removeExp(index)} className="btn-remove">
                          <i className="fas fa-trash"></i> Удалить
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addExp({})} className="btn-add">
                    <i className="fas fa-plus"></i> Добавить опыт
                  </button>
                </section>

                {/* Образование */}
                <section className="form-section">
                  <h2>Образование</h2>
                  {eduFields.map((field, index) => (
                    <div key={field.id} className="dynamic-field">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Учебное заведение</label>
                          <input {...register(`education.${index}.institution`)} />
                        </div>
                        <div className="form-group">
                          <label>Степень/Специальность</label>
                          <input {...register(`education.${index}.degree`)} />
                        </div>
                        <div className="form-group">
                          <label>Год окончания</label>
                          <input {...register(`education.${index}.year`)} />
                        </div>
                        <div className="form-group full-width">
                          <label>Описание</label>
                          <textarea rows="2" {...register(`education.${index}.description`)}></textarea>
                        </div>
                      </div>
                      {eduFields.length > 1 && (
                        <button type="button" onClick={() => removeEdu(index)} className="btn-remove">
                          <i className="fas fa-trash"></i> Удалить
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addEdu({})} className="btn-add">
                    <i className="fas fa-plus"></i> Добавить образование
                  </button>
                </section>

                {/* Навыки */}
                <section className="form-section">
                  <h2>Навыки</h2>
                  <div className="skills-list">
                    {skillFields.map((field, index) => (
                      <div key={field.id} className="skill-item">
                        <input {...register(`skills.${index}.name`)} placeholder="Навык" />
                        <button type="button" onClick={() => removeSkill(index)} className="btn-sm btn-danger">
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addSkill({})} className="btn-add">
                    <i className="fas fa-plus"></i> Добавить навык
                  </button>
                </section>

                {/* Дополнительные разделы */}
                <section className="form-section">
                  <h2>Дополнительные разделы</h2>
                  {customFields.map((field, index) => (
                    <div key={field.id} className="dynamic-field">
                      <div className="form-group">
                        <label>Название раздела</label>
                        <input {...register(`customSections.${index}.title`)} />
                      </div>
                      <div className="form-group full-width">
                        <label>Содержание</label>
                        <textarea rows="3" {...register(`customSections.${index}.content`)}></textarea>
                      </div>
                      <button type="button" onClick={() => removeCustom(index)} className="btn-remove">
                        <i className="fas fa-trash"></i> Удалить
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addCustom({ title: '', content: '' })} className="btn-add">
                    <i className="fas fa-plus"></i> Добавить раздел
                  </button>
                </section>

                {/* Выбор шаблона */}
                <section className="form-section">
  <h2>Выберите шаблон</h2>
  <div className="template-options">
    <div 
      className={`template-option ${selectedTemplate === 'modern' ? 'active' : ''}`} 
      onClick={() => setSelectedTemplate('modern')}
      style={{ position: 'relative' }} // 🔥 Важно для позиционирования кнопки
    > 
     <button
      type="button"
    onClick={(e) => toggleFavorite('modern', e)}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: favoriteTemplates.includes('modern') ? '#fee2e2' : 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      zIndex: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}
    title={favoriteTemplates.includes('modern') ? 'Удалить из избранного' : 'Добавить в избранное'}
  >
    {favoriteTemplates.includes('modern') ? '❤️' : '🤍'}
  </button>
      <div className="template-preview modern"></div>
      <span>Современный</span>
    </div>
    
    <div 
      className={`template-option ${selectedTemplate === 'classic' ? 'active' : ''}`} 
      onClick={() => setSelectedTemplate('classic')}
      style={{ position: 'relative' }} // 🔥 Важно для позиционирования кнопки
    >
       <button
        type="button"
    onClick={(e) => toggleFavorite('classic', e)}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: favoriteTemplates.includes('classic') ? '#fee2e2' : 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      zIndex: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}
    title={favoriteTemplates.includes('classic') ? 'Удалить из избранного' : 'Добавить в избранное'}
  >
    {favoriteTemplates.includes('classic') ? '❤️' : '🤍'}
  </button>
      <div className="template-preview classic"></div>
      <span>Классический</span>
    </div>
    
    <div 
      className={`template-option ${selectedTemplate === 'elegant' ? 'active' : ''}`} 
      onClick={() => setSelectedTemplate('elegant')}
      style={{ position: 'relative' }} // 🔥 Важно для позиционирования кнопки
    >
       <button
        type="button"
    onClick={(e) => toggleFavorite('elegant', e)}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: favoriteTemplates.includes('elegant') ? '#fee2e2' : 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      zIndex: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}
    title={favoriteTemplates.includes('elegant') ? 'Удалить из избранного' : 'Добавить в избранное'}
  >
    {favoriteTemplates.includes('elegant') ? '❤️' : '🤍'}
  </button>
      <div className="template-preview elegant"></div>
      <span>Элегантный</span>
    </div>
    
    <div 
      className={`template-option ${selectedTemplate === 'minimal' ? 'active' : ''}`} 
      onClick={() => setSelectedTemplate('minimal')}
      style={{ position: 'relative' }} // 🔥 Важно для позиционирования кнопки
    >
       <button
        type="button"
    onClick={(e) => toggleFavorite('minimal', e)}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: favoriteTemplates.includes('minimal') ? '#fee2e2' : 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      zIndex: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}
    title={favoriteTemplates.includes('minimal') ? 'Удалить из избранного' : 'Добавить в избранное'}
  >
    {favoriteTemplates.includes('minimal') ? '❤️' : '🤍'}
  </button>
      <div className="template-preview minimal"></div>
      <span>Минималистичный</span>
    </div>
    
    <div 
      className={`template-option ${selectedTemplate === 'creative' ? 'active' : ''}`} 
      onClick={() => setSelectedTemplate('creative')}
      style={{ position: 'relative' }} // 🔥 Важно для позиционирования кнопки
    >
       <button
        type="button"
    onClick={(e) => toggleFavorite('creative', e)}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: favoriteTemplates.includes('creative') ? '#fee2e2' : 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      zIndex: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}
    title={favoriteTemplates.includes('creative') ? 'Удалить из избранного' : 'Добавить в избранное'}
  >
    {favoriteTemplates.includes('creative') ? '❤️' : '🤍'}
  </button>
      <div className="template-preview creative"></div>
      <span>Креативный</span>
    </div>
    
    <div 
      className={`template-option ${selectedTemplate === 'bold' ? 'active' : ''}`} 
      onClick={() => setSelectedTemplate('bold')}
      style={{ position: 'relative' }} // 🔥 Важно для позиционирования кнопки
    >
       <button
        type="button"
    onClick={(e) => toggleFavorite('bold', e)}
    style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: favoriteTemplates.includes('bold') ? '#fee2e2' : 'rgba(255,255,255,0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      zIndex: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}
    title={favoriteTemplates.includes('bold') ? 'Удалить из избранного' : 'Добавить в избранное'}
  >
    {favoriteTemplates.includes('bold') ? '❤️' : '🤍'}
  </button>
      <div className="template-preview bold"></div>
      <span>Смелый</span>
    </div>
  </div>
</section>
<button type="submit" className="btn btn-primary">Сохранить</button>
              </form>
            </div>

            {previewVisible && (
              <div className="editor-preview">
                <div id="resume-preview">
                  <ResumePreview data={watch()} template={selectedTemplate} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      {showVersionHistory && (
  <ResumeVersionHistory 
    resumeId={resumeId} 
    onClose={() => setShowVersionHistory(false)} 
    onRefresh={() => window.location.reload()} 
  />
)}
    </>
  );
};

export default Editor;