export type Importance = 1 | 2 | 3 | 4;

export type Category = '本業' | '物販' | 'エンジニア' | '私用';

export type TodoSource = 'web' | 'line';

export interface Todo {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string (yyyy-mm-dd)
  dueTime: string; // time string (hh:mm), empty when not set
  importance: Importance;
  category: Category;
  tags: string[];
  source: TodoSource;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TodoInput = {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  importance: Importance;
  category: Category;
  tags: string[];
  source: TodoSource;
};
