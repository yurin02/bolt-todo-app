import type { Category, Todo, TodoInput, TodoSource } from '@/types';
import type { TodoStorage } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type ApiTodo = {
  ID: string;
  Title: string;
  Description: string;
  DueDate: string;
  DueTime: string;
  Importance: number;
  Category: string;
  Tags: string[];
  Source: string;
  Completed: boolean;
  CreatedAt: number;
  UpdatedAt: number;
};

function fromApi(t: ApiTodo): Todo {
  return {
    id: t.ID,
    title: t.Title,
    description: t.Description,
    dueDate: t.DueDate,
    dueTime: t.DueTime,
    importance: t.Importance as Todo['importance'],
    category: t.Category as Category,
    tags: t.Tags,
    source: t.Source as TodoSource,
    completed: t.Completed,
    createdAt: t.CreatedAt,
    updatedAt: t.UpdatedAt,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export class RemoteApiTodoStorage implements TodoStorage {
  async list(): Promise<Todo[]> {
    const data = await request<ApiTodo[]>('/api/js-todos');
    return data.map(fromApi);
  }

  async get(id: string): Promise<Todo | undefined> {
    const todos = await this.list();
    return todos.find((t) => t.id === id);
  }

  async create(input: TodoInput): Promise<Todo> {
    const created = await request<ApiTodo>('/api/js-todos', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return fromApi(created);
  }

  async update(id: string, input: Partial<TodoInput>): Promise<Todo | undefined> {
    const updated = await request<ApiTodo>(`/api/js-todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return fromApi(updated);
  }

  async toggle(id: string): Promise<Todo | undefined> {
    const toggled = await request<ApiTodo>(`/api/js-todos/${id}/toggle`, {
      method: 'POST',
    });
    return fromApi(toggled);
  }

  async remove(id: string): Promise<void> {
    await request<{ deleted: boolean }>(`/api/js-todos/${id}`, { method: 'DELETE' });
  }

  async clear(): Promise<void> {
    const todos = await this.list();
    await Promise.all(todos.map((t) => this.remove(t.id)));
  }
}
