"""Original 150 BPM fanfare and drumroll; local macOS Korean voices mixed in.

Run after generating out/audio/{answer,drum,fanfare}.wav with macOS say.
No samples or music from the reference Reel are used.
"""
from array import array
from pathlib import Path
import math
import random
import wave

ROOT = Path(__file__).resolve().parents[1]
RATE = 44100
random.seed(26)


def add_tone(track, at, duration, freq, gain=.18, kind="horn"):
    offset = int(at * RATE)
    length = int(duration * RATE)
    for i in range(length):
        if offset + i >= len(track):
            break
        t = i / RATE
        env = min(1, t / .012) * min(1, (duration - t) / .055)
        phase = 2 * math.pi * freq * t
        if kind == "horn":
            value = (math.sin(phase) + .4 * math.sin(phase * 2) + .22 * math.sin(phase * 3)) * env
        elif kind == "kick":
            value = math.sin(2 * math.pi * (48 * t + 1.8 * (1 - math.exp(-t * 40)))) * math.exp(-t * 19)
        elif kind == "snare":
            value = (random.uniform(-1, 1) * .8 + math.sin(phase) * .2) * math.exp(-t * 25)
        elif kind == "hat":
            value = random.uniform(-1, 1) * math.exp(-t * 100)
        else:
            value = math.sin(phase) * env
        track[offset + i] += value * gain


def voice(track, file, at, gain=.7):
    with wave.open(str(ROOT / "out/audio" / file), "rb") as wav:
        assert wav.getframerate() == RATE and wav.getnchannels() == 1
        samples = array('h', wav.readframes(wav.getnframes()))
    offset = round(at * RATE)
    for i, sample in enumerate(samples):
        if offset + i >= len(track):
            break
        track[offset + i] += sample / 32768 * gain


def dance(track, start, beats):
    # Deliberately overexcited, original major-key brass hook.
    melody = [67, 67, 72, 76, 74, 72, 67, 64, 67, 67, 72, 79, 76, 74, 72, 72]
    for beat in range(beats):
        at = start + beat * .4
        midi = melody[beat % len(melody)]
        add_tone(track, at, .24 if beat % 4 != 3 else .35, 440 * 2 ** ((midi - 69) / 12), .15)
        add_tone(track, at, .30, [130.81, 130.81, 174.61, 196][(beat // 4) % 4], .11, "bass")
        add_tone(track, at, .20, 55, .28, "kick")
        if beat % 2:
            add_tone(track, at, .17, 180, .17, "snare")
        for half in [0, .2]:
            add_tone(track, at + half, .07, 8000, .055, "hat")


def write(file, samples):
    # Smooth fixed limiter, no clipping even when speech overlaps the band.
    pcm = array('h', (round(math.tanh(x * 1.2) * 28500) for x in samples))
    with wave.open(str(ROOT / "out/audio" / file), 'wb') as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(RATE); wav.writeframes(pcm.tobytes())


show = array('f', [0]) * round(22.8 * RATE)
for at in [.1, .5, .9, 1.3]:
    add_tone(show, at, .11, 660, .09)
for begin, end in [(1.8, 4.7), (7.0, 9.8)]:
    at = begin
    while at < end:
        add_tone(show, at, .1, 190, .11 + .07 * (at - begin) / (end - begin), 'snare')
        at += .1 if at < end - .8 else .055
voice(show, 'drum.wav', 2.0, .9)
voice(show, 'answer.wav', 5.0, 1.1)
voice(show, 'drum.wav', 7.1, .9)
dance(show, 10.0, 32)
voice(show, 'fanfare.wav', 10.0, .9)
voice(show, 'fanfare.wav', 16.4, .7)
write('show.wav', show)
loop = array('f', [0]) * round(6.4 * RATE)
dance(loop, 0, 16)
voice(loop, 'fanfare.wav', 0, .7)
write('dance.wav', loop)
print('Original soundtrack: 22.8 s intro + reveal; 6.4 s dance loop, 150 BPM.')
