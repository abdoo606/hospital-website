import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import Database from 'better-sqlite3';

function fixture(t) {
  const root=mkdtempSync(join(tmpdir(),'migration-test-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const directory=join(root,'migrations');mkdirSync(directory);
  const file=join(root,'db.sqlite');
  const write=(name,sql)=>writeFileSync(join(directory,name),sql);
  const run=()=>spawnSync(process.execPath,['scripts/migrate.mjs',directory],{encoding:'utf8',env:{...process.env,DATABASE_PATH:file}});
  return {root,directory,file,write,run};
}
test('initial migration and second run are idempotent',t=>{
  const f=fixture(t);f.write('0001_initial.sql','CREATE TABLE sample(id INTEGER PRIMARY KEY);');
  assert.equal(f.run().status,0);assert.equal(f.run().status,0);
  const db=new Database(f.file);t.after(()=>db.close());
  assert.equal(db.prepare('SELECT count(*) AS n FROM schema_migrations').get().n,1);
});
test('changed applied migration rejected',t=>{
  const f=fixture(t);f.write('0001_initial.sql','CREATE TABLE sample(id INTEGER);');assert.equal(f.run().status,0);
  f.write('0001_initial.sql','CREATE TABLE different(id INTEGER);');assert.notEqual(f.run().status,0);
});
test('failed migration rolls back schema and ledger',t=>{
  const f=fixture(t);f.write('0001_bad.sql','CREATE TABLE sample(id INTEGER); INVALID SQL;');assert.notEqual(f.run().status,0);
  const db=new Database(f.file);t.after(()=>db.close());
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name='sample'").get().n,0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM schema_migrations').get().n,0);
});
test('duplicate migration numbers rejected',t=>{
  const f=fixture(t);f.write('0001_a.sql','SELECT 1;');f.write('0001_b.sql','SELECT 1;');assert.notEqual(f.run().status,0);
});
test('out of order additions rejected',t=>{
  const f=fixture(t);f.write('0002_a.sql','SELECT 1;');assert.equal(f.run().status,0);
  f.write('0001_b.sql','SELECT 1;');assert.notEqual(f.run().status,0);
});
test('missing applied migration rejected',t=>{
  const f=fixture(t);f.write('0001_a.sql','SELECT 1;');assert.equal(f.run().status,0);
  rmSync(join(f.directory,'0001_a.sql'));assert.notEqual(f.run().status,0);
});
