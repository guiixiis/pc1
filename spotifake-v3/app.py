from flask import Flask, render_template, jsonify, request, session, redirect, url_for
from functools import wraps
import database as db
import os, random

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'spotifake-v3-ultra-secret-2024')
app.config['SESSION_COOKIE_HTTPONLY'] = True

# ── Init DB on startup ────────────────────────────
with app.app_context():
    db.init_db()

# ── Auth decorators ───────────────────────────────
def login_required(f):
    @wraps(f)
    def dec(*a, **kw):
        if 'user_id' not in session:
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'error': 'login_required', 'message': 'Faça login para continuar'}), 401
            return redirect('/login')
        return f(*a, **kw)
    return dec

def current_user():
    uid = session.get('user_id')
    return db.get_user(uid) if uid else None

# ── Page routes ───────────────────────────────────
@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('app.html')

@app.route('/login')
def login_page():
    if 'user_id' in session:
        return redirect('/')
    return render_template('auth.html', page='login')

@app.route('/register')
def register_page():
    if 'user_id' in session:
        return redirect('/')
    return render_template('auth.html', page='register')

# ── Auth API ──────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def api_register():
    d = request.json or {}
    name = d.get('name','').strip()
    username = d.get('username','').strip()
    email = d.get('email','').strip()
    password = d.get('password','')
    if not all([name, username, email, password]):
        return jsonify({'error': 'Preencha todos os campos'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Senha deve ter pelo menos 6 caracteres'}), 400
    user, err = db.create_user(username, email, password, name)
    if err:
        return jsonify({'error': err}), 400
    session['user_id'] = user['id']
    session.permanent = True
    return jsonify({'ok': True, 'user': _safe_user(user)})

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    d = request.json or {}
    username = d.get('username','').strip()
    password = d.get('password','')
    if not username or not password:
        return jsonify({'error': 'Preencha todos os campos'}), 400
    user = db.login_user(username, password)
    if not user:
        return jsonify({'error': 'Usuário ou senha incorretos'}), 401
    session['user_id'] = user['id']
    session.permanent = True
    return jsonify({'ok': True, 'user': _safe_user(user)})

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'ok': True})

@app.route('/api/auth/me')
def api_me():
    user = current_user()
    if not user:
        return jsonify({'logged': False})
    likes = db.get_user_likes(user['id'])
    unread = db.unread_count(user['id'])
    return jsonify({'logged': True, 'user': _safe_user(user), 'likes': likes, 'unread': unread})

@app.route('/api/auth/profile', methods=['POST'])
@login_required
def api_update_profile():
    d = request.json or {}
    uid = session['user_id']
    db.update_profile(uid, d.get('name',''), d.get('bio',''), d.get('avatar_color','#1db954'))
    user = db.get_user(uid)
    return jsonify({'ok': True, 'user': _safe_user(user)})

def _safe_user(u):
    return {k: u[k] for k in ['id','username','name','avatar_color','bio','created_at'] if k in u}

# ── Songs API ─────────────────────────────────────
@app.route('/api/songs')
@login_required
def api_songs():
    return jsonify(db.get_songs())

@app.route('/api/charts')
@login_required
def api_charts():
    return jsonify(db.get_charts())

@app.route('/api/song/<int:sid>')
@login_required
def api_song(sid):
    s = db.get_song(sid)
    if not s: return jsonify({'error': 'Not found'}), 404
    return jsonify(s)

# ── Playlists API ─────────────────────────────────
@app.route('/api/playlists')
@login_required
def api_playlists():
    system = db.get_playlists()
    user_pls = db.get_user_playlists(session['user_id'])
    return jsonify({'system': system, 'user': user_pls})

@app.route('/api/playlist/<int:pid>')
@login_required
def api_playlist(pid):
    pl = db.get_playlist(pid)
    if not pl: return jsonify({'error': 'Not found'}), 404
    return jsonify(pl)

@app.route('/api/playlist/create', methods=['POST'])
@login_required
def api_create_playlist():
    d = request.json or {}
    name = d.get('name','').strip()
    if not name: return jsonify({'error': 'Nome obrigatório'}), 400
    pid = db.create_playlist(session['user_id'], name, d.get('description',''))
    return jsonify({'ok': True, 'id': pid})

@app.route('/api/playlist/<int:pid>/add/<int:sid>', methods=['POST'])
@login_required
def api_add_to_playlist(pid, sid):
    ok = db.add_to_playlist(pid, sid, session['user_id'])
    return jsonify({'ok': ok})

# ── Likes API ─────────────────────────────────────
@app.route('/api/like/<int:sid>', methods=['POST'])
@login_required
def api_like(sid):
    liked = db.toggle_like(session['user_id'], sid)
    return jsonify({'liked': liked})

@app.route('/api/liked')
@login_required
def api_liked():
    return jsonify(db.get_liked_songs(session['user_id']))

# ── Radio API ─────────────────────────────────────
@app.route('/api/radio/<int:sid>')
@login_required
def api_radio(sid):
    return jsonify(db.get_radio(sid))

# ── Events API ────────────────────────────────────
@app.route('/api/events')
@login_required
def api_events():
    return jsonify(db.get_events())

# ── Notifications API ─────────────────────────────
@app.route('/api/notifications')
@login_required
def api_notifications():
    uid = session['user_id']
    notifs = db.get_notifications(uid)
    db.mark_all_read(uid)
    return jsonify(notifs)

# ── Search API ────────────────────────────────────
@app.route('/api/search')
@login_required
def api_search():
    q = request.args.get('q','').strip()
    if not q: return jsonify({'songs':[],'playlists':[]})
    return jsonify(db.search_all(q))

if __name__ == '__main__':
    print("🎵 Spotifake V3 iniciando...")
    print("📱 Acesse: http://localhost:5000")
    app.run(debug=True, port=5000)
