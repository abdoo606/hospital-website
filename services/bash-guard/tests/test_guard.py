import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/(name+'.py'))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
m=load('guard');installer=load('install')
class GuardTests(unittest.TestCase):
    def test_blocked_matrix(self):
        commands=['rm -rf /tmp/demo','rm -fr /tmp/demo','rm -R -f /tmp/demo','sudo /bin/rm --recursive --force x','echo hi && rm -rf x','git push --force origin HEAD','git -C repo push -f origin main','git push --force-with-lease','git push origin +HEAD:main',"sqlite3 app.db 'DROP TABLE users;'",'psql -c "TRUNCATE users;"',"sqlite3 app.db 'DELETE FROM users;'",'bash -c "rm -rf x"',"sqlite3 x 'DELETE FROM users; DELETE FROM logs WHERE id=1;'",'sqlite3 x "DELETE FROM users /* WHERE id=1 */;"', 'sqlite3 x "DELETE FROM users -- WHERE id=1"']
        for c in commands:
            with self.subTest(command=c): self.assertTrue(m.reasons(c),c)
    def test_safe_matrix(self):
        for c in ['pwd','ls -la','npm test','git status','git push origin HEAD','rm file.txt','rm -r folder','rm -- -rf',"sqlite3 x 'SELECT * FROM users;'", "sqlite3 x 'DELETE FROM users WHERE id=1;'",'echo hello','python3 -m unittest']:
            with self.subTest(command=c): self.assertFalse(m.reasons(c),c)
    def test_invalid_quotes(self):self.assertTrue(m.reasons("echo '"))
    def invoke(self,payload,home):
        return subprocess.run(['python3',str(ROOT/'guard.py')],input=json.dumps(payload),text=True,capture_output=True,env={**os.environ,'HOME':home})
    def test_block_and_private_log(self):
        with tempfile.TemporaryDirectory() as home:
            p=self.invoke({'tool_name':'Bash','tool_input':{'command':'rm -rf x'},'cwd':'/test'},home)
            self.assertEqual(p.returncode,2);self.assertIn('Blocked',p.stderr)
            f=Path(home)/'.claude/hooks/blocked.log';row=json.loads(f.read_text())
            self.assertEqual(row['project_path'],'/test');self.assertEqual(row['command'],'rm -rf x');self.assertIn('timestamp',row)
            self.assertEqual(f.stat().st_mode&0o777,0o600)
    def test_safe_no_log(self):
        with tempfile.TemporaryDirectory() as home:
            self.assertEqual(self.invoke({'tool_name':'Bash','tool_input':{'command':'git status'}},home).returncode,0)
            self.assertFalse((Path(home)/'.claude').exists())
    def test_other_tool(self):
        with tempfile.TemporaryDirectory() as home:self.assertEqual(self.invoke({'tool_name':'Read'},home).returncode,0)
    def test_bad_payload(self):
        with tempfile.TemporaryDirectory() as home:self.assertEqual(self.invoke({'tool_name':'Bash','tool_input':None},home).returncode,2)
    def test_install_merge_idempotent(self):
        with tempfile.TemporaryDirectory() as home:
            root=Path(home)/'.claude';root.mkdir();s=root/'settings.json';s.write_text('{"model":"existing","hooks":{"Stop":[]}}')
            installer.install(home);installer.install(home);d=json.loads(s.read_text())
            self.assertEqual(d['model'],'existing');self.assertEqual(d['hooks']['Stop'],[]);self.assertEqual(len(d['hooks']['PreToolUse']),1)
            self.assertEqual(json.loads((root/'settings.before-destructive-guard.json').read_text())['model'],'existing')
    def test_invalid_settings_untouched(self):
        with tempfile.TemporaryDirectory() as home:
            root=Path(home)/'.claude';root.mkdir();s=root/'settings.json';s.write_text('INVALID')
            with self.assertRaises(ValueError):installer.install(home)
            self.assertEqual(s.read_text(),'INVALID')
    def test_where_literal_not_clause(self):
        self.assertNotIn('WHERE',m.sql_code("DELETE FROM users RETURNING 'WHERE';"))

if __name__=='__main__':unittest.main()
