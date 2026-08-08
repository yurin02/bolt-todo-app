import { useState } from 'react';
import { Calendar, Check, Clock, Pencil, Trash2 } from 'lucide-react';
import type { Category, Importance, Todo } from '@/types';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  fading?: boolean;
}

function formatDueLabel(date: string, time: string): string {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  if (isNaN(d.getTime())) return date;
  const datePart = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return time ? `${datePart} ${time}` : datePart;
}

function isExpired(todo: Todo): boolean {
  if (!todo.dueDate || todo.completed) return false;
  const due = new Date(
    todo.dueDate + 'T' + (todo.dueTime || '23:59') + ':00',
  );
  if (isNaN(due.getTime())) return false;
  return due.getTime() < Date.now();
}

const CATEGORY_STYLES: Record<Category, string> = {
  本業: 'bg-blue-100 text-blue-800',
  物販: 'bg-yellow-100 text-yellow-800',
  エンジニア: 'bg-green-100 text-green-800',
  私用: 'bg-gray-100 text-gray-700',
};

const IMPORTANCE_COLORS: Record<Importance, string[]> = {
  1: ['bg-slate-300', 'bg-slate-300', 'bg-slate-300', 'bg-slate-300'],
  2: ['bg-yellow-400', 'bg-yellow-400', 'bg-slate-300', 'bg-slate-300'],
  3: ['bg-orange-400', 'bg-orange-400', 'bg-orange-400', 'bg-slate-300'],
  4: ['bg-rose-500', 'bg-rose-500', 'bg-rose-500', 'bg-rose-500'],
};

const URL_RE = /(https?:\/\/[^\s]+)/g;

function renderDescription(text: string): React.ReactNode {
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (URL_RE.test(part)) {
      URL_RE.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function TodoItem({ todo, onToggle, onEdit, onDelete, fading }: Props) {
  const expired = isExpired(todo);
  const hasDue = Boolean(todo.dueDate);
  const dots = IMPORTANCE_COLORS[todo.importance] ?? IMPORTANCE_COLORS[3];
  const [expanded, setExpanded] = useState(false);
  const description = todo.description ?? '';
  const lineCount = description.split('\n').length;
  const isLong = lineCount > 3;

  return (
    <div
      className={`flex items-stretch gap-3 rounded-2xl p-4 shadow-sm transition hover:shadow-md ${
        fading ? 'duration-300 opacity-0' : ''
      } ${
        todo.completed
          ? 'bg-emerald-50'
          : expired
            ? 'bg-white ring-2 ring-rose-400'
            : 'bg-white'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 transition ${
          todo.completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 bg-white hover:border-emerald-400'
        }`}
        aria-label={todo.completed ? '未完了にする' : '完了にする'}
      >
        {todo.completed && <Check size={15} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {dots.map((color, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full ${color}`} />
            ))}
          </div>
          <h3
            className={`font-semibold leading-snug ${
              todo.completed ? 'text-slate-400 line-through' : 'text-slate-800'
            }`}
          >
            {todo.title}
            <span
              className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium align-middle ${
                CATEGORY_STYLES[todo.category] ?? CATEGORY_STYLES['私用']
              }`}
            >
              {todo.category}
            </span>
          </h3>
        </div>
        {todo.description && (
          <div className="mt-1">
            <p
              className={`whitespace-pre-wrap text-sm leading-relaxed ${
                todo.completed ? 'text-slate-400' : 'text-slate-500'
              } ${isLong && !expanded ? 'line-clamp-3' : ''}`}
            >
              {renderDescription(description)}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {expanded ? '閉じる' : '続きを読む'}
              </button>
            )}
          </div>
        )}
        {hasDue && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                expired
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <Calendar size={12} />
              {formatDueLabel(todo.dueDate, todo.dueTime)}
            </span>
            {todo.dueTime && !expired && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                <Clock size={12} />
                {todo.dueTime}
              </span>
            )}
            {expired && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white">
                期限切れ
              </span>
            )}
          </div>
        )}
        {(todo.tags?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {(todo.tags ?? []).map((tag) =>
              /^https?:\/\//.test(tag) ? (
                <a
                  key={tag}
                  href={tag}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 cursor-pointer hover:text-blue-800"
                >
                  #{tag}
                </a>
              ) : (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                >
                  #{tag}
                </span>
              ),
            )}
          </div>
        )}
      </div>

      {/* Action buttons (vertical) */}
      <div className="flex flex-none flex-col items-stretch gap-2">
        <button
          onClick={() => onEdit(todo)}
          className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          aria-label="編集"
        >
          <Pencil size={13} />
          編集
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="flex items-center justify-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-600"
          aria-label="削除"
        >
          <Trash2 size={13} />
          削除
        </button>
      </div>
    </div>
  );
}
