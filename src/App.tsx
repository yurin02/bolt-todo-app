import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Plus } from 'lucide-react';
import type { Todo, TodoInput } from '@/types';
import { storage } from '@/lib/storage';
import { TodoItem } from '@/components/TodoItem';
import { TodoForm } from '@/components/TodoForm';

type SortTab = 'due' | 'importance' | 'created' | 'completed';

const SORT_TABS: { key: SortTab; label: string }[] = [
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

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [sortTab, setSortTab] = useState<SortTab>('due');

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
    storage.toggle(id);
    refresh();
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
    // due (default) and completed both sort by due date
    return [...list].sort((a, b) => dueTimestamp(a) - dueTimestamp(b));
  }, [todos, sortTab]);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - activeCount;



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

        {/* List */}
        {sorted.length === 0 ? (
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
