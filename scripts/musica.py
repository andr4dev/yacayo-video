"""Música del video, hecha con código (sin muestras ni pistas de terceros): 120 BPM, 44,5 s.

Sigue las escenas de src/constantes.ts: el gancho con un brillo que sube y la moneda que suena en
el segundo 1,5; batería, bajo y acordes desde que entra el celular (3 s); un arpegio mientras se ve
el asistente (16,5–34 s); sin batería en la placa de Gemini (34–39 s), para leerla; y un final que
se apaga en el cierre.

Uso: python3 scripts/musica.py  →  public/music.wav (y, con ffmpeg, public/music.mp3)
"""

import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44_100
BPM = 120
GOLPE = 60 / BPM  # 0,5 s
DURACION = 44.5
N = int(SR * DURACION)

# Momentos (s), los mismos de constantes.ts.
MONEDA = 1.5
ENTRA_CELULAR = 3.0
ASISTENTE = (16.5, 34.0)
PLACA = (34.0, 39.0)
CIERRE = 39.0

# Do mayor: Do – Sol – Lam – Fa, un compás (2 s) cada uno.
ACORDES = [(48, 52, 55), (43, 47, 50), (45, 48, 52), (41, 45, 48)]

t = np.arange(N) / SR
pista = np.zeros(N)


def hz(nota: int) -> float:
    return 440.0 * 2 ** ((nota - 69) / 12)


def poner(senal: np.ndarray, inicio: float, ganancia: float = 1.0) -> None:
    i = int(inicio * SR)
    if i >= N:
        return
    fin = min(N, i + len(senal))
    pista[i:fin] += ganancia * senal[: fin - i]


def env(largo: float, ataque: float, caida: float) -> np.ndarray:
    n = int(largo * SR)
    x = np.arange(n) / SR
    return np.minimum(1.0, x / max(ataque, 1e-4)) * np.exp(-x / caida)


def acorde_en(segundo: float):
    return ACORDES[int(segundo // (4 * GOLPE)) % len(ACORDES)]


def pasa_bajos(x: np.ndarray, corte: float) -> np.ndarray:
    a = np.exp(-2 * np.pi * corte / SR)
    y = np.zeros_like(x)
    acum = 0.0
    for i, v in enumerate(x):
        acum = (1 - a) * v + a * acum
        y[i] = acum
    return y


# --- Colchón de acordes (todo el video, más suave en el gancho) --------------------------------
colchon = np.zeros(N)
compas = 4 * GOLPE
for k in range(int(np.ceil(DURACION / compas))):
    inicio = k * compas
    n = int(compas * 1.15 * SR)
    x = np.arange(n) / SR
    forma = np.minimum(1, x / 0.25) * np.minimum(1, np.maximum(0, (compas * 1.15 - x) / 0.3))
    voz = np.zeros(n)
    for nota in acorde_en(inicio):
        f = hz(nota + 12)
        for armonico in range(1, 6):
            for desafino in (-0.15, 0.15):
                voz += np.sin(2 * np.pi * (f * armonico + desafino) * x) / armonico**1.4
    i = int(inicio * SR)
    fin = min(N, i + n)
    colchon[i:fin] += (voz * forma)[: fin - i]
colchon = pasa_bajos(colchon, 1800)
nivel = np.interp(t, [0, ENTRA_CELULAR, ENTRA_CELULAR + 0.01, DURACION], [0.35, 0.6, 0.55, 0.55])
pista += 0.05 * colchon * nivel

# --- Gancho: brillo que sube y la moneda ---------------------------------------------------------
ruido = np.random.default_rng(7).standard_normal(int(ENTRA_CELULAR * SR))
sube = np.linspace(0, 1, len(ruido)) ** 2.5
brillo = ruido - pasa_bajos(ruido, 2500)
poner(brillo * sube, 0.0, 0.05)
for armonico, ganancia in ((1, 1.0), (2.76, 0.5), (5.4, 0.25)):
    n = int(1.6 * SR)
    x = np.arange(n) / SR
    poner(np.sin(2 * np.pi * 1318.5 * armonico * x) * np.exp(-x / 0.45), MONEDA, 0.12 * ganancia)

# --- Batería: bombo en cada golpe, palmas en 2 y 4, platillo en los contratiempos -------------
def bombo() -> np.ndarray:
    n = int(0.35 * SR)
    x = np.arange(n) / SR
    f = 45 + 95 * np.exp(-x / 0.035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.12)


def palma() -> np.ndarray:
    n = int(0.25 * SR)
    r = np.random.default_rng(3).standard_normal(n)
    r = r - pasa_bajos(r, 900)
    return pasa_bajos(r, 5000) * np.exp(-np.arange(n) / SR / 0.06)


def platillo() -> np.ndarray:
    n = int(0.08 * SR)
    r = np.random.default_rng(5).standard_normal(n)
    return (r - pasa_bajos(r, 7000)) * np.exp(-np.arange(n) / SR / 0.02)


B, P, H = bombo(), palma(), platillo()
golpes = np.arange(0, DURACION, GOLPE)
for g in golpes:
    en_placa = PLACA[0] <= g < PLACA[1]
    if g < ENTRA_CELULAR or en_placa or g >= DURACION - 2.5:
        continue
    numero = int(round(g / GOLPE))
    poner(B, g, 0.55)
    if numero % 2 == 1:
        poner(P, g, 0.22)
    poner(H, g + GOLPE / 2, 0.12)
# El cierre: un bombo fuerte al entrar y uno cada compás.
for g in np.arange(CIERRE, DURACION - 2.5, 4 * GOLPE):
    poner(B, g, 0.6)

# --- Bajo: la raíz del acorde en corcheas ---------------------------------------------------------
for g in np.arange(ENTRA_CELULAR, DURACION - 2.0, GOLPE / 2):
    if PLACA[0] <= g < PLACA[1] and (g - PLACA[0]) % (4 * GOLPE) > 0.01:
        continue  # en la placa, solo una nota por compás
    raiz = hz(acorde_en(g)[0] - 12)
    n = int(0.24 * SR)
    x = np.arange(n) / SR
    nota = (np.sin(2 * np.pi * raiz * x) + 0.3 * np.sin(4 * np.pi * raiz * x)) * env(0.24, 0.005, 0.12)
    poner(nota, g, 0.22)

# --- Arpegio mientras se ve el asistente ----------------------------------------------------------
paso = GOLPE / 2
for j, g in enumerate(np.arange(ASISTENTE[0], ASISTENTE[1], paso)):
    notas = acorde_en(g)
    nota = notas[j % 3] + 24 + (12 if j % 6 >= 3 else 0)
    f = hz(nota)
    n = int(0.3 * SR)
    x = np.arange(n) / SR
    pluck = (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(6 * np.pi * f * x)) * env(0.3, 0.003, 0.09)
    poner(pluck, g, 0.07)

# --- Final: el último acorde que se queda sonando y se apaga ---------------------------------------
apagado = np.interp(t, [0, DURACION - 2.5, DURACION], [1, 1, 0])
pista *= apagado

pista /= np.max(np.abs(pista)) / 0.7  # pico a -3 dB: la música va de fondo
estereo = np.stack([pista, np.roll(pista, int(0.012 * SR))], axis=1)
datos = (np.clip(estereo, -1, 1) * 32767).astype("<i2")

salida = Path(__file__).resolve().parent.parent / "public"
wav = salida / "music.wav"
with wave.open(str(wav), "wb") as archivo:
    archivo.setnchannels(2)
    archivo.setsampwidth(2)
    archivo.setframerate(SR)
    archivo.writeframes(datos.tobytes())
print("✓", wav)

try:
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-b:a", "192k", str(salida / "music.mp3")], check=True)
    wav.unlink()
    print("✓", salida / "music.mp3")
except (FileNotFoundError, subprocess.CalledProcessError):
    print("Sin ffmpeg: queda public/music.wav; conviértelo a music.mp3.")
