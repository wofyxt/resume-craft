require('dotenv').config();
const crypto = require('crypto'); // для генерации токена
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаём папку для аватаров, если её нет
const uploadDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Фильтр файлов (только изображения)
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Разрешены только JPG, PNG, WebP'), false);
  }
};

// Настройка Multer
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.userId}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 МБ
});
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Настройки cookie
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

// Middleware проверки авторизации
const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 🔥 Добавили проверку is_blocked
    const userCheck = await pool.query('SELECT id, is_blocked FROM users WHERE id = $1', [decoded.userId]);
    if (!userCheck.rows.length) return res.status(403).json({ error: 'Пользователь не найден' });
    
    if (userCheck.rows[0].is_blocked) {
      res.clearCookie('token', COOKIE_OPTS); // 🔥 Удаляем куки принудительно
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }
    
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ error: 'Недействительный токен' });
  }
};
// 📋 Middleware для логирования действий
const logActivity = async (userId, actionType, entityType = null, entityId = null, metadata = null, req = null) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        actionType,
        entityType,
        entityId,
        req?.ip || null,
        req?.get('User-Agent') || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
  } catch (err) {
    console.error('Log activity error:', err);
    // Не прерываем основной запрос, если лог не записался
  }
};
// 🔑 AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, is_blocked, created_at',
      [username, email, hashed]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS);

    await logActivity(user.id, 'register', 'user', user.id, null, req);
    res.status(201).json({ 
      user: { 
        id: user.id, 
        username: user.name, 
        email: user.email,
        role: user.role || 'user',
        is_blocked: user.is_blocked || false
      } 
    });
  
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'Email уже зарегистрирован' });
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // 🔥 Добавили is_blocked и role в выборку
    const result = await pool.query(
      'SELECT id, name, email, password_hash, avatar_url, is_blocked, role FROM users WHERE name = $1 OR email = $1',
      [username]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    // 🔥 ПРОВЕРКА ПЕРЕД ВЫДАЧЕЙ ТОКЕНА
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Ваш аккаунт заблокирован. Обратитесь в поддержку.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, COOKIE_OPTS);

    // 🔥 Логирование входа
    await logActivity(user.id, 'login', 'user', user.id, { method: 'password' }, req);

    res.json({
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role || 'user',
        is_blocked: user.is_blocked
      }
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
 try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 🔥 Добавили role, is_blocked
    const result = await pool.query('SELECT id, name, email, avatar_url, role, is_blocked FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ 
      user: { 
        id: result.rows[0].id, 
        username: result.rows[0].name, 
        email: result.rows[0].email,
        avatar_url: result.rows[0].avatar_url,
        role: result.rows[0].role || 'user',
        is_blocked: result.rows[0].is_blocked || false
      } 
    });
  
  } catch {
    res.status(403).json({ error: 'Токен недействителен' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  // 🔥 Логирование выхода
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await logActivity(decoded.userId, 'logout', 'user', decoded.userId, null, req);
    } catch {}
  }
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ message: 'Выход выполнен' });
});

// 🔐 ЗАПРОС НА СБРОС ПАРОЛЯ
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Проверка подключения (опционально, для отладки)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Ошибка подключения к почте:', error);
  } else {
    console.log('✅ Готов к отправке писем');
  }
});

// 🔐 ЗАПРОС НА СБРОС ПАРОЛЯ
// 🔐 ЗАПРОС НА СБРОС ПАРОЛЯ (с отправкой email)
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email обязателен' });
  }

  try {
    // Ищем пользователя
    const result = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    // ⚠️ Возвращаем успех даже если пользователь не найден (защита от перебора)
    if (!user) {
      return res.json({ message: 'Если такой пользователь существует, инструкции отправлены' });
    }

    // Генерируем токен
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    // Сохраняем в БД
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.id]
    );

    // Формируем ссылку
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    // 📧 ОТПРАВЛЯЕМ ПИСЬМО
    await transporter.sendMail({
      from: `"ResumeCraft" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Восстановление пароля',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #7494ec;">ResumeCraft</h2>
          <p>Здравствуйте!</p>
          <p>Вы запросили восстановление пароля. Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #7494ec; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Сбросить пароль</a>
          </div>
          <p>Или скопируйте ссылку:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p style="color: #999; font-size: 14px;">Ссылка действительна 1 час. Если вы не запрашивали сброс, просто проигнорируйте это письмо.</p>
        </div>
      `
    });

    console.log(`✅ Письмо отправлено на ${email}`);
    res.json({ message: 'Если такой пользователь существует, инструкции отправлены' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 🔐 УСТАНОВКА НОВОГО ПАРОЛЯ
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Токен и новый пароль обязательны' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
  }

  try {
    // 1. Проверяем токен и срок действия
    const userResult = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (!userResult.rows.length) {
      return res.status(400).json({ error: 'Ссылка недействительна или срок её действия истёк' });
    }

    const userId = userResult.rows[0].id;
    const hashed = await bcrypt.hash(newPassword, 10);

    // 2. Обновляем пароль и удаляем токен
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashed, userId]
    );
// 🔥 Логирование сброса пароля
    await logActivity(userId, 'password_reset', 'user', userId, null, req);
    // 3. Возвращаем JSON-ответ
    res.json({ message: 'Пароль успешно изменён' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Ошибка сервера при сбросе пароля' });
  }
});

// 📸 ЗАГРУЗКА АВАТАРА (локально)
app.post('/api/users/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

    // Сохраняем относительный путь в БД
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, avatar_url',
      [avatarUrl, req.userId]
    );
    await logActivity(req.userId, 'avatar_upload', 'user', req.userId, { filename: req.file.filename }, req);

    res.json({
      user: {
        id: result.rows[0].id,
        username: result.rows[0].name,
        email: result.rows[0].email,
        avatar_url: result.rows[0].avatar_url
      }
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Ошибка загрузки аватара' });
  }
});

// 🗑️ УДАЛЕНИЕ АВАТАРА
app.delete('/api/users/avatar', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.userId]);
    const avatarUrl = result.rows[0]?.avatar_url;

    if (avatarUrl && avatarUrl.startsWith('/uploads/avatars/')) {
      const filename = path.basename(avatarUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.query('UPDATE users SET avatar_url = NULL WHERE id = $1', [req.userId]);
     await logActivity(req.userId, 'avatar_delete', 'user', req.userId, null, req);
    res.json({ message: 'Аватар удалён' });
  } catch (err) {
    console.error('Avatar delete error:', err);
    res.status(500).json({ error: 'Ошибка удаления аватара' });
  }
});

// ✏️ ОБНОВЛЕНИЕ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
app.put('/api/users/profile', requireAuth, async (req, res) => {
  const { username, email, password } = req.body;

  // Валидация
  if (!username || !email) {
    return res.status(400).json({ error: 'Имя и email обязательны' });
  }

  try {
    // Проверяем, не занят ли email другим пользователем
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.userId]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email уже занят' });
    }

    // Формируем динамический запрос: если пароль есть — хешируем и обновляем
    let query = 'UPDATE users SET name = $1, email = $2';
    const values = [username, email];
    let paramCount = 2;

    if (password && password.trim() !== '') {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
      }
      paramCount++;
      const hashed = await bcrypt.hash(password, 10);
      query += `, password_hash = $${paramCount}`;
      values.push(hashed);
    }

    // Завершаем запрос
    paramCount++;
    query += ` WHERE id = $${paramCount} RETURNING id, name, email, avatar_url`;
    values.push(req.userId);

    const result = await pool.query(query, values);
    
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
 await logActivity(req.userId, 'profile_update', 'user', req.userId, { fields: ['username', 'email', password ? 'password' : null].filter(Boolean) }, req);
    // Возвращаем данные в формате, ожидаемом фронтендом
    res.json({
      user: {
        id: result.rows[0].id,
        username: result.rows[0].name,  // 🔄 name → username для совместимости
        email: result.rows[0].email,
        avatar_url: result.rows[0].avatar_url
      }
    });

  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Ошибка сервера при обновлении профиля' });
  }
});

// 📄 RESUME ROUTES
app.get('/api/resumes', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, title, data, template, updated_at AS "updatedAt" FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC',
    [req.userId]
  );
  res.json(result.rows);
});

app.post('/api/resumes', requireAuth, async (req, res) => {
  const { title, data, template } = req.body;
  const result = await pool.query(
    'INSERT INTO resumes (user_id, title, data, template) VALUES ($1, $2, $3, $4) RETURNING id, title, data, template, updated_at AS "updatedAt"',
    [req.userId, title || 'Без названия', data, template || 'modern']
  );
  await logActivity(req.userId, 'resume_create', 'resume', result.rows[0].id, { title: result.rows[0].title }, req);
  res.status(201).json(result.rows[0]);
});

app.put('/api/resumes/:id', requireAuth, async (req, res) => {
  try {
    const { title, data, template } = req.body;
    const result = await pool.query(
      `UPDATE resumes SET title = $1, data = $2, template = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING id, title, data, template, updated_at AS "updatedAt"`,
      [title, data, template, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Резюме не найдено' });
    
    // 🔥 Логирование обновления резюме
    await logActivity(req.userId, 'resume_update', 'resume', req.params.id, { title }, req);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update resume error:', err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

app.delete('/api/resumes/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM resumes WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Резюме не найдено' });
    
    // 🔥 Логирование удаления резюме
    await logActivity(req.userId, 'resume_delete', 'resume', req.params.id, null, req);
    
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});



// 🔒 Middleware только для админов
const requireAdmin = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userCheck = await pool.query('SELECT id, role, is_blocked FROM users WHERE id = $1', [decoded.userId]);
    if (!userCheck.rows.length) return res.status(403).json({ error: 'Пользователь не найден' });
    const u = userCheck.rows[0];
    if (u.role !== 'admin') return res.status(403).json({ error: 'Доступ запрещён' });
    if (u.is_blocked) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(403).json({ error: 'Недействительный токен' });
  }
};
// ⭐ REVIEWS ROUTES

// 📝 Создать отзыв (только для авторизованных)
app.post('/api/reviews', requireAuth, async (req, res) => {
  try {
    const { rating, title, content } = req.body;
    
    if (!rating || !content) {
      return res.status(400).json({ error: 'Оценка и текст обязательны' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
    }

    // Проверяем, нет ли уже отзыва от этого пользователя
    const existing = await pool.query('SELECT id FROM reviews WHERE user_id = $1', [req.userId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Вы уже оставили отзыв. Вы можете отредактировать его.' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, rating, title, content) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, rating, title || null, content]
    );

    // 🔥 Логируем создание отзыва
    await logActivity(req.userId, 'review_create', 'review', result.rows[0].id, { rating }, req);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Ошибка отправки отзыва' });
  }
});

// 📋 Получить мои отзывы
app.get('/api/reviews/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, rating, title, content, status, created_at 
       FROM reviews WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки отзывов' });
  }
});

// ✏️ Обновить мой отзыв
app.put('/api/reviews/:id', requireAuth, async (req, res) => {
  try {
    const { rating, title, content } = req.body;
    
    // Проверяем, что отзыв принадлежит пользователю
    const check = await pool.query(
      'SELECT id, status FROM reviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!check.rows.length) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }
    
    // Нельзя редактировать отклонённые отзывы
    if (check.rows[0].status === 'rejected') {
      return res.status(403).json({ error: 'Отклонённые отзывы нельзя редактировать' });
    }

    const result = await pool.query(
      `UPDATE reviews SET rating = $1, title = $2, content = $3, updated_at = NOW(), 
       status = CASE WHEN status = 'approved' THEN 'pending' ELSE status END
       WHERE id = $4 RETURNING *`,
      [rating, title || null, content, req.params.id]
    );

    await logActivity(req.userId, 'review_update', 'review', req.params.id, null, req);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ error: 'Ошибка обновления отзыва' });
  }
});

// 🗑️ Удалить мой отзыв
app.delete('/api/reviews/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }
    
    await logActivity(req.userId, 'review_delete', 'review', req.params.id, null, req);
    
    res.json({ message: 'Отзыв удалён' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: 'Ошибка удаления отзыва' });
  }
});

// 🌐 Публичные отзывы (для главной страницы)
app.get('/api/reviews/public', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await pool.query(
      `SELECT r.id, r.rating, r.title, r.content, r.created_at, 
              u.name as author_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'approved'
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get public reviews error:', err);
    res.status(500).json({ error: 'Ошибка загрузки отзывов' });
  }
});

// 🔐 Админ: получить все отзывы (с фильтрами)
app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
  try {
    const { status, userId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT r.*, u.name as author_name, u.email as author_email, u.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
    }
    if (userId) {
      paramCount++;
      query += ` AND r.user_id = $${paramCount}`;
      params.push(userId);
    }

    paramCount++;
    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin reviews error:', err);
    res.status(500).json({ error: 'Ошибка загрузки отзывов' });
  }
});

// 🔐 Админ: модерация отзыва (одобрить/отклонить)
app.put('/api/admin/reviews/:id/moderate', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' или 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const result = await pool.query(
      `UPDATE reviews SET status = $1, updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }

    // 🔥 Логируем модерацию
    await logActivity(req.userId, 'review_moderate', 'review', req.params.id, { newStatus: status }, req);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Moderate review error:', err);
    res.status(500).json({ error: 'Ошибка модерации' });
  }
});
// 📊 Статистика
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const usersRes = await pool.query('SELECT COUNT(*) as count FROM users');
    const resumesRes = await pool.query('SELECT COUNT(*) as count FROM resumes');
    res.json({
      totalUsers: parseInt(usersRes.rows[0].count),
      totalResumes: parseInt(resumesRes.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// 👥 Список пользователей (с поиском)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = search 
      ? 'SELECT id, name, email, role, is_blocked, created_at FROM users WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC'
      : 'SELECT id, name, email, role, is_blocked, created_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query, search ? [`%${search}%`] : []);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения списка' });
  }
});

// 🚫 Блокировка/Разблокировка
app.put('/api/admin/users/:id/block', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.userId) return res.status(400).json({ error: 'Нельзя заблокировать себя' });
    
    const result = await pool.query(
      'UPDATE users SET is_blocked = NOT is_blocked WHERE id = $1 RETURNING id, is_blocked',
      [id]
    );
     await logActivity(req.userId, result.rows[0].is_blocked ? 'user_block' : 'user_unblock', 'user', id, null, req);
    res.json({ message: result.rows[0].is_blocked ? 'Заблокирован' : 'Разблокирован', isBlocked: result.rows[0].is_blocked });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

// 🎨 Добавление шаблона
app.post('/api/admin/templates', requireAdmin, async (req, res) => {
  try {
    const { name, description, preview_url, css_class } = req.body;
    const result = await pool.query(
      'INSERT INTO templates (name, description, preview_url, css_class) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, preview_url, css_class]
    );
     await logActivity(req.userId, 'template_create', 'template', result.rows[0].id, { name }, req);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления шаблона' });
  }
});
// 📋 Админ: получение логов активности
app.get('/api/admin/logs', requireAdmin, async (req, res) => {
  try {
    const { userId, actionType, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT al.*, u.name as username, u.email as user_email 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      query += ` AND al.user_id = $${paramCount}`;
      params.push(userId);
    }
    if (actionType) {
      paramCount++;
      query += ` AND al.action_type = $${paramCount}`;
      params.push(actionType);
    }

    paramCount++;
    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'Ошибка загрузки логов' });
  }
});
// 🗑️ УДАЛЕНИЕ АККАУНТА
app.delete('/api/users/account', requireAuth, async (req, res) => {
  try {
        await logActivity(req.userId, 'account_delete', 'user', req.userId, { reason: 'user_request' }, req);

    // 1. Удаляем резюме (на случай, если в БД нет ON DELETE CASCADE)
    await pool.query('DELETE FROM resumes WHERE user_id = $1', [req.userId]);

    // 2. Удаляем аватар с диска
    const userResult = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.userId]);
    const avatarUrl = userResult.rows[0]?.avatar_url;
    if (avatarUrl && avatarUrl.startsWith('/uploads/avatars/')) {
      const filename = path.basename(avatarUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // 3. Удаляем пользователя из БД
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);

    // 4. Очищаем сессию
    res.clearCookie('token', COOKIE_OPTS);
    res.json({ message: 'Аккаунт успешно удалён' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Ошибка при удалении аккаунта' });
  }
});

app.post('/api/resumes', requireAuth, async (req, res) => {
  try {
    const { title, data, template } = req.body;
    const result = await pool.query(
      `INSERT INTO resumes (user_id, title, data, template) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, title, data, template, updated_at AS "updatedAt"`,
      [req.userId, title || 'Без названия', data, template || 'modern']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Save resume error:', err);
    res.status(500).json({ error: 'Ошибка сохранения резюме' });
  }
});

app.put('/api/resumes/:id', requireAuth, async (req, res) => {
  try {
    const { title, data, template } = req.body;
    const result = await pool.query(
      `UPDATE resumes SET title = $1, data = $2, template = $3, updated_at = NOW() 
       WHERE id = $4 AND user_id = $5 
       RETURNING id, title, data, template, updated_at AS "updatedAt"`,
      [title, data, template, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Резюме не найдено' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update resume error:', err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

app.get('/api/resumes', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, template, updated_at AS "updatedAt" 
       FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get resumes error:', err);
    res.status(500).json({ error: 'Ошибка загрузки списка' });
  }
});

// 📝 COVER LETTERS ROUTES
app.get('/api/cover-letters', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cl.id, cl.title, cl.resume_id, cl.updated_at, r.title as resume_title 
      FROM cover_letters cl 
      LEFT JOIN resumes r ON cl.resume_id = r.id 
      WHERE cl.user_id = $1 
      ORDER BY cl.updated_at DESC`, [req.userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Ошибка загрузки писем' }); }
});

app.post('/api/cover-letters', requireAuth, async (req, res) => {
  try {
    const { title, content, resume_id } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Заголовок и текст обязательны' });
    
    const result = await pool.query(`
      INSERT INTO cover_letters (user_id, resume_id, title, content) 
      VALUES ($1, $2, $3, $4) RETURNING *`, 
      [req.userId, resume_id || null, title, content]);
       await logActivity(req.userId, 'cover_letter_create', 'cover_letter', result.rows[0].id, { title }, req);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Ошибка сохранения письма' }); }
});

app.put('/api/cover-letters/:id', requireAuth, async (req, res) => {
  try {
    const { title, content, resume_id } = req.body;
    const result = await pool.query(`
      UPDATE cover_letters 
      SET title = $1, content = $2, resume_id = $3, updated_at = NOW() 
      WHERE id = $4 AND user_id = $5 RETURNING *`, 
      [title, content, resume_id || null, req.params.id, req.userId]);
      
    if (!result.rows.length) return res.status(404).json({ error: 'Письмо не найдено' });
        await logActivity(req.userId, 'cover_letter_update', 'cover_letter', req.params.id, null, req);

    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Ошибка обновления' }); }
});

app.delete('/api/cover-letters/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cover_letters WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Не найдено' });
     await logActivity(req.userId, 'cover_letter_delete', 'cover_letter', req.params.id, null, req);
    res.json({ message: 'Удалено' });
  } catch (err) { res.status(500).json({ error: 'Ошибка удаления' }); }
});

// 📄 ЗАГРУЗКА ОДНОГО РЕЗЮМЕ
app.get('/api/resumes/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, data, template, updated_at AS "updatedAt" FROM resumes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Резюме не найдено' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки резюме' });
  }
});

// 🔗 PUBLIC SHARE ROUTES

// Создать публичную ссылку
app.post('/api/resumes/:id/share', requireAuth, async (req, res) => {
  try {
    const { expiresAt, password } = req.body;
    const resumeId = req.params.id;

    // 🔐 Проверяем, что резюме принадлежит пользователю
    const resumeCheck = await pool.query(
      'SELECT id FROM resumes WHERE id = $1 AND user_id = $2',
      [resumeId, req.userId]
    );
    if (!resumeCheck.rows.length) {
      return res.status(404).json({ error: 'Резюме не найдено' });
    }

    // Генерируем уникальный slug (6 символов)
    const generateSlug = () => Math.random().toString(36).substring(2, 8);
    let slug = generateSlug();
    
    // Проверяем уникальность (маловероятно, но на всякий случай)
    let exists = await pool.query('SELECT id FROM resume_shares WHERE slug = $1', [slug]);
    while (exists.rows.length > 0) {
      slug = generateSlug();
      exists = await pool.query('SELECT id FROM resume_shares WHERE slug = $1', [slug]);
    }

    // Хэшируем пароль, если есть
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const result = await pool.query(
      `INSERT INTO resume_shares (resume_id, slug, expires_at, password_hash) 
       VALUES ($1, $2, $3, $4) RETURNING slug, expires_at`,
      [resumeId, slug, expiresAt || null, passwordHash]
    );
    await logActivity(req.userId, 'share_create', 'resume_share', null, { resume_id: resumeId, slug: result.rows[0].slug }, req);

    res.status(201).json({ 
      link: `/s/${slug}`, 
      slug: result.rows[0].slug,
      expiresAt: result.rows[0].expires_at 
    });
  } catch (err) {
    console.error('Share create error:', err);
    res.status(500).json({ error: 'Ошибка создания ссылки' });
  }
});

// Получить список активных шар для резюме
app.get('/api/resumes/:id/shares', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, expires_at, views_count, created_at 
       FROM resume_shares 
       WHERE resume_id = $1 
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки ссылок' });
  }
});

// Удалить публичную ссылку
app.delete('/api/resumes/shares/:slug', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM resume_shares 
       WHERE slug = $1 
       AND resume_id IN (SELECT id FROM resumes WHERE user_id = $2)`,
      [req.params.slug, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
        await logActivity(req.userId, 'share_delete', 'resume_share', null, { slug: req.params.slug }, req);

    res.json({ message: 'Ссылка удалена' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

// 🌐 ПУБЛИЧНЫЙ ДОСТУП (без авторизации!)
app.get('/api/public/resume/:slug', async (req, res) => {
  try {
    const { slug, password } = req.query;

    // Ищем шар
    const share = await pool.query(
      `SELECT s.*, r.data, r.template, r.title, u.name as author_name 
       FROM resume_shares s
       JOIN resumes r ON s.resume_id = r.id
       JOIN users u ON r.user_id = u.id
       WHERE s.slug = $1`,
      [slug]
    );

    if (!share.rows.length) {
      return res.status(404).json({ error: 'Ссылка недействительна' });
    }

    const s = share.rows[0];

    // 🔐 Проверка пароля, если установлен
    if (s.password_hash) {
      if (!password) {
        return res.status(403).json({ error: 'Требуется пароль', requiresPassword: true });
      }
      const valid = await bcrypt.compare(password, s.password_hash);
      if (!valid) {
        return res.status(403).json({ error: 'Неверный пароль' });
      }
    }

    // 🔥 Проверяем срок действия
    if (s.expires_at && new Date(s.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Срок действия ссылки истёк' });
    }

    // Увеличиваем счётчик просмотров
    await pool.query('UPDATE resume_shares SET views_count = views_count + 1 WHERE id = $1', [s.id]);
    await logActivity(null, 'share_view', 'resume_share', s.id, { slug, views: s.views_count + 1 }, req);

    // Возвращаем данные резюме (без чувствительной информации)
    res.json({
      title: s.title,
      template: s.template,
      data: s.data,
      author: s.author_name,
      views: s.views_count
    });

  } catch (err) {
    console.error('Public resume error:', err);
    res.status(500).json({ error: 'Ошибка загрузки резюме' });
  }
});
// Запуск сервера
const PORT = process.env.PORT || 3001;
// 🖼️ Раздача загруженных аватаров
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL подключен');
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  } catch (err) {
    console.error('❌ Ошибка подключения к БД:', err.message);
  }
});

