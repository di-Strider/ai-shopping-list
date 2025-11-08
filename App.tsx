import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingListItem as ShoppingListItemType } from './types';
import { getShoppingSuggestions } from './services/geminiService.ts';
import AddItemForm from './components/AddItemForm';
import ShoppingList from './components/ShoppingList';
import Header from './components/Header';
import ToggleSwitch from './components/ToggleSwitch';

const App: React.FC = () => {
  const [items, setItems] = useState<ShoppingListItemType[]>(() => {
    try {
      const storedItems = localStorage.getItem('shoppingListItems');
      return storedItems ? JSON.parse(storedItems) : [];
    } catch (error) {
      console.error("Could not parse items from localStorage", error);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showOnlyRemaining, setShowOnlyRemaining] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('shoppingListItems', JSON.stringify(items));
  }, [items]);

  const handleAddItem = useCallback((name: string) => {
    if (name.trim() === '') return;
    const newItem: ShoppingListItemType = {
      id: Date.now(),
      name: name.trim(),
      completed: false,
    };
    setItems(prevItems => [...prevItems, newItem]);
  }, []);
  
  const handleAddMultipleItems = useCallback((names: string[]) => {
    const newItems: ShoppingListItemType[] = names
      .filter(name => name.trim() !== '')
      .map(name => ({
        id: Date.now() + Math.random(),
        name: name.trim(),
        completed: false,
      }));
    setItems(prevItems => [...prevItems, ...newItems]);
  }, []);

  const handleToggleItem = useCallback((id: number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const handleDeleteItem = useCallback((id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const handleClearCompleted = useCallback(() => {
    setItems(prevItems => prevItems.filter(item => !item.completed));
  }, []);

  const handleClearAll = useCallback(() => {
    setItems([]);
  }, []);
  
  const handleGetSuggestions = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    try {
      const suggestions = await getShoppingSuggestions(prompt);
      if (suggestions.length > 0) {
        handleAddMultipleItems(suggestions);
      }
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsLoading(false);
    }
  }, [handleAddMultipleItems]);

  const completedCount = items.filter(item => item.completed).length;
  const displayedItems = showOnlyRemaining ? items.filter(item => !item.completed) : items;

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white dark:bg-slate-800 shadow-2xl">
      <Header />
      <main className="flex-grow overflow-y-auto px-4 pt-4">
        <ShoppingList
          items={displayedItems}
          totalItems={items.length}
          onToggleItem={handleToggleItem}
          onDeleteItem={handleDeleteItem}
        />
      </main>
      <footer className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        {items.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <label htmlFor="show-remaining" className="cursor-pointer font-medium">Show remaining</label>
                <ToggleSwitch
                  id="show-remaining"
                  checked={showOnlyRemaining}
                  onChange={setShowOnlyRemaining}
                />
              </div>
              <span>{completedCount} / {items.length} completed</span>
            </div>
            <div className="flex justify-end space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <button onClick={handleClearCompleted} className="hover:text-indigo-500 transition-colors disabled:opacity-50" disabled={completedCount === 0}>Clear Completed</button>
              <button onClick={handleClearAll} className="hover:text-red-500 transition-colors">Clear All</button>
            </div>
          </div>
        )}
        <AddItemForm onAddItem={handleAddItem} onGetSuggestions={handleGetSuggestions} isLoading={isLoading} />
      </footer>
    </div>
  );
};

export default App;