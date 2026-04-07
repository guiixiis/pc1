"""
Spotifake V3 — SQLite Database Layer
Tabelas: users, songs, playlists, playlist_songs, likes, follows, events, notifications
"""
import sqlite3, hashlib, os, json, random
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'spotifake.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # Users
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_color TEXT DEFAULT '#1db954',
        bio TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    # Songs
    c.execute('''CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        genre TEXT,
        year INTEGER,
        duration TEXT,
        cover TEXT,
        audio_url TEXT,
        plays INTEGER DEFAULT 0,
        lyrics TEXT DEFAULT ''
    )''')

    # Playlists
    c.execute('''CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        cover TEXT,
        owner_id INTEGER,
        is_public INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (owner_id) REFERENCES users(id)
    )''')

    # Playlist songs
    c.execute('''CREATE TABLE IF NOT EXISTS playlist_songs (
        playlist_id INTEGER,
        song_id INTEGER,
        position INTEGER,
        added_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (playlist_id, song_id),
        FOREIGN KEY (playlist_id) REFERENCES playlists(id),
        FOREIGN KEY (song_id) REFERENCES songs(id)
    )''')

    # Likes
    c.execute('''CREATE TABLE IF NOT EXISTS likes (
        user_id INTEGER,
        song_id INTEGER,
        liked_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, song_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (song_id) REFERENCES songs(id)
    )''')

    # Events
    c.execute('''CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        artist TEXT NOT NULL,
        venue TEXT NOT NULL,
        city TEXT NOT NULL,
        date TEXT NOT NULL,
        price TEXT,
        cover TEXT,
        tickets_url TEXT DEFAULT '#'
    )''')

    # Notifications
    c.execute('''CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')

    conn.commit()
    _seed(conn)
    conn.close()

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def _seed(conn):
    c = conn.cursor()
    if c.execute("SELECT COUNT(*) FROM songs").fetchone()[0] > 0:
        return

    AUDIO = [f"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{i}.mp3" for i in range(1,17)]
    def audio(i): return AUDIO[(i-1) % 16]

    songs = [
        # Pop Internacional
        (1,"Blinding Lights","The Weeknd","After Hours","Synth-pop",2019,"3:20","https://picsum.photos/seed/s1/300/300",audio(1),320000,"I've been tryin' to call\nI've been on my own for long enough\nMaybe you can show me how to love\n\nI said, ooh, I'm blinded by the lights\nNo, I can't sleep until I feel your touch"),
        (2,"Levitating","Dua Lipa","Future Nostalgia","Pop",2020,"3:23","https://picsum.photos/seed/s2/300/300",audio(2),280000,"If you wanna run away with me, I know a galaxy\nGlitter in the sky, glitter in my eyes\n\nYou want me, I want you, baby\nMy sugarboo, I'm levitating"),
        (3,"As It Was","Harry Styles","Harry's House","Pop",2022,"2:37","https://picsum.photos/seed/s3/300/300",audio(3),450000,"Holding me back\nGravity's holding me back\n\nIn this world, it's just us\nYou know it's not the same as it was"),
        (4,"Cruel Summer","Taylor Swift","Lover","Synth-pop",2019,"2:58","https://picsum.photos/seed/s4/300/300",audio(4),620000,"Fever dream high in the quiet of the night\nIt's a cruel summer with you"),
        (5,"Anti-Hero","Taylor Swift","Midnights","Pop",2022,"3:20","https://picsum.photos/seed/s5/300/300",audio(5),580000,"I have this thing where I get older but just never wiser\nIt's me, hi, I'm the problem, it's me"),
        (6,"Flowers","Miley Cyrus","Endless Summer Vacation","Pop",2023,"3:21","https://picsum.photos/seed/s6/300/300",audio(6),510000,"I can buy myself flowers\nWrite my name in the sand\nTalk to myself for hours"),
        (7,"Heat Waves","Glass Animals","Dreamland","Indie Pop",2020,"3:59","https://picsum.photos/seed/s7/300/300",audio(7),390000,"Sometimes, all I think about is you\nLate nights in the middle of June\nHeat waves been faking me out"),
        (8,"Stay","Kid LAROI & Justin Bieber","F*CK LOVE 3","Pop",2021,"2:21","https://picsum.photos/seed/s8/300/300",audio(8),410000,"I do the same thing I told you that I never would\nI need you to stay, need you to stay"),
        (9,"drivers license","Olivia Rodrigo","SOUR","Pop",2021,"4:02","https://picsum.photos/seed/s9/300/300",audio(9),330000,"I got my driver's license last week\nAnd you're probably with that blonde girl\nShe's so much older than me"),
        (10,"good 4 u","Olivia Rodrigo","SOUR","Pop Rock",2021,"2:58","https://picsum.photos/seed/s10/300/300",audio(10),290000,"Well good for you I guess you moved on really easily\nRemember when you said you wanted to give me the world?"),
        # Hip-Hop / R&B
        (11,"Industry Baby","Lil Nas X & Jack Harlow","Montero","Hip-Hop",2021,"3:32","https://picsum.photos/seed/s11/300/300",audio(11),310000,"Baby back, ayy, ayy\nI told you long ago on the road\nI got what they waiting for"),
        (12,"Montero","Lil Nas X","Montero","Pop",2021,"2:17","https://picsum.photos/seed/s12/300/300",audio(12),350000,"I caught it bad yesterday\nHelped me forget all of my problems"),
        (13,"Peaches","Justin Bieber","Justice","R&B",2021,"3:18","https://picsum.photos/seed/s13/300/300",audio(13),240000,"I got my peaches out in Georgia\nSweet like Georgia peaches, yeah"),
        (14,"Butter","BTS","Butter","K-Pop",2021,"2:42","https://picsum.photos/seed/s14/300/300",audio(14),380000,"Smooth like butter\nLike a criminal undercover\nGon' pop like trouble"),
        (15,"Calm Down","Rema & Selena Gomez","Rave & Roses","Afrobeats",2022,"3:59","https://picsum.photos/seed/s15/300/300",audio(15),420000,"Baby, calm down, calm down\nGirl, don't you make me misbehave"),
        # Brasileiras - Funk
        (16,"Vai Malandra","MC Zaac & Maejor","Single","Funk",2017,"3:12","https://picsum.photos/seed/s16/300/300",audio(16),89000,"Vai malandra, vai malandra\nEla tá na pista, ela quer dançar\nVai malandra, vai malandra"),
        (17,"Bum Bum Tam Tam","MC Fioti","Single","Funk",2017,"2:58","https://picsum.photos/seed/s17/300/300",audio(1),76000,"Ela me deu o bum bum tam tam\nEla me deu o bum bum tam tam\nQue delícia, que saudade"),
        (18,"Envolver","Anitta","Single","Funk",2022,"2:45","https://picsum.photos/seed/s18/300/300",audio(2),195000,"Me envolve, me envolve\nMe envolve de verdade\nQuero te sentir aqui do lado"),
        (19,"Tá OK","Dennis DJ, MC Kevin o Chris","Single","Funk",2020,"3:01","https://picsum.photos/seed/s19/300/300",audio(3),67000,"Tá ok, tá ok\nEla quer mais, ela quer mais"),
        (20,"Coração de Diamante","Luísa Sonza","DOCE 22","Funk Pop",2022,"2:37","https://picsum.photos/seed/s20/300/300",audio(4),88000,"Meu coração de diamante\nNão quebra fácil, não\nJá fui pedra, agora sou brilhante"),
        # Sertanejo
        (21,"Evidências","Chitãozinho & Xororó","Ao Vivo","Sertanejo",1990,"4:15","https://picsum.photos/seed/s21/300/300",audio(5),210000,"Pare de chorar, me escuta\nNão adianta ser assim\nEvidências"),
        (22,"Fora de Hora","Gusttavo Lima","O Embaixador","Sertanejo",2019,"3:45","https://picsum.photos/seed/s22/300/300",audio(6),145000,"Você chegou fora de hora\nMe pega de surpresa todo dia\nFora de hora"),
        (23,"Amei Te Ver","Tiago Iorc","Troco Likes","Sertanejo Pop",2016,"4:02","https://picsum.photos/seed/s23/300/300",audio(7),132000,"Te amei tanto assim\nAmei te ver, amei te ter\nAmei cada segundo com você"),
        (24,"Largado às Traças","Zé Neto & Cristiano","Bora Billll","Sertanejo",2019,"3:28","https://picsum.photos/seed/s24/300/300",audio(8),167000,"Me deixou largado às traças\nSem você o que que eu faço?\nFui beber, fui me machucar"),
        (25,"Leva Eu","Hugo e Guilherme","Single","Sertanejo",2021,"3:15","https://picsum.photos/seed/s25/300/300",audio(9),98000,"Leva eu, me leva embora\nQuerida, não me deixa aqui"),
        # Pagode / Samba
        (26,"Recaída","Dilsinho","Ao Vivo","Pagode",2018,"3:52","https://picsum.photos/seed/s26/300/300",audio(10),87000,"Eu tentei resistir\nMas não consegui\nTive uma recaída em você"),
        (27,"Segura a Chuva","Thiaguinho","Tardezinha","Pagode",2015,"4:10","https://picsum.photos/seed/s27/300/300",audio(11),76000,"Segura a chuva\nNão deixa molhar\nO nosso amor ainda tem muito pra dar"),
        (28,"Não Precisa","Dennis DJ, MC Don Juan","Single","Pagode Funk",2020,"2:55","https://picsum.photos/seed/s28/300/300",audio(12),93000,"Não precisa de muito\nSó precisa de você\nNão precisa de mais nada"),
        (29,"Pra Sempre","Ferrugem","Ao Vivo","Pagode",2017,"4:30","https://picsum.photos/seed/s29/300/300",audio(13),65000,"Pra sempre ao seu lado\nÉ onde eu quero estar\nPra sempre, pra sempre"),
        (30,"Deixa Tudo Como Tá","Péricles","Fé","Pagode",2019,"3:48","https://picsum.photos/seed/s30/300/300",audio(14),72000,"Deixa tudo como tá\nNão mexa onde não deve\nDeixa tudo como tá"),
        # MPB / Pop Brasileiro
        (31,"Aquarela","Toquinho","Single","MPB",1983,"4:22","https://picsum.photos/seed/s31/300/300",audio(15),112000,"Numa folha qualquer eu desenho um sol amarelo\nE com cinco ou seis retas é fácil fazer um castelo"),
        (32,"Garota de Ipanema","Tom Jobim","Getz/Gilberto","Bossa Nova",1962,"5:10","https://picsum.photos/seed/s32/300/300",audio(16),198000,"Olha que coisa mais linda\nMais cheia de graça\nÉ ela menina que vem e que passa"),
        (33,"Menina Veneno","Ritchie","Single","Rock Brasileiro",1983,"3:55","https://picsum.photos/seed/s33/300/300",audio(1),88000,"Menina veneno\nVocê me faz sentir\nTão bem assim"),
        (34,"Não Deixe o Samba Morrer","Alcione","Single","Samba",1975,"3:40","https://picsum.photos/seed/s34/300/300",audio(2),143000,"Não deixe o samba morrer\nNão deixe o samba acabar"),
        (35,"Força Estranha","Caetano Veloso","Bicho","MPB",1977,"4:05","https://picsum.photos/seed/s35/300/300",audio(3),97000,"Hoje na avenida\nCortei os pés\nOs cacos de vidro"),
        # Rock Brasileiro
        (36,"Homem Amarelo","Gal Costa","Índia","Rock Psicodélico",1973,"2:45","https://picsum.photos/seed/s36/300/300",audio(4),76000,"Você que segue em frente\nPensa que é diferente\nMas é mentir pra si mesmo"),
        (37,"Selvagem","Gilberto Gil","Refavela","MPB",1977,"4:18","https://picsum.photos/seed/s37/300/300",audio(5),84000,"Leve a sua vida pro pé da montanha\nSelvagem é a vida lá dentro do peito"),
        (38,"Roda Gigante","Marisa Monte","Memórias","Pop Brasil",2000,"3:52","https://picsum.photos/seed/s38/300/300",audio(6),91000,"Era uma roda gigante\nGirando, girando dentro de mim"),
        (39,"Lua","Criolo","Nó Na Orelha","Hip-Hop Brasil",2011,"4:05","https://picsum.photos/seed/s39/300/300",audio(7),68000,"Olha a lua, olha que beleza\nCírculo perfeito, completeza\nOlha a lua, que magnificência"),
        (40,"Malandragem","Marcelo D2 & MV Bill","Single","Rap","2005","3:30","https://picsum.photos/seed/s40/300/300",audio(8),73000,"Malandragem não, malandragem sim\nNão é roubar, é meter a mão"),
        # Eletrônico Brasileiro
        (41,"Harmonia: O Caosmo","Carlinhos Brown","Guiné","Dance Brasil",2000,"3:15","https://picsum.photos/seed/s41/300/300",audio(9),62000,"Quando a gente aprende a entender\nA coisa fica de um jeito especial"),
        (42,"Zumbi","BaianaSystem","Duas Cidades","Eletrônico Bossa",2017,"4:20","https://picsum.photos/seed/s42/300/300",audio(10),81000,"Zumbi na pista disparando\nNostalgia com tecnologia"),
        (43,"Fé na Periferia","Emicida","Sobre Crianças, Quadris, Pesadelos","Rap","2015","3:42","https://picsum.photos/seed/s43/300/300",audio(11),75000,"Fé na periferia\nFé na labuta, fé na caminhada"),
        (44,"Cálice","Chico Buarque & Gilberto Gil","Single","Protesto","1978","4:38","https://picsum.photos/seed/s44/300/300",audio(12),109000,"Pai, afasta de mim esse cálice\nPai, afasta de mim esse cálice"),
        # Pop Latino
        (45,"Despecha","Rosalía & Rauw Alejandro","Motomami","Reggaeton",2022,"3:01","https://picsum.photos/seed/s45/300/300",audio(13),187000,"De ti me voy a despejar\nCon otro perreo voy a empezar"),
        (46,"MAMIII","Becky G & Karol G","Single","Reggaeton",2022,"3:20","https://picsum.photos/seed/s46/300/300",audio(14),195000,"Mamiii, me encanta tu sonrisa\nMamiii, eres una belleza"),
        (47,"Un x100to","Grupo Frontera & Bad Bunny","Un x100to","Trap Latino",2023,"3:33","https://picsum.photos/seed/s47/300/300",audio(15),202000,"Me voy pa' Medellín, me voy pa' Medellín\nEsta es la vida real, real, real"),
        (48,"Ella y Yo","Aventura","We Proudly Present","Reggaeton",2009,"4:33","https://picsum.photos/seed/s48/300/300",audio(16),156000,"Ella y yo somos uno en el amor\nTe amo más de lo que pueda imaginarte"),
        # Forró / Tropicália
        (49,"Forró Não é Lixo","Luiz Gonzaga & Jackson do Pandeiro","Clássicos","Forró",1958,"2:50","https://picsum.photos/seed/s49/300/300",audio(1),98000,"Forró não é lixo\nForró é uma coisa fina\nForró é coisa da gente"),
        (50,"Ciranda Cirandinha","Gal Costa","Festa Para um Rei Negro","Tropicália",1973,"3:12","https://picsum.photos/seed/s50/300/300",audio(2),67000,"Ciranda, cirandinha\nCirandeiro da multidão\nCom a fé do ciranda"),
        (52,"Sertão do Meu Coração","Xote das Meninas","Single","Forró",2005,"3:28","https://picsum.photos/seed/s52/300/300",audio(4),85000,"Sertão do meu coração\nCasarão branco de tradição"),
        (53,"Canto da Cidade","Daniela Mercury","Ser Toda","Axé",1992,"3:45","https://picsum.photos/seed/s53/300/300",audio(5),91000,"No canto da cidade\nVem grito de protesto\nVem grito de saudade"),
        (54,"Festa Não Acabou","Gal Costa","Flash Luz","Axé Tropicália",1985,"3:55","https://picsum.photos/seed/s54/300/300",audio(6),88000,"A festa não acabou\nVem ver o que é que tem"),
        (55,"Travessia","Milton Nascimento","Migração","MPB",1978,"2:51","https://picsum.photos/seed/s55/300/300",audio(7),94000,"Travessia na loucura\nTravessia na ternura\nTravessia pra vencer")
    ]

    c.executemany('''INSERT OR IGNORE INTO songs
        (id,title,artist,album,genre,year,duration,cover,audio_url,plays,lyrics)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)''', songs)

    # Playlists (owner_id=0 = sistema)
    playlists = [
        (1,"Top Brasil 2024","As maiores músicas do Brasil agora","https://picsum.photos/seed/pl1/300/300",None,1),
        (2,"Funk Hits","Os funks mais tocados","https://picsum.photos/seed/pl2/300/300",None,1),
        (3,"Sertanejo Raiz","Clássicos do sertanejo","https://picsum.photos/seed/pl3/300/300",None,1),
        (4,"Pagode & Samba","Roda de pagode virtual","https://picsum.photos/seed/pl4/300/300",None,1),
        (5,"Pop Mundial","Os maiores hits internacionais","https://picsum.photos/seed/pl5/300/300",None,1),
        (6,"Workout Mix","Energia total para o treino","https://picsum.photos/seed/pl6/300/300",None,1),
        (7,"Chill Vibes","Para relaxar e curtir","https://picsum.photos/seed/pl7/300/300",None,1),
        (8,"Novidades da Semana","Lançamentos quentes","https://picsum.photos/seed/pl8/300/300",None,1),
    ]
    c.executemany("INSERT OR IGNORE INTO playlists (id,name,description,cover,owner_id,is_public) VALUES (?,?,?,?,?,?)", playlists)

    pl_songs = [
        # Top Brasil 2024
        (1,18,1),(1,20,2),(1,24,3),(1,22,4),(1,16,5),(1,6,6),(1,15,7),
        # Funk Hits
        (2,16,1),(2,17,2),(2,18,3),(2,19,4),(2,20,5),
        # Sertanejo Raiz
        (3,21,1),(3,22,2),(3,23,3),(3,24,4),(3,25,5),
        # Pagode & Samba
        (4,26,1),(4,27,2),(4,28,3),(4,29,4),(4,30,5),(4,34,6),
        # Pop Mundial
        (5,1,1),(5,2,2),(5,3,3),(5,4,4),(5,5,5),(5,6,6),(5,7,7),(5,8,8),
        # Workout
        (6,8,1),(6,11,2),(6,12,3),(6,14,4),(6,16,5),(6,18,6),
        # Chill
        (7,7,1),(7,9,2),(7,13,3),(7,27,4),(7,32,5),(7,23,6),
        # Novidades
        (8,5,1),(8,6,2),(8,3,3),(8,15,4),(8,20,5),(8,18,6),
    ]
    c.executemany("INSERT OR IGNORE INTO playlist_songs (playlist_id,song_id,position) VALUES (?,?,?)", pl_songs)

    events = [
        ("The Weeknd After Hours Tour","The Weeknd","Allianz Parque","São Paulo","2025-03-15","R$ 380","https://picsum.photos/seed/ev1/400/200","#"),
        ("Lollapalooza Brasil 2025","Vários Artistas","Autódromo de Interlagos","São Paulo","2025-03-28","R$ 695","https://picsum.photos/seed/ev2/400/200","#"),
        ("Rock in Rio 2025","Vários Artistas","Cidade do Rock","Rio de Janeiro","2025-09-19","R$ 750","https://picsum.photos/seed/ev3/400/200","#"),
        ("Gusttavo Lima Ao Vivo","Gusttavo Lima","Estádio Mané Garrincha","Brasília","2025-04-12","R$ 120","https://picsum.photos/seed/ev4/400/200","#"),
        ("Anitta — Funk Generation Tour","Anitta","Jeunesse Arena","Rio de Janeiro","2025-05-03","R$ 280","https://picsum.photos/seed/ev5/400/200","#"),
        ("Festival Axé Music","Ivete, Claudinha, Bell","Parque de Exposições","Salvador","2025-06-20","R$ 160","https://picsum.photos/seed/ev6/400/200","#"),
    ]
    c.executemany("INSERT OR IGNORE INTO events (name,artist,venue,city,date,price,cover,tickets_url) VALUES (?,?,?,?,?,?,?,?)", events)

    # Demo user
    c.execute("INSERT OR IGNORE INTO users (id,username,email,password_hash,name,avatar_color) VALUES (1,'demo','demo@spotifake.com',?,?,?)",
              (hash_pw('demo123'), 'Usuário Demo', '#1db954'))

    conn.commit()

# ── User helpers ──────────────────────────────────
def create_user(username, email, password, name):
    conn = get_db()
    try:
        colors = ['#1db954','#e91e8c','#856cda','#ff8c00','#0d73ec','#e8142e']
        color = random.choice(colors)
        conn.execute("INSERT INTO users (username,email,password_hash,name,avatar_color) VALUES (?,?,?,?,?)",
                     (username.lower(), email.lower(), hash_pw(password), name, color))
        conn.commit()
        user = conn.execute("SELECT * FROM users WHERE username=?", (username.lower(),)).fetchone()
        _add_notification(conn, user['id'], f"🎉 Bem-vindo ao Spotifake, {name}! Explore músicas, playlists e muito mais.")
        conn.commit()
        return dict(user), None
    except Exception as e:
        return None, "Usuário ou email já cadastrado"
    finally:
        conn.close()

def login_user(username, password):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username=? AND password_hash=?",
                        (username.lower(), hash_pw(password))).fetchone()
    conn.close()
    return dict(user) if user else None

def get_user(user_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None

def update_profile(user_id, name, bio, avatar_color):
    conn = get_db()
    conn.execute("UPDATE users SET name=?, bio=?, avatar_color=? WHERE id=?", (name, bio, avatar_color, user_id))
    conn.commit()
    conn.close()

# ── Song helpers ──────────────────────────────────
def get_songs():
    conn = get_db()
    rows = conn.execute("SELECT * FROM songs ORDER BY plays DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_song(sid):
    conn = get_db()
    row = conn.execute("SELECT * FROM songs WHERE id=?", (sid,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_charts():
    conn = get_db()
    rows = conn.execute("SELECT * FROM songs ORDER BY plays DESC LIMIT 50").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def search_all(q):
    conn = get_db()
    like = f'%{q}%'
    songs = [dict(r) for r in conn.execute("SELECT * FROM songs WHERE title LIKE ? OR artist LIKE ? OR genre LIKE ? LIMIT 20",(like,like,like)).fetchall()]
    playlists = [dict(r) for r in conn.execute("SELECT * FROM playlists WHERE name LIKE ? AND is_public=1 LIMIT 10",(like,)).fetchall()]
    conn.close()
    return {'songs': songs, 'playlists': playlists}

def get_radio(song_id):
    conn = get_db()
    song = conn.execute("SELECT genre FROM songs WHERE id=?", (song_id,)).fetchone()
    rows = []
    if song:
        rows = conn.execute("SELECT * FROM songs WHERE genre=? AND id!=? ORDER BY RANDOM() LIMIT 8", (song['genre'], song_id)).fetchall()
        if len(rows) < 4:
            extra = conn.execute("SELECT * FROM songs WHERE id!=? ORDER BY RANDOM() LIMIT 6", (song_id,)).fetchall()
            rows = list(rows) + list(extra)
    conn.close()
    return [dict(r) for r in rows[:8]]

# ── Playlist helpers ──────────────────────────────
def get_playlists():
    conn = get_db()
    rows = conn.execute("SELECT * FROM playlists WHERE is_public=1 AND owner_id IS NULL ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_playlist(pid):
    conn = get_db()
    pl = conn.execute("SELECT * FROM playlists WHERE id=?", (pid,)).fetchone()
    if not pl:
        conn.close(); return None
    songs = conn.execute('''
        SELECT s.* FROM songs s
        JOIN playlist_songs ps ON ps.song_id = s.id
        WHERE ps.playlist_id=? ORDER BY ps.position
    ''', (pid,)).fetchall()
    conn.close()
    result = dict(pl)
    result['songs'] = [dict(s) for s in songs]
    return result

def get_user_playlists(user_id):
    conn = get_db()
    rows = conn.execute("SELECT * FROM playlists WHERE owner_id=? ORDER BY created_at DESC", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_playlist(user_id, name, description=''):
    covers = [f"https://picsum.photos/seed/upl{random.randint(1,99)}/300/300"]
    conn = get_db()
    conn.execute("INSERT INTO playlists (name,description,cover,owner_id,is_public) VALUES (?,?,?,?,1)",
                 (name, description, covers[0], user_id))
    conn.commit()
    pid = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return pid

def add_to_playlist(playlist_id, song_id, user_id):
    conn = get_db()
    pl = conn.execute("SELECT owner_id FROM playlists WHERE id=?", (playlist_id,)).fetchone()
    if not pl or pl['owner_id'] != user_id:
        conn.close(); return False
    pos = (conn.execute("SELECT MAX(position) FROM playlist_songs WHERE playlist_id=?", (playlist_id,)).fetchone()[0] or 0) + 1
    try:
        conn.execute("INSERT INTO playlist_songs (playlist_id,song_id,position) VALUES (?,?,?)", (playlist_id, song_id, pos))
        conn.commit()
    except: pass
    conn.close(); return True

# ── Likes ─────────────────────────────────────────
def toggle_like(user_id, song_id):
    conn = get_db()
    exists = conn.execute("SELECT 1 FROM likes WHERE user_id=? AND song_id=?", (user_id, song_id)).fetchone()
    if exists:
        conn.execute("DELETE FROM likes WHERE user_id=? AND song_id=?", (user_id, song_id))
        liked = False
    else:
        conn.execute("INSERT INTO likes (user_id, song_id) VALUES (?,?)", (user_id, song_id))
        liked = True
    conn.commit()
    conn.close()
    return liked

def get_liked_songs(user_id):
    conn = get_db()
    rows = conn.execute('''SELECT s.* FROM songs s JOIN likes l ON l.song_id=s.id WHERE l.user_id=? ORDER BY l.liked_at DESC''', (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_user_likes(user_id):
    conn = get_db()
    rows = conn.execute("SELECT song_id FROM likes WHERE user_id=?", (user_id,)).fetchall()
    conn.close()
    return [r['song_id'] for r in rows]

# ── Events ────────────────────────────────────────
def get_events():
    conn = get_db()
    rows = conn.execute("SELECT * FROM events ORDER BY date").fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Notifications ─────────────────────────────────
def _add_notification(conn, user_id, message, ntype='info'):
    conn.execute("INSERT INTO notifications (user_id,message,type) VALUES (?,?,?)", (user_id, message, ntype))

def get_notifications(user_id):
    conn = get_db()
    rows = conn.execute("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def mark_all_read(user_id):
    conn = get_db()
    conn.execute("UPDATE notifications SET read=1 WHERE user_id=?", (user_id,))
    conn.commit()
    conn.close()

def unread_count(user_id):
    conn = get_db()
    n = conn.execute("SELECT COUNT(*) FROM notifications WHERE user_id=? AND read=0", (user_id,)).fetchone()[0]
    conn.close()
    return n
