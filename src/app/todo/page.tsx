import { Todo } from "@/components/Todo";

export default function TodoPage() {
  return (
    <main className="container py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Todo List</h1>
        <Todo />
      </div>
    </main>
  );
} 