"""Install user-level hook, preserving other settings and an original backup."""
import json
from pathlib import Path
import shlex
import shutil
import tempfile
import os


def install(home):
    root = Path(home)/'.claude'
    root.mkdir(parents=True, exist_ok=True)
    settings = root/'settings.json'
    original = settings.read_text() if settings.exists() else '{}'
    data = json.loads(original)
    events = data.setdefault('hooks', {}).setdefault('PreToolUse', [])
    if not isinstance(events, list):
        raise ValueError('PreToolUse must be an array')
    dest = root/'hooks'/'destructive_guard.py'
    command = 'python3 '+shlex.quote(str(dest))
    if not any(h.get('command') == command for e in events for h in e.get('hooks', [])):
        events.append({'matcher':'Bash','hooks':[{'type':'command','command':command}]})
    dest.parent.mkdir(parents=True, exist_ok=True)
    if settings.exists():
        backup = root/'settings.before-destructive-guard.json'
        if not backup.exists():
            with backup.open('x') as out:
                os.chmod(backup,0o600)
                out.write(original)
    shutil.copyfile(Path(__file__).with_name('guard.py'), dest)
    fd, tmp = tempfile.mkstemp(dir=root, prefix='settings-')
    try:
        with os.fdopen(fd, 'w') as out:
            json.dump(data,out,indent=2);out.write('\n')
        os.replace(tmp, settings)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)
    print('Installed:',dest)

if __name__=='__main__':
    install(Path.home())
