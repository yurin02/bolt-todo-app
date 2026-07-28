import type { Todo, TodoInput } from '@/types';

/**
 * Storage abstraction layer.
 *
 * All persistence logic is contained here so the underlying mechanism
 * (localStorage today) can be swapped for another adapter (e.g. Supabase,
 * IndexedDB) without touching the rest of the app.
 *
 * Implement the `TodoStorage` interface and replace `storage` below.
 */

export interface TodoStorage {
  list(): Todo[];
  get(id: string): Todo | undefined;
  create(input: TodoInput): Todo;
  update(id: string, input: Partial<TodoInput>): Todo | undefined;
  toggle(id: string): Todo | undefined;
  remove(id: string): void;
  clear(): void;
}

const STORAGE_KEY = 'todos';

function normalizeTodo(raw: unknown): Todo {
  const t = (raw ?? {}) as Partial<Todo>;
  return {
    id: t.id ?? '',
    title: t.title ?? '',
    description: t.description ?? '',
    dueDate: t.dueDate ?? '',
    dueTime: t.dueTime ?? '',
    importance: t.importance ?? 3,
    category: t.category ?? '私用',
    tags: Array.isArray(t.tags) ? t.tags : [],
    source: t.source ?? 'web',
    completed: t.completed ?? false,
    createdAt: t.createdAt ?? Date.now(),
    updatedAt: t.updatedAt ?? Date.now(),
  };
}

function readAll(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as unknown[]).map(normalizeTodo)
      : [];
  } catch {
    return [];
  }
}

function writeAll(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

class LocalStorageTodoStorage implements TodoStorage {
  list(): Todo[] {
    return readAll().sort((a, b) => a.createdAt - b.createdAt);
  }

  get(id: string): Todo | undefined {
    return readAll().find((t) => t.id === id);
  }

  create(input: TodoInput): Todo {
    const now = Date.now();
    const todo: Todo = {
      id: makeId(),
      title: input.title.trim(),
      description: input.description.trim(),
      dueDate: input.dueDate,
      dueTime: input.dueTime ?? '',
      importance: input.importance ?? 3,
      category: input.category ?? '私用',
      tags: input.tags ?? [],
      source: input.source ?? 'web',
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    const todos = readAll();
    todos.push(todo);
    writeAll(todos);
    return todo;
  }

  update(id: string, input: Partial<TodoInput>): Todo | undefined {
    const todos = readAll();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    const updated: Todo = {
      ...todos[idx],
      ...('title' in input && input.title !== undefined
        ? { title: input.title.trim() }
        : {}),
      ...('description' in input && input.description !== undefined
        ? { description: input.description.trim() }
        : {}),
      ...('dueDate' in input && input.dueDate !== undefined
        ? { dueDate: input.dueDate }
        : {}),
      ...('dueTime' in input && input.dueTime !== undefined
        ? { dueTime: input.dueTime }
        : {}),
      ...('importance' in input && input.importance !== undefined
        ? { importance: input.importance }
        : {}),
      ...('category' in input && input.category !== undefined
        ? { category: input.category }
        : {}),
      ...('tags' in input && input.tags !== undefined
        ? { tags: input.tags }
        : {}),
      ...('source' in input && input.source !== undefined
        ? { source: input.source }
        : {}),
      updatedAt: Date.now(),
    };
    todos[idx] = updated;
    writeAll(todos);
    return updated;
  }

  toggle(id: string): Todo | undefined {
    const todos = readAll();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    todos[idx] = {
      ...todos[idx],
      completed: !todos[idx].completed,
      updatedAt: Date.now(),
    };
    writeAll(todos);
    return todos[idx];
  }

  remove(id: string): void {
    const todos = readAll().filter((t) => t.id !== id);
    writeAll(todos);
  }

  clear(): void {
    writeAll([]);
  }
}

export const storage: TodoStorage = new LocalStorageTodoStorage();
