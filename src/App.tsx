import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Plus, PartyPopper } from 'lucide-react';
import type { Todo, TodoInput } from '@/types';
import { storage } from '@/lib/storage';
import { TodoItem } from '@/components/TodoItem';
import { TodoForm } from '@/components/TodoForm';

type SortTab = 'today' | 'due' | 'importance' | 'created' | 'completed';

const SORT_TABS: { key: SortTab; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'due', label: '期日順' },
  { key: 'importance', label: '重要度順' },
  { key: 'created', label: '作成日順' },
  { key: 'completed', label: '完了' },
];

function dueTimestamp(todo: Todo): number {
  if (!todo.dueDate) return Number.MAX_SAFE_INTEGER;
  const due = new Date(todo.dueDate + 'T' + (todo.dueTime || '23:59') + ':00');
  const t = due.getTime();
  return isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTodayDate(): string {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function timeUntil(time: string): string {
  const now = new Date();
  const target = new Date();
  const [h, m] = time.split(':').map(Number);
  target.setHours(h, m, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return '';
  const totalMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0 && mins > 0) return `あと${hours}時間${mins}分`;
  if (hours > 0) return `あと${hours}時間`;
  return `あと${mins}分`;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [sortTab, setSortTab] = useState<SortTab>('today');
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());

  useEffect(() => {
    setTodos(storage.list());
  }, []);

  const refresh = () => setTodos(storage.list());

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (todo: Todo) => {
    setEditing(todo);
    setFormOpen(true);
  };

  const handleSubmit = (input: TodoInput) => {
    if (editing) {
      storage.update(editing.id, input);
    } else {
      storage.create(input);
    }
    setFormOpen(false);
    setEditing(null);
    refresh();
  };

  const handleToggle = (id: string) => {
    if (fadingOut.has(id)) return;
    const todo = todos.find((t) => t.id === id);
    if (todo && !todo.completed && sortTab === 'today') {
      setFadingOut((prev) => new Set(prev).add(id));
      setTimeout(() => {
        storage.toggle(id);
        refresh();
        setFadingOut((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);
    } else {
      storage.toggle(id);
      refresh();
    }
  };

  const handleDelete = (id: string) => {
    storage.remove(id);
    refresh();
  };

  const sorted = useMemo(() => {
    const list = todos.filter((t) =>
      sortTab === 'completed' ? t.completed : !t.completed,
    );
    if (sortTab === 'importance') {
      return [...list].sort((a, b) => {
        if (b.importance !== a.importance) return b.importance - a.importance;
        return dueTimestamp(a) - dueTimestamp(b);
      });
    }
    if (sortTab === 'created') {
      return [...list].sort((a, b) => b.createdAt - a.createdAt);
    }
    return [...list].sort((a, b) => dueTimestamp(a) - dueTimestamp(b));
  }, [todos, sortTab]);

  const todayData = useMemo(() => {
    if (sortTab !== 'today') return null;
    const today = todayString();
    const todayTodos = todos.filter((t) => t.dueDate === today);
    const timed = [...todayTodos]
      .filter((t) => t.dueTime)
      .sort((a, b) => a.dueTime.localeCompare(b.dueTime));
    const untimed = todayTodos.filter((t) => !t.dueTime);
    const completed = todayTodos.filter((t) => t.completed).length;
    const total = todayTodos.length;
    const allDone = total > 0 && completed === total;
    const nextUp = timed.find((t) => !t.completed);
    return { timed, untimed, total, completed, allDone, nextUp };
  }, [todos, sortTab]);

  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#dbeafe] to-[#bfdbfe]">
      {/* Header */}
      <header className="mx-auto max-w-2xl px-5 pt-12 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#1e40af] drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]">
              <span className="bg-gradient-to-r from-[#1e40af] via-blue-500 to-sky-400 bg-clip-text text-transparent">
                Todo List
              </span>
            </h1>
            <p className="mt-1 text-sm font-medium text-blue-700/70">
              {activeCount} 件残り
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-[#1e40af] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800 active:scale-[0.98]"
          >
            <Plus size={18} />
            新しいTodoを追加
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-6 pb-12">
        {/* Sort tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSortTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                sortTab === tab.key
                  ? 'bg-[#1e40af] text-white shadow-sm'
                  : 'border border-blue-200 bg-white text-[#1e40af] hover:bg-blue-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Today view */}
        {sortTab === 'today' && todayData ? (
          todayData.total === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-white/40 py-20 text-center">
              <ClipboardList size={48} className="text-blue-300" />
              <p className="mt-4 text-base font-medium text-blue-700/60">
                今日の予定はありません
              </p>
            </div>
          ) : todayData.allDone ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100 py-20 text-center">
              <PartyPopper size={48} className="text-emerald-500" />
              <p className="mt-4 text-lg font-bold text-emerald-700">
                今日のタスク完了！お疲れさまでした 🎉
              </p>
              <p className="mt-2 text-sm text-emerald-600/70">
                今日 {formatTodayDate()} ・ {todayData.total}件すべて完了
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-bold text-[#1e40af]">
                    今日 {formatTodayDate()}
                  </span>
                  <span className="text-blue-300">・</span>
                  <span className="text-slate-600">
                    Todo {todayData.total}件
                  </span>
                  <span className="text-blue-300">・</span>
                  <span className="text-slate-600">
                    完了{' '}
                    <span className="font-semibold text-emerald-600">
                      {todayData.completed}
                    </span>
                    /{todayData.total}
                  </span>
                  {todayData.nextUp && (
                    <>
                      <span className="text-blue-300">・</span>
                      <span className="text-slate-600">
                        次の予定:{' '}
                        <span className="font-semibold text-[#1e40af]">
                          {todayData.nextUp.dueTime}
                        </span>{' '}
                        {todayData.nextUp.title}
                        {timeUntil(todayData.nextUp.dueTime) && (
                          <span className="text-blue-500">
                            {' '}
                            ({timeUntil(todayData.nextUp.dueTime)})
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Timed items */}
              {todayData.timed
                .filter((t) => !t.completed || fadingOut.has(t.id))
                .map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    fading={fadingOut.has(todo.id)}
                  />
                ))}

              {/* Untimed items */}
              {todayData.untimed.filter(
                (t) => !t.completed || fadingOut.has(t.id),
              ).length > 0 && (
                <>
                  <div className="pt-2 pb-1">
                    <h2 className="text-sm font-semibold text-blue-700/60">
                      時間指定なし
                    </h2>
                  </div>
                  {todayData.untimed
                    .filter((t) => !t.completed || fadingOut.has(t.id))
                    .map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={handleToggle}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        fading={fadingOut.has(todo.id)}
                      />
                    ))}
                </>
              )}
            </div>
          )
        ) : (
          /* Normal view */
          sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-white/40 py-20 text-center">
              {todos.length === 0 ? (
                <>
                  <ClipboardList size={48} className="text-blue-300" />
                  <p className="mt-4 text-base font-medium text-blue-700/60">
                    まだTodoがありません
                  </p>
                  <p className="mt-1 text-sm text-blue-700/50">
                    右上のボタンから追加してみましょう
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 size={48} className="text-blue-300" />
                  <p className="mt-4 text-base font-medium text-blue-700/60">
                    この条件に該当するTodoはありません
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sorted.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
        )}
      </main>

      <TodoForm
        open={formOpen}
        editingId={editing?.id}
        initial={
          editing
            ? {
                title: editing.title,
                description: editing.description,
                dueDate: editing.dueDate,
                dueTime: editing.dueTime,
                importance: editing.importance,
                category: editing.category,
                tags: editing.tags,
                source: editing.source,
              }
            : undefined
        }
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
