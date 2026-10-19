import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('changelog', ROOT / 'changelog.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class GeneratorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name) / 'repo with spaces'
        self.repo.mkdir()
        self.git('init', '-b', 'arena/cbc41b37-hospital-website')
        self.git('config', 'user.name', 'Test Fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.repo), *args], stderr=subprocess.DEVNULL).decode().strip()
    def commit(self, subject):
        self.git('commit', '--allow-empty', '-m', subject)
    def test_all_categories(self):
        for subject, expected in [('feat(api): endpoint','Added'),('fix!: validation','Fixed'),('refactor: simplify','Changed'),('chore: remove legacy','Removed'),('remove: old API','Removed'),('docs: guide','Changed')]:
            self.assertEqual(m.classify(subject)[0], expected)
    def test_no_tag(self):
        self.commit('feat: first'); self.commit('fix: second')
        tag, rows = m.collect(self.repo)
        self.assertIsNone(tag); self.assertEqual(len(rows), 2)
    def test_tag_excludes_older(self):
        self.commit('feat: old'); self.git('tag', 'v1'); self.commit('fix: new')
        tag, rows = m.collect(self.repo)
        self.assertEqual(tag,'v1'); self.assertEqual([r[1] for r in rows],['fix: new'])
    def test_annotated_tag(self):
        self.commit('first'); self.git('tag','-a','v1','-m','release'); self.commit('feat: next')
        self.assertEqual(m.collect(self.repo)[0], 'v1')
    def test_latest_reachable_tag(self):
        self.commit('first'); self.git('tag','v1'); self.commit('second'); self.git('tag','v2'); self.commit('third')
        tag, rows=m.collect(self.repo)
        self.assertEqual(tag,'v2'); self.assertEqual(len(rows),1)
    def test_no_changes(self):
        self.commit('first'); self.git('tag','v1')
        tag, rows=m.collect(self.repo)
        self.assertEqual(rows,[]); self.assertEqual(m.render(tag,rows,'2026-10-19').count('No changes.'),4)
    def test_markdown_escaped(self):
        self.assertEqual(m.escape('<script>[click](x)*'), '&lt;script&gt;\\[click\\](x)\\*')
    def test_unicode_and_shell_text_not_executed(self):
        self.commit('feat: مرحبا $(touch SHOULD_NOT_EXIST)')
        _,rows=m.collect(self.repo)
        self.assertIn('مرحبا',rows[0][1]); self.assertFalse((self.repo/'SHOULD_NOT_EXIST').exists())
    def test_existing_file_preserved(self):
        target=self.repo/'CHANGELOG.md';target.write_text('KEEP')
        with self.assertRaises(ValueError): m.write_output(target,'NEW')
        self.assertEqual(target.read_text(),'KEEP')
    def test_force(self):
        target=self.repo/'CHANGELOG.md';target.write_text('OLD')
        m.write_output(target,'NEW',True);self.assertEqual(target.read_text(),'NEW')
    def test_symlink_rejected(self):
        target=self.repo/'real';target.write_text('KEEP'); link=self.repo/'CHANGELOG.md';link.symlink_to(target)
        with self.assertRaises(ValueError):m.write_output(link,'NEW',True)
        self.assertEqual(target.read_text(),'KEEP')
    def test_empty_repository_error(self):
        with self.assertRaises(subprocess.CalledProcessError):m.collect(self.repo)
    def test_bash_entrypoint(self):
        self.commit('fix: test'); output=self.repo/'CHANGELOG.md'
        r=subprocess.run(['bash',str(ROOT/'changelog.sh'),'--repo',str(self.repo),'--output',str(output),'--date','2026-10-19'],capture_output=True,text=True)
        self.assertEqual(r.returncode,0,r.stderr);self.assertIn('### Fixed',output.read_text())
    def test_bad_date(self):
        self.assertEqual(m.main(['--repo',str(self.repo),'--date','invalid']),1)
    def test_deterministic(self):
        records=[('a'*40,'feat: hello')]
        self.assertEqual(m.render(None,records,'2026-10-19'),m.render(None,records,'2026-10-19'))

if __name__=='__main__': unittest.main()
