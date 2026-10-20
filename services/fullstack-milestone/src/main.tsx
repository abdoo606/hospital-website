import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
type Task = { id: string; title: string; description: string; status: string };
async function api(path: string, method = "GET", body?: unknown) {
  const r = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = r.status === 204 ? null : await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}
function App() {
  const [user, setUser] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [signup, setSignup] = useState(false),
    [tasks, setTasks] = useState<Task[]>([]),
    [current, setCurrent] = useState<Task | null>(null),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [status, setStatus] = useState("todo");
  async function refresh() {
    setLoading(true);
    try {
      setTasks(await api("/tasks"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    api("/me")
      .then(async (u) => {
        setUser(u);
        await refresh();
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function clear() {
    setCurrent(null);
    setTitle("");
    setDescription("");
    setStatus("todo");
  }
  return (
    <main>
      <header>
        <strong>◈ MILESTONE</strong>
        <span>Independent implementation · review build</span>
      </header>
      <section className="intro">
        <p className="eyebrow">YOUR WORK, ORGANIZED</p>
        <h1>
          A little clarity.
          <br />A lot of progress.
        </h1>
        <p>A private workspace for your next milestone.</p>
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading && !user ? (
        <p role="status">Loading your session…</p>
      ) : !user ? (
        <section className="panel auth">
          <h2>{signup ? "Create your workspace" : "Welcome back"}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void act(async () => {
                setUser(
                  await api("/auth/" + (signup ? "signup" : "login"), "POST", {
                    email: data.get("email"),
                    password: data.get("password"),
                  }),
                );
                await refresh();
              });
            }}
          >
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={12}
                maxLength={128}
                required
              />
            </label>
            <small>
              Use at least 12 characters. Demo: do not reuse a real password.
            </small>
            <button disabled={busy}>
              {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
            </button>
          </form>
          <button
            className="text"
            disabled={busy}
            onClick={() => {
              setSignup(!signup);
              setError("");
            }}
          >
            {signup
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </section>
      ) : (
        <>
          <nav>
            <span>{user.email}</span>
            <button
              disabled={busy}
              className="text"
              onClick={() =>
                void act(async () => {
                  await api("/auth/logout", "POST", {});
                  setUser(null);
                  setTasks([]);
                  clear();
                })
              }
            >
              Sign out
            </button>
          </nav>
          <div className="workspace">
            <section className="panel">
              <div className="row">
                <h2>Your tasks</h2>
                <button
                  disabled={busy}
                  className="text"
                  onClick={() => void act(refresh)}
                >
                  Refresh
                </button>
              </div>
              {loading ? (
                <p role="status">Loading tasks…</p>
              ) : tasks.length === 0 ? (
                <div className="empty">
                  Nothing here yet.
                  <br />
                  <small>Create your first task to get started.</small>
                </div>
              ) : (
                tasks.map((t) => (
                  <button
                    disabled={busy}
                    className={
                      "task " + (current?.id === t.id ? "selected" : "")
                    }
                    key={t.id}
                    onClick={() =>
                      void act(async () => {
                        const item = await api("/tasks/" + t.id);
                        setCurrent(item);
                        setTitle(item.title);
                        setDescription(item.description);
                        setStatus(item.status);
                      })
                    }
                  >
                    <b>{t.title}</b>
                    <span className="badge">{t.status}</span>
                  </button>
                ))
              )}
            </section>
            <section className="panel">
              <div className="row">
                <h2>{current ? "Task details" : "New task"}</h2>
                {current && (
                  <button disabled={busy} className="text" onClick={clear}>
                    + New task
                  </button>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(async () => {
                    const item = await api(
                      "/tasks" + (current ? "/" + current.id : ""),
                      current ? "PUT" : "POST",
                      { title, description, status },
                    );
                    setCurrent(item);
                    await refresh();
                  });
                }}
              >
                <label>
                  Title
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={160}
                    required
                  />
                </label>
                <label>
                  Description
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={5000}
                    rows={5}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="todo">To do</option>
                    <option value="doing">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </label>
                <button disabled={busy}>
                  {busy ? "Saving…" : current ? "Save changes" : "Create task"}
                </button>
              </form>
              {current && (
                <button
                  className="danger text"
                  disabled={busy}
                  onClick={() => {
                    if (confirm("Delete this task permanently?"))
                      void act(async () => {
                        await api("/tasks/" + current.id, "DELETE", {});
                        clear();
                        await refresh();
                      });
                  }}
                >
                  Delete task
                </button>
              )}
            </section>
          </div>
        </>
      )}
      <footer>
        React + TypeScript · Node API · PostgreSQL-compatible storage
        <br />
        Public demonstration — not a commissioned client system.
      </footer>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
