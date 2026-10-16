import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';

export const ThingsToBuyModal: React.FC = () => {
  const { isBuyModalOpen, setIsBuyModalOpen, shoppingList, addShoppingItem, toggleShoppingItem, deleteShoppingItem } =
    useApp();

  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemNote, setItemNote] = useState('');

  if (!isBuyModalOpen) return null;

  // Calculate estimated total for uncompleted items
  const estimatedTotal = shoppingList
    .filter(i => !i.completed)
    .reduce((sum, item) => sum + item.price, 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const parsedPrice = parseInt(itemPrice.replace(/[^0-9]/g, ''), 10) || 0;
    addShoppingItem(itemName.trim(), parsedPrice, itemNote.trim() || 'Wishlist item');
    setItemName('');
    setItemPrice('');
    setItemNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsBuyModalOpen(false)}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative z-10 w-full max-w-lg bg-[#0c1320] border-t border-[#202c3d]/60 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
      >
        <div className="w-12 h-1.5 bg-[#202c3d] rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#cdbdff]/15 border border-[#cdbdff]/30 flex items-center justify-center text-[#cdbdff]">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#edf5ff] tracking-tight leading-tight">
                Things to Buy
              </h3>
              <p className="font-mono text-xs text-[#91a2b8]">Wishlist & savings targets</p>
            </div>
          </div>
          <button
            onClick={() => setIsBuyModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#162338] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Total Summary Banner */}
        <div className="bg-[#090f19] px-4 py-3 rounded-xl border border-[#202c3d]/40 flex items-center justify-between">
          <span className="font-mono text-xs text-[#91a2b8]">Estimated Total</span>
          <span className="font-mono text-base text-[#cdbdff] font-bold">
            ৳{estimatedTotal.toLocaleString()}
          </span>
        </div>

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-[#090f19] px-3 py-2 rounded-lg border border-[#202c3d]/40 flex items-center space-x-2">
              <span className="material-symbols-outlined text-[18px] text-[#91a2b8]">
                add_shopping_cart
              </span>
              <input
                type="text"
                required
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="Item name (e.g. Mechanical Keyboard)..."
                className="bg-transparent border-0 text-[#edf5ff] placeholder-[#91a2b8]/50 focus:outline-none w-full text-xs font-sans"
              />
            </div>

            <div className="w-28 bg-[#090f19] px-2.5 py-2 rounded-lg border border-[#202c3d]/40 flex items-center space-x-1">
              <span className="font-mono text-xs text-[#91a2b8]">৳</span>
              <input
                type="number"
                value={itemPrice}
                onChange={e => setItemPrice(e.target.value)}
                placeholder="Price"
                className="bg-transparent border-0 text-[#edf5ff] placeholder-[#91a2b8]/50 focus:outline-none w-full text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="bg-[#35d9ff] text-[#003641] px-3.5 py-2 rounded-lg font-mono text-xs font-semibold active:scale-95 shadow-md shrink-0"
            >
              Add
            </button>
          </div>
        </form>

        {/* Wishlist Items List (Matches Sketch Image 3) */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[44vh] pr-1">
          {shoppingList.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#91a2b8]">
              Your wishlist is empty. Add gadgets, books, or supplements.
            </div>
          ) : (
            shoppingList.map(item => {
              const isDone = item.completed;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-[#090f19]/60 border-[#202c3d]/20 opacity-60'
                      : 'bg-[#090f19] border-[#202c3d]/30 hover:border-[#cdbdff]/30'
                  }`}
                >
                  <div
                    onClick={() => toggleShoppingItem(item.id)}
                    className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                        isDone
                          ? 'bg-[#35d9ff] text-[#070b12]'
                          : 'bg-[#1f314c] border border-[#202c3d] text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px] font-bold">
                        check
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium truncate ${
                          isDone ? 'line-through text-[#91a2b8]' : 'text-[#edf5ff]'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="font-mono text-[10px] text-[#91a2b8]">{item.note}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-2 shrink-0">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        isDone ? 'line-through opacity-50 text-[#91a2b8]' : 'text-[#cdbdff]'
                      }`}
                    >
                      ৳{item.price.toLocaleString()}
                    </span>

                    <button
                      onClick={() => deleteShoppingItem(item.id)}
                      className="text-[#91a2b8] hover:text-[#ff5c78] p-1 rounded"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
