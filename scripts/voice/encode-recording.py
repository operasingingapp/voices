"""Encode a render for the app as it is: its own channels and rate, no dynamics processing, only one fixed gain so
every recording sits at about -20 LUFS (and its peaks under -1 dBFS).   python3 encode-recording.py IN OUT.mp3"""
import re, subprocess, sys
src, out = sys.argv[1], sys.argv[2]
r = subprocess.run(['ffmpeg', '-nostdin', '-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1])
peak = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
gain = min(-20 - I, -1 - peak)
subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', src, '-af', f'volume={gain:.2f}dB', '-c:a', 'libmp3lame', '-b:a', '160k', out], check=True)
print(out, f'I {I:.1f} LUFS, peak {peak:.1f}, gain {gain:+.1f} dB')
