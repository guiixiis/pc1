# 🎯 Spotifake V3 — Quick Reference & Customization Guide

## 🎨 Personalizações Rápidas

### Alterar Cores Primárias

**Arquivo:** `static/css/app.css` (Linha ~6)

```css
:root {
  --green: #1db954;              /* Cor primária principal */
  --green-bright: #1ed760;       /* Versão mais brilhante */
  --green-dim: rgba(29,185,84,.15); /* Versão translúcida */
  
  /* Novas cores complementares (Linha ~8) */
  --accent-purple: #9d4edd;
  --accent-pink: #ec407a;
  --accent-blue: #2196f3;
}
```

### Alterar Nome e Logo

**Arquivo:** `templates/app.html` (Linha ~122)

```html
<!-- Mude de -->
<div class="sidebar-logo" onclick="showView('home')">
  <i class="fas fa-compact-disc"></i> Spotifake
</div>

<!-- Para -->
<div class="sidebar-logo" onclick="showView('home')">
  <i class="fas fa-music"></i> Seu App
</div>
```

### Mudar Serviço de Áudio

**Arquivo:** `database.py` (Linha ~116-117)

```python
# Mude de SoundHelix para outro serviço
AUDIO = [f"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{i}.mp3" for i in range(1,17)]

# Para seu próprio serviço
AUDIO = [f"https://seudominio.com/audio/song-{i}.mp3" for i in range(1,17)]
```

### Alterar Porta Flask

**Arquivo:** `app.py` (Final do arquivo)

```python
# Mude de 5000 para qualquer outra porta
if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Altere 5000 aqui
```

---

## 📊 Adicionar Novas Músicas

### Passo a Passo

1. **Abra** `database.py`
2. **Encontre** a função `_seed()` (Linha ~111)
3. **Localize** a lista `songs` (Linha ~119)
4. **Adicione** uma nova música no final:

```python
songs = [
    # ... músicas existentes ...
    (55, "Travessia", "Milton Nascimento", "Migração", "MPB", 1978, "2:51",
         "https://picsum.photos/seed/s55/300/300", audio(7), 94000,
         "Travessia na loucura\nTravessia na ternura\nTravessia pra vencer"),
    
    # NOVA MÚSICA AQUI
    (56, "Seu Título", "Seu Artista", "Seu Álbum", "Seu Gênero", 2024, "3:30",
         "https://picsum.photos/seed/s56/300/300", audio(1), 100000,
         "Sua letra aqui\nPode ter múltiplas linhas\nCom quebras de linha"),
]
```

### Estrutura da Música

```python
(
  id,           # Número único (56, 57, 58...)
  "title",      # Nome da música
  "artist",     # Artista (pode ter &)
  "album",      # Álbum ou "Single"
  "genre",      # Gênero
  year,         # Ano (número)
  "duration",   # Duração em "M:SS"
  "cover_url",  # URL da imagem (use picsum.photos)
  audio(n),     # Fonte de áudio (1-16)
  plays,        # Número de plays inicial
  "lyrics"      # Letra com \n para quebras
)
```

**Dica:** Use `audio(1)` a `audio(16)` para reutilizar áudios existentes.

---

## 🎯 Modificar Playlists Padrão

**Arquivo:** `database.py` (Linha ~160)

### Criar Nova Playlist

```python
playlists = [
    # ... playlists existentes ...
    (9, "Meu Estilo", "A melhor seleção", "https://picsum.photos/seed/pl9/300/300", None, 1),
]

# E adicione músicas
pl_songs = [
    # ... associações existentes ...
    (9, 1, 1),   # Playlist 9, Música 1, Posição 1
    (9, 18, 2),  # Playlist 9, Música 18, Posição 2
]
```

---

## 🔧 Modificar Comportamento do Player

### Tempo de Cache de API

**Arquivo:** `static/js/app.js` (Linha ~68)

```javascript
// Mude os TTLs (em segundos)
const [songsR, plsR, eventsR] = await Promise.all([
  cachedAPI('/api/songs', 3600),      // 1 hora
  cachedAPI('/api/playlists', 3600),  // 1 hora
  cachedAPI('/api/events', 7200)      // 2 horas
]);
```

### Volume Inicial do Player

**Arquivo:** `static/js/app.js` (Linha ~38)

```javascript
const S = {
  // ... outras props ...
  volume: 0.7,  // 0 a 1 (mude para 0.5, 1, etc)
};
```

### Duração do Toast (notificação)

**Arquivo:** `static/js/app.js` (Linha ~20)

```javascript
function toast(msg) {
  const el = $('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toastT); _toastT = setTimeout(() => el.classList.remove('show'), 2800); // ms
}
```

---

## 📱 Breakpoints Mobile (CSS)

**Arquivo:** `static/css/app.css` (Linha ~530+)

Todos os breakpoints podem ser customizados modificando os valores max-width:

```css
/* Mude estes valores conforme necessário */
@media (max-width: 1024px) { }  /* Tablets grandes */
@media (max-width: 768px)  { }  /* Tablets normais */
@media (max-width: 600px)  { }  /* Mobile grande */
@media (max-width: 480px)  { }  /* Mobile pequeno */
```

---

## 🔐 Alterar Credenciais de Demo

**Arquivo:** `database.py` (Linha ~215)

```python
# Mude as credenciais de demo
c.execute("INSERT OR IGNORE INTO users (id,username,email,password_hash,name,avatar_color) VALUES (1,'novo_user','novo@email.com',?,?,?)",
          (hash_pw('nova_senha'), 'Novo Nome', '#1db954'))
```

---

## 🎬 Alterar Animações

**Arquivo:** `static/css/app.css` (Linha ~680+)

### Velocidade de Animações

```css
/* Aumentar tempo das animações */
@keyframes slideIn {
  /* Default: 0.3s - mude em .modal { animation: slideIn 0.3s ... } */
}

/* Remover animações (performance em dispositivos antigos) */
* {
  transition: none !important;
  animation: none !important;
}
```

---

## 🌐 Servir em Produção

### Opção 1: Gunicorn + Nginx

```bash
# Instalar gunicorn
pip install gunicorn

# Rodar com gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Opção 2: Heroku

```bash
# Criar Procfile
echo "web: gunicorn app:app" > Procfile

# Fazer deploy
git push heroku main
```

### Opção 3: Docker

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
```

---

## 🔍 Debug & Logging

### Ativar Debug Mode

**Arquivo:** `app.py` (Final)

```python
if __name__ == '__main__':
    app.run(debug=True, port=5000)  # debug=True ativa auto-reload
```

### Logs no Console

**Arquivo:** `app.py` (Adicione em qualquer rota)

```python
@app.route('/api/test')
def test():
    print("Debug: Variável X =", some_value)  # Aparecerá no console
    return jsonify({'ok': True})
```

---

## 🎛️ Ambiente de Variáveis

Crie um arquivo `.env`:

```env
FLASK_ENV=production
SECRET_KEY=sua-chave-secreta-aqui
DATABASE=spotifake.db
```

Leia em `app.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret')
```

---

## 📊 Struktura de Banco de Dados

### Tabelas Principais

```sql
-- Usuários
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  avatar_color TEXT,
  bio TEXT,
  created_at TEXT
)

-- Músicas
CREATE TABLE songs (
  id INTEGER PRIMARY KEY,
  title TEXT,
  artist TEXT,
  album TEXT,
  genre TEXT,
  year INTEGER,
  duration TEXT,
  cover TEXT,
  audio_url TEXT,
  plays INTEGER,
  lyrics TEXT
)

-- Playlists
CREATE TABLE playlists (
  id INTEGER PRIMARY KEY,
  name TEXT,
  description TEXT,
  cover TEXT,
  owner_id INTEGER FOREIGN KEY,
  is_public INTEGER,
  created_at TEXT
)

-- Curtidas
CREATE TABLE likes (
  user_id INTEGER FOREIGN KEY,
  song_id INTEGER FOREIGN KEY,
  created_at TEXT
)
```

---

## 🚀 Dicas de Performance

1. **Comprimir Assets**
   ```bash
   # Minificar CSS
   python -m csscompressor static/css/app.css > static/css/app.min.css
   ```

2. **Usar CDN para Assets Estáticos**
   - Imagens em Cloudinary
   - Áudio em Bunny CDN
   - CSS/JS em jsDelivr

3. **Ativar GZIP**
   ```python
   from flask_compress import Compress
   Compress(app)
   ```

4. **Limpar Banco de Dados**
   ```bash
   rm spotifake.db  # Recriará ao iniciar
   ```

---

## ✅ Checklist de Customização

- [ ] Alterar cores primárias
- [ ] Mudar nome e logo
- [ ] Adicionar suas próprias músicas
- [ ] Configurar domínio/hospedagem
- [ ] Alterar credenciais de demo
- [ ] Configurar certificado SSL
- [ ] Ativar analytics
- [ ] Backup automático do banco
- [ ] Testes de mobile
- [ ] Deploy em produção

---

**Pronto para customizar seu Spotifake! 🚀**
