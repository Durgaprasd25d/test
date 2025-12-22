import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Check, Circle, CheckCircle2, Filter } from 'lucide-react';

function TodoApp() {
    const [todos, setTodos] = useState([]);
    const [input, setInput] = useState('');
    const [filter, setFilter] = useState('all'); // all, active, completed

    // Load todos from localStorage on mount
    useEffect(() => {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            setTodos(JSON.parse(savedTodos));
        }
    }, []);

    // Save todos to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('todos', JSON.stringify(todos));
    }, [todos]);

    const addTodo = (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const newTodo = {
            id: Date.now(),
            text: input.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
        };

        setTodos([newTodo, ...todos]);
        setInput('');
    };

    const toggleTodo = (id) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const deleteTodo = (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
    };

    const clearCompleted = () => {
        setTodos(todos.filter(todo => !todo.completed));
    };

    const filteredTodos = todos.filter(todo => {
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    });

    const stats = {
        total: todos.length,
        active: todos.filter(t => !t.completed).length,
        completed: todos.filter(t => t.completed).length,
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-5xl sm:text-6xl font-bold text-gradient mb-3 animate-bounce-subtle">
                        ✨ Todo App
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Stay organized, stay productive
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8 animate-scale-in">
                    <div className="glass-card rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
                        <div className="text-3xl font-bold text-gradient">{stats.total}</div>
                        <div className="text-sm text-gray-600 font-medium mt-1">Total</div>
                    </div>
                    <div className="glass-card rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
                        <div className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            {stats.active}
                        </div>
                        <div className="text-sm text-gray-600 font-medium mt-1">Active</div>
                    </div>
                    <div className="glass-card rounded-2xl p-4 text-center transform hover:scale-105 transition-transform duration-300">
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            {stats.completed}
                        </div>
                        <div className="text-sm text-gray-600 font-medium mt-1">Done</div>
                    </div>
                </div>

                {/* Input Form */}
                <form onSubmit={addTodo} className="mb-8 animate-slide-in">
                    <div className="glass-card rounded-2xl p-6 shadow-2xl">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="What needs to be done? ✍️"
                                className="input-field text-lg"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="btn-primary flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Add Task</span>
                            </button>
                        </div>
                    </div>
                </form>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-3 mb-6 justify-center animate-fade-in">
                    <button
                        onClick={() => setFilter('all')}
                        className={`filter-btn ${filter === 'all' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
                    >
                        <Filter className="w-4 h-4 inline mr-2" />
                        All Tasks
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`filter-btn ${filter === 'active' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
                    >
                        <Circle className="w-4 h-4 inline mr-2" />
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`filter-btn ${filter === 'completed' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
                    >
                        <CheckCircle2 className="w-4 h-4 inline mr-2" />
                        Completed
                    </button>
                    {stats.completed > 0 && (
                        <button
                            onClick={clearCompleted}
                            className="filter-btn bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
                        >
                            <Trash2 className="w-4 h-4 inline mr-2" />
                            Clear Completed
                        </button>
                    )}
                </div>

                {/* Todo List */}
                <div className="space-y-3">
                    {filteredTodos.length === 0 ? (
                        <div className="glass-card rounded-2xl p-12 text-center animate-fade-in">
                            <div className="text-6xl mb-4 animate-pulse-subtle">
                                {filter === 'completed' ? '🎉' : filter === 'active' ? '📝' : '🌟'}
                            </div>
                            <p className="text-xl text-gray-600 font-medium">
                                {filter === 'completed'
                                    ? 'No completed tasks yet'
                                    : filter === 'active'
                                        ? 'No active tasks. Time to add some!'
                                        : 'Your todo list is empty. Start by adding a task!'}
                            </p>
                        </div>
                    ) : (
                        filteredTodos.map((todo, index) => (
                            <div
                                key={todo.id}
                                className="todo-item"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleTodo(todo.id)}
                                        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${todo.completed
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 scale-110'
                                                : 'border-gray-400 hover:border-primary-500 hover:scale-110'
                                            }`}
                                    >
                                        {todo.completed && <Check className="w-5 h-5 text-white" />}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-lg font-medium transition-all duration-300 ${todo.completed
                                                    ? 'line-through text-gray-400'
                                                    : 'text-gray-800'
                                                }`}
                                        >
                                            {todo.text}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(todo.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => deleteTodo(todo.id)}
                                        className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {todos.length > 0 && (
                    <div className="mt-8 text-center text-gray-600 text-sm animate-fade-in">
                        <p>
                            {stats.active === 0
                                ? '🎊 All tasks completed! Great job!'
                                : `${stats.active} task${stats.active !== 1 ? 's' : ''} remaining`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TodoApp;
