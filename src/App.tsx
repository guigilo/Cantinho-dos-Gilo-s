/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, Dispatch, SetStateAction, useEffect } from 'react';
import { 
  LayoutGrid, 
  Package, 
  UtensilsCrossed, 
  Layers, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Minus, 
  Save, 
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  InventoryItem, 
  Recipe, 
  MenuItem, 
  ViewType, 
  MenuLayer, 
  RecipeIngredient 
} from './types';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  OperationType, 
  handleFirestoreError 
} from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  
  // Auth state listener
  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // Firebase Data Listeners
  useEffect(() => {
    if (!user) return;

    const unsubInventory = onSnapshot(
      query(collection(db, 'inventory'), where('userId', '==', user.uid)),
      (snapshot) => setInventory(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as InventoryItem))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'inventory')
    );

    const unsubRecipes = onSnapshot(
      query(collection(db, 'recipes'), where('userId', '==', user.uid)),
      (snapshot) => setRecipes(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Recipe))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'recipes')
    );

    const unsubMenu = onSnapshot(
      query(collection(db, 'menu'), where('userId', '==', user.uid)),
      (snapshot) => setMenu(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuItem))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'menu')
    );

    return () => {
      unsubInventory();
      unsubRecipes();
      unsubMenu();
    };
  }, [user]);

  // Navigation
  const navigate = (newView: ViewType) => setView(newView);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-cream">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary-pink border-t-primary-brown rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-bg-cream text-primary-brown font-sans selection:bg-primary-pink/20 pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-primary-brown/10 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {view !== 'dashboard' && (
            <button 
              onClick={() => navigate('dashboard')}
              className="p-1 -ml-2 hover:bg-bg-cream transition-colors border border-transparent hover:border-primary-brown/20 rounded-full"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-3">
            <img 
              src="https://raw.githubusercontent.com/guilhermekamper/confeitaria-assets/main/logo.png" 
              alt="Logo Cantinho dos Gilo's" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-xl md:text-2xl font-serif italic tracking-tight leading-none text-primary-brown">
                {view === 'dashboard' ? "Cantinho dos Gilo's" : 
                 view === 'cardapio' ? 'Cardápio' : 
                 view === 'estoque' ? 'Estoque' : 
                 view === 'receitas' ? 'Receitas' : 'Montagem'}
              </h1>
              {view === 'dashboard' && <p className="text-[9px] uppercase tracking-[0.2em] text-primary-brown/60 mt-1 font-bold">Desde 2025 • Gestão Craft</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-brown/40">Usuário</p>
            <p className="text-[11px] font-medium">{user.displayName || 'Confeiteiro'}</p>
          </div>
          <button 
            onClick={logout}
            className="w-10 h-10 border-2 border-primary-brown flex items-center justify-center text-primary-brown hover:bg-primary-brown hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(127,85,57,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-white font-serif italic text-xl"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 md:p-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <Dashboard key="dashboard" onNavigate={navigate} />
          )}
          {view === 'estoque' && (
            <InventoryView 
              key="estoque" 
              inventory={inventory} 
              user={user}
            />
          )}
          {view === 'receitas' && (
            <RecipesView 
              key="receitas" 
              recipes={recipes} 
              inventory={inventory}
              user={user}
            />
          )}
          {view === 'cardapio' && (
            <MenuView 
              key="cardapio" 
              menu={menu} 
              inventory={inventory}
              recipes={recipes}
              user={user}
            />
          )}
          {view === 'montagem' && (
            <AssemblyView 
              key="montagem" 
              menu={menu} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function LoginView() {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Erro no login:", error);
      if (error.code === 'auth/popup-blocked') {
        setLoginError("O pop-up foi bloqueado pelo navegador. Verifique a barra de endereço.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setLoginError("O login com Google não parece estar ativado no Firebase Console.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setLoginError("Este domínio não está autorizado no Firebase Console.");
      } else {
        setLoginError(`Erro: ${error.message || "Tente abrir em uma nova aba."}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm p-10 bg-white border-4 border-primary-brown shadow-[8px_8px_0px_0px_rgba(127,85,57,1)] flex flex-col items-center gap-8"
      >
        <img 
          src="https://raw.githubusercontent.com/guilhermekamper/confeitaria-assets/main/logo.png" 
          alt="Cantinho dos Gilo's" 
          className="w-40 h-40 object-contain"
        />
        <div className="space-y-4">
          <h1 className="text-3xl font-serif italic text-primary-brown">Seja Bem-vindo!</h1>
          <p className="text-sm font-medium text-primary-brown/60 leading-relaxed px-4">
            Gerencie sua produção, estoque e cardápio de forma artesanal e profissional.
          </p>
        </div>

        {loginError && (
          <div className="p-4 bg-red-50 border-2 border-red-200 text-red-600 text-[10px] font-bold uppercase leading-tight space-y-2">
            <p>{loginError}</p>
            <p className="border-t border-red-200 pt-2 opacity-70">Dica: Tente usar o botão "Abrir em nova aba" no topo do editor.</p>
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className={`w-full flex items-center justify-center gap-3 bg-primary-pink text-primary-brown border-2 border-primary-brown py-4 font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(127,85,57,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoggingIn ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <LogIn size={20} />
            </motion.div>
          ) : (
            <LogIn size={20} />
          )}
          {isLoggingIn ? 'Entrando...' : 'Entrar com Google'}
        </button>
        <p className="text-[10px] text-primary-brown/40 uppercase tracking-[0.2em] font-bold">Artesanal & Profissional</p>
      </motion.div>
    </div>
  );
}

// --- Dashboard Component ---
interface DashboardProps {
  onNavigate: (v: ViewType) => void;
  key?: string;
}

function Dashboard({ onNavigate }: DashboardProps) {
  const cards = [
    { id: 'cardapio', label: 'Cardápio', icon: LayoutGrid, color: 'hover:bg-white bg-bg-soft-pink border-primary-brown/10 text-primary-brown' },
    { id: 'estoque', label: 'Estoque', icon: Package, color: 'hover:bg-white bg-bg-soft-pink border-primary-brown/10 text-primary-brown' },
    { id: 'receitas', label: 'Receitas', icon: UtensilsCrossed, color: 'hover:bg-white bg-bg-soft-pink border-primary-brown/10 text-primary-brown' },
    { id: 'montagem', label: 'Montagem', icon: Layers, color: 'bg-primary-brown border-primary-brown text-white' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-2 gap-6"
    >
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onNavigate(card.id as ViewType)}
          className={`${card.color} border-2 p-10 rounded-none flex flex-col items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(127,85,57,0.1)]`}
        >
          <card.icon size={28} strokeWidth={1.5} />
          <span className="text-xs uppercase tracking-[0.2em] font-bold">{card.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

// --- Inventory View ---
interface InventoryViewProps {
  inventory: InventoryItem[];
  user: any;
  key?: string;
}

function InventoryView({ inventory, user }: InventoryViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ name: '', brand: '', quantity: 0, unit: 'un', pricePaid: 0 });

  const handleSave = async () => {
    if (newItem.name && user) {
      try {
        const id = Date.now().toString();
        await setDoc(doc(db, 'inventory', id), { 
          ...newItem, 
          id, 
          userId: user.uid 
        });
        setIsAdding(false);
        setNewItem({ name: '', brand: '', quantity: 0, unit: 'un', pricePaid: 0 });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'inventory');
      }
    }
  };

  const updateQty = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
      try {
        await updateDoc(doc(db, 'inventory', id), {
          quantity: Math.max(0, item.quantity + delta)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'inventory');
      }
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'inventory');
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <button 
        onClick={() => setIsAdding(true)}
        className="w-full bg-primary-pink text-primary-brown py-5 rounded-none text-xs uppercase tracking-[0.2em] font-bold border-2 border-primary-brown shadow-[4px_4px_0px_0px_rgba(127,85,57,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        <Plus size={16} className="inline mr-2" /> Adicionar Produto
      </button>

      <section className="bg-white p-8 border-2 border-primary-brown/10 shadow-[4px_4px_0px_0px_rgba(127,85,57,0.05)]">
        <h3 className="text-[11px] uppercase tracking-[0.15em] text-primary-brown/40 font-bold mb-6">Lista de Estoque</h3>
        <div className="space-y-4">
          {inventory.map(item => (
            <div key={item.id} className="p-4 border border-primary-brown/10 hover:border-primary-pink bg-bg-cream/30 flex items-center justify-between transition-colors">
              <div>
                <h3 className="text-sm font-bold">{item.name}</h3>
                <p className="text-[10px] uppercase tracking-wider opacity-40">{item.brand}</p>
                <p className="text-xs font-mono font-bold text-primary-brown mt-1">R$ {item.pricePaid.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateQty(item.id, -1)}
                  className="w-8 h-8 border-2 border-primary-brown flex items-center justify-center text-xs hover:bg-primary-pink transition-colors"
                >
                  <Minus size={12} />
                </button>
                <span className="min-w-[40px] text-center text-xs font-mono font-bold uppercase tracking-tight">
                  {item.quantity}{item.unit}
                </span>
                <button 
                  onClick={() => updateQty(item.id, 1)}
                  className="w-8 h-8 border-2 border-primary-brown flex items-center justify-center text-xs hover:bg-primary-pink transition-colors"
                >
                  <Plus size={12} />
                </button>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 ml-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {inventory.length === 0 && (
            <p className="text-center py-10 text-xs italic opacity-30">Nenhum produto em estoque</p>
          )}
        </div>
      </section>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-primary-brown/80 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md border-4 border-primary-brown p-10 space-y-8"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-serif italic text-primary-brown">Novo Produto</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-bg-cream transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-primary-brown/40 mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="w-full border-b-2 border-primary-brown/10 py-2 text-sm outline-none focus:border-primary-pink"
                  placeholder="Ex: Leite Condensado"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-primary-brown/40 mb-1">Marca</label>
                <input 
                  type="text" 
                  value={newItem.brand}
                  onChange={e => setNewItem({...newItem, brand: e.target.value})}
                  className="w-full border-b-2 border-primary-brown/10 py-2 text-sm outline-none focus:border-primary-pink"
                  placeholder="Ex: Nestlé"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-primary-brown/40 mb-1">Quantidade</label>
                  <input 
                    type="number" 
                    value={newItem.quantity}
                    onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                    className="w-full border-b-2 border-primary-brown/10 py-2 text-sm outline-none focus:border-primary-pink"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-primary-brown/40 mb-1">Unidade</label>
                  <select 
                    value={newItem.unit}
                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full border-b-2 border-primary-brown/10 py-2 text-sm bg-transparent outline-none focus:border-primary-pink"
                  >
                    <option value="un">un</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-primary-brown/40 mb-1">Valor Pago</label>
                <div className="relative">
                  <span className="absolute left-0 bottom-2 text-xs font-mono font-bold opacity-30">R$</span>
                  <input 
                    type="number" 
                    value={newItem.pricePaid}
                    onChange={e => setNewItem({...newItem, pricePaid: Number(e.target.value)})}
                    className="w-full border-b-2 border-primary-brown/10 py-2 pl-6 text-sm outline-none focus:border-primary-pink font-mono"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-primary-brown text-white py-4 text-xs uppercase tracking-widest font-bold shadow-[4px_4px_0px_0px_rgba(255,184,209,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Salvar Produto
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// --- Recipes View ---
interface RecipesViewProps {
  recipes: Recipe[];
  inventory: InventoryItem[];
  user: any;
  key?: string;
}

function RecipesView({ recipes, inventory, user }: RecipesViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isProducing, setIsProducing] = useState<string | null>(null);
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({ 
    name: '', 
    ingredients: [], 
    yield: '', 
    observations: '' 
  });

  const handleSave = async () => {
    if (newRecipe.name && user) {
      try {
        const id = Date.now().toString();
        await setDoc(doc(db, 'recipes', id), { 
          ...newRecipe, 
          id, 
          userId: user.uid 
        });
        setIsAdding(false);
        setNewRecipe({ name: '', ingredients: [], yield: '', observations: '' });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'recipes');
      }
    }
  };

  const deleteRecipe = async (id: string) => {
    if (confirm('Deseja excluir esta receita?')) {
      try {
        await deleteDoc(doc(db, 'recipes', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'recipes');
      }
    }
  };

  const addIngredient = () => {
    setNewRecipe({
      ...newRecipe,
      ingredients: [...(newRecipe.ingredients || []), { inventoryItemId: inventory[0]?.id || '', amount: 0, unit: 'g' }]
    });
  };

  const produceRecipe = async (recipe: Recipe) => {
    if (!confirm(`Deseja produzir "${recipe.name}" e abater os ingredientes do estoque?`)) return;

    setIsProducing(recipe.id);
    try {
      const batch = writeBatch(db);
      let updateCount = 0;

      for (const ing of (recipe.ingredients || [])) {
        const item = inventory.find(i => i.id === ing.inventoryItemId);
        if (item) {
          const currentQty = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity);
          const subtractQty = typeof ing.amount === 'number' ? ing.amount : Number(ing.amount);
          const newQty = Math.max(0, currentQty - subtractQty);
          
          const itemRef = doc(db, 'inventory', item.id);
          batch.update(itemRef, { quantity: newQty });
          updateCount++;
        }
      }

      if (updateCount === 0) {
        alert('Nenhum ingrediente desta receita foi encontrado no seu estoque atual.');
        setIsProducing(null);
        return;
      }

      await batch.commit();
      alert('Produção concluída! Estoque atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao produzir receita:', error);
      handleFirestoreError(error, OperationType.UPDATE, 'production_batch');
    } finally {
      setIsProducing(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <button 
        onClick={() => setIsAdding(true)}
        className="w-full bg-primary-pink text-primary-brown py-5 rounded-none text-xs uppercase tracking-[0.2em] font-bold border-2 border-primary-brown shadow-[4px_4px_0px_0px_rgba(127,85,57,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
      >
        <Plus size={16} className="inline mr-2" /> Nova Receita
      </button>

      <div className="grid grid-cols-1 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.id} className="bg-white border-2 border-primary-brown/10 p-8 shadow-[4px_4px_0px_0px_rgba(127,85,57,0.05)] space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-serif italic text-primary-brown">{recipe.name}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => produceRecipe(recipe)}
                  disabled={isProducing === recipe.id}
                  className={`bg-primary-brown text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 ${isProducing === recipe.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProducing === recipe.id ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Package size={14} />
                    </motion.div>
                  ) : (
                    <Package size={14} />
                  )}
                  {isProducing === recipe.id ? 'Produzindo...' : 'Produzir'}
                </button>
                <button 
                  onClick={() => deleteRecipe(recipe.id)}
                  className="p-2 text-red-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <span className="text-[10px] border-2 border-primary-brown/20 text-primary-brown/60 px-3 py-1 uppercase font-bold tracking-widest bg-bg-cream">
                Rendimento: {recipe.yield}
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-primary-brown/5">
              <h4 className="text-[9px] uppercase font-black text-primary-brown/30 tracking-widest mb-2">Ingredientes Necessários</h4>
              {(recipe.ingredients || []).map((ing, idx) => {
                const invItem = inventory.find(i => i.id === ing.inventoryItemId);
                return (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-primary-brown/5 pb-1">
                    <span className="font-medium text-primary-brown/80">{invItem?.name || 'Ingrediente removido'}</span>
                    <span className="font-mono text-primary-brown/40">{ing.amount}{invItem?.unit || 'g'}</span>
                  </div>
                );
              })}
            </div>

            {recipe.observations && (
              <div className="p-4 bg-bg-soft-pink border-l-4 border-primary-pink">
                <p className="text-xs text-primary-brown/70 italic leading-relaxed">"{recipe.observations}"</p>
              </div>
            )}
          </div>
        ))}
        {recipes.length === 0 && <p className="text-center py-20 text-xs italic opacity-30 font-serif">Sua caderneta de doces está vazia...</p>}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-primary-dark/80 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md border border-[#E5E5E5] p-10 space-y-8 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-serif italic">Cadastro de Receita</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 border border-transparent hover:border-[#E5E5E5]"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-accent-soft mb-1">Nome da Receita</label>
                <input 
                  type="text" 
                  value={newRecipe.name}
                  onChange={e => setNewRecipe({...newRecipe, name: e.target.value})}
                  className="w-full border-b border-[#E5E5E5] py-2 text-sm outline-none focus:border-accent"
                  placeholder="Ex: Brigadeiro Belga"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase font-bold text-accent-soft">Ingredientes</label>
                  <button onClick={addIngredient} className="text-[10px] border border-primary-dark px-2 py-1 uppercase font-bold tracking-widest">
                    + Add
                  </button>
                </div>
                {newRecipe.ingredients?.map((ing, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <select 
                      className="flex-1 border-b border-[#E5E5E5] py-2 text-xs outline-none bg-transparent"
                      value={ing.inventoryItemId}
                      onChange={e => {
                        const ings = [...(newRecipe.ingredients || [])];
                        ings[idx].inventoryItemId = e.target.value;
                        setNewRecipe({...newRecipe, ingredients: ings});
                      }}
                    >
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ) )}
                    </select>
                    <input 
                      type="number" 
                      placeholder="Qtd"
                      className="w-16 border-b border-[#E5E5E5] py-2 text-xs outline-none font-mono"
                      value={ing.amount}
                      onChange={e => {
                        const ings = [...(newRecipe.ingredients || [])];
                        ings[idx].amount = Number(e.target.value);
                        setNewRecipe({...newRecipe, ingredients: ings});
                      }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-accent-soft mb-1">Rendimento</label>
                <input 
                  type="text" 
                  value={newRecipe.yield}
                  onChange={e => setNewRecipe({...newRecipe, yield: e.target.value})}
                  className="w-full border-b border-[#E5E5E5] py-2 text-sm outline-none focus:border-accent"
                  placeholder="Ex: 25 porções"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-accent-soft mb-1">Observações de Preparo</label>
                <textarea 
                  value={newRecipe.observations}
                  onChange={e => setNewRecipe({...newRecipe, observations: e.target.value})}
                  className="w-full border border-[#E5E5E5] p-4 text-xs h-32 outline-none focus:border-accent bg-bg-base/30"
                  placeholder="Ex: Cozinhar em fogo baixo por 12 min..."
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-primary-dark text-white py-4 text-xs uppercase tracking-widest font-bold shadow-lg"
            >
              Salvar Receita
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// --- Menu View (Cardápio) ---
interface MenuViewProps {
  menu: MenuItem[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  user: any;
  key?: string;
}

function MenuView({ menu, inventory, recipes, user }: MenuViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ 
    name: '', 
    price: 0, 
    layers: [] 
  });

  const handleSave = async () => {
    if (newItem.name && user) {
      try {
        const id = editingItem ? editingItem.id : Date.now().toString();
        await setDoc(doc(db, 'menu', id), { 
          ...newItem, 
          id, 
          userId: user.uid 
        });
        setIsAdding(false);
        setEditingItem(null);
        setNewItem({ name: '', price: 0, layers: [] });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'menu');
      }
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm('Deseja excluir este produto do cardápio?')) {
      try {
        await deleteDoc(doc(db, 'menu', id));
        setIsAdding(false);
        setEditingItem(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'menu');
      }
    }
  };

  const addLayer = () => {
    setNewItem({
      ...newItem,
      layers: [...(newItem.layers || []), { id: Date.now().toString(), name: 'Nova Camada', color: '#7F5539' }]
    });
  };

  const updateLayerName = (id: string, name: string) => {
    setNewItem({
      ...newItem,
      layers: newItem.layers?.map(l => l.id === id ? { ...l, name } : l)
    });
  };

  const updateLayerColor = (id: string, color: string) => {
    setNewItem({
      ...newItem,
      layers: newItem.layers?.map(l => l.id === id ? { ...l, color } : l)
    });
  };

  const removeLayer = (id: string) => {
    setNewItem({
      ...newItem,
      layers: newItem.layers?.filter(l => l.id !== id)
    });
  };

  const LAYER_COLORS = [
    { name: 'Chocolate Belga', value: '#3E2723' },
    { name: 'Ao Leite', value: '#7F5539' },
    { name: 'Branco', value: '#F9F1E7' },
    { name: 'Doce de Leite', value: '#A0522D' },
    { name: 'Ninho / Creme', value: '#FFFBF5' },
    { name: 'Morango', value: '#FFB8D1' },
    { name: 'Frutas Vermelhas', value: '#8B0000' },
    { name: 'Pistache', value: '#93C572' },
    { name: 'Limão', value: '#D9F99D' },
    { name: 'Maracujá', value: '#FDE047' },
    { name: 'Oreo / Black', value: '#242124' },
    { name: 'Nutella', value: '#483C32' },
    { name: 'Crocante / Ouro', value: '#CA8A04' },
    { name: 'Uva / Violeta', value: '#7E22CE' },
    { name: 'Azul Céu', value: '#7DD3FC' },
    { name: 'Menta', value: '#A7F3D0' },
    { name: 'Caramelo', value: '#D97706' },
    { name: 'Rosa Chiclete', value: '#FF9BBF' },
    { name: 'Verde Matcha', value: '#65A30D' },
    { name: 'Amora', value: '#581C87' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <button 
        onClick={() => setIsAdding(true)}
        className="w-full border-4 border-dashed border-primary-brown/20 py-8 text-[10px] uppercase font-bold tracking-[0.2em] text-primary-brown/40 hover:text-primary-brown hover:border-primary-brown hover:bg-white transition-all transform hover:-rotate-1"
      >
        <Plus size={14} className="inline mr-2" /> Adicionar ao Cardápio
      </button>

      <div className="grid grid-cols-1 gap-4">
        {menu.map(item => (
          <button 
            key={item.id} 
            onClick={() => {
              setEditingItem(item);
              setNewItem(item);
              setIsAdding(true);
            }}
            className="w-full text-left p-6 border-2 border-primary-brown/10 hover:border-primary-brown bg-white flex justify-between items-center transition-all group shadow-[4px_4px_0px_0px_rgba(127,85,57,0.05)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-bg-soft-pink flex flex-col-reverse items-center p-1 rounded-sm border border-primary-brown/10">
                {item.layers.slice(0, 3).map((l, i) => (
                  <div key={l.id} className="w-full h-2 mb-0.5 rounded-full" style={{ backgroundColor: l.color }} />
                ))}
              </div>
              <div>
                <span className="text-sm font-bold block">{item.name}</span>
                <p className="text-[9px] uppercase tracking-wider text-primary-brown/40 font-bold">{item.layers.length} camadas de sabor</p>
              </div>
            </div>
            <span className="text-sm font-mono font-bold bg-bg-cream border-2 border-primary-brown px-4 py-2 group-hover:bg-primary-brown group-hover:text-white transition-colors">
              R$ {item.price.toFixed(2)}
            </span>
          </button>
        ))}
        {menu.length === 0 && <p className="text-center py-20 text-xs italic opacity-30 font-serif">Seu cardápio está vazio...</p>}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-primary-brown/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-4xl border-4 border-primary-brown p-6 md:p-10 space-y-10 overflow-y-auto max-h-[95vh] grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            <div className="col-span-full flex justify-between items-center border-b-2 border-primary-brown/10 pb-6">
              <div>
                <h2 className="text-2xl font-serif italic text-primary-brown">Artesanato em Doce</h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-primary-brown/40">Configuração de Produto</p>
              </div>
              <button 
                onClick={() => { setIsAdding(false); setEditingItem(null); }} 
                className="w-10 h-10 border-2 border-primary-brown flex items-center justify-center hover:bg-bg-cream transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] uppercase font-bold text-primary-brown/40 mb-2">Nome Comercial</label>
                <input 
                  type="text" 
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="w-full border-b-2 border-primary-brown/10 py-3 text-lg outline-none focus:border-primary-pink font-medium"
                  placeholder="Ex: Copo da Gilo"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-primary-brown/40 mb-2">Preço de Venda</label>
                <div className="relative">
                  <span className="absolute left-0 bottom-3 text-sm font-mono font-bold opacity-30 text-primary-brown">R$</span>
                  <input 
                    type="number" 
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: Number(e.target.value)})}
                    className="w-full border-b-2 border-primary-brown/10 py-3 pl-8 text-3xl outline-none focus:border-primary-pink font-bold text-primary-brown font-mono"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-primary-pink/10 border-2 border-primary-pink shadow-[4px_4px_0px_0px_rgba(255,184,209,0.3)]">
                <h3 className="text-[11px] uppercase tracking-[0.15em] text-primary-brown font-bold mb-3">Guia de Visualização</h3>
                <p className="text-[11px] text-primary-brown/70 italic leading-relaxed">
                  "As camadas são empilhadas de baixo para cima. Use cores que remetam aos ingredientes reais para facilitar a montagem pela equipe."
                </p>
              </div>

              {editingItem && (
                <button 
                  onClick={() => deleteItem(editingItem.id)}
                  className="flex items-center gap-2 text-[10px] uppercase font-bold text-red-400 hover:text-red-600 transition-colors pt-4"
                >
                  <Trash2 size={14} /> Excluir permanentemente
                </button>
              )}
            </div>

            {/* Layer System Component */}
            <div className="bg-bg-cream/50 border-2 border-primary-brown/10 p-6 md:p-8 flex flex-col items-center">
              <div className="flex justify-between items-center w-full mb-8">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-primary-brown font-bold">Estrutura do Copo</h3>
                <button 
                  onClick={addLayer}
                  className="bg-primary-brown text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(255,184,209,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                  + Add Camada
                </button>
              </div>

              <div className="relative w-44 min-h-[220px] flex flex-col-reverse items-center pb-4 mb-8">
                {/* Cup Graphic Base */}
                <div className="absolute inset-x-0 bottom-0 top-2 w-full border-x-4 border-b-4 border-primary-brown/20 rounded-b-[48px]"></div>
                
                <AnimatePresence initial={false}>
                  {newItem.layers?.map((layer) => (
                    <motion.div 
                      key={layer.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 20 }}
                      className="w-36 h-10 flex items-center justify-center text-[9px] font-black uppercase mb-1 rounded-sm shadow-md border border-black/5 z-10"
                      style={{ backgroundColor: layer.color, color: ['#FFFBF5', '#CA8A04'].includes(layer.color) ? '#7F5539' : 'white' }}
                    >
                      <span className="px-2 truncate">{layer.name}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {(!newItem.layers || newItem.layers.length === 0) && (
                  <div className="h-40 flex items-center justify-center text-[10px] uppercase tracking-widest text-primary-brown/20 text-center font-bold px-8 italic">
                    O copo está vazio. Comece a criar!
                  </div>
                )}
              </div>

              {/* Editable Layer List */}
              <div className="w-full space-y-4 pt-6 border-t font-serif border-primary-brown/10">
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {newItem.layers?.map((layer, idx) => (
                    <div key={layer.id} className="p-4 bg-white border-2 border-primary-brown/10 flex flex-col gap-3 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold uppercase text-primary-brown/40">
                          {idx === 0 ? 'Base / Fundo' : idx === newItem.layers!.length - 1 ? 'Finalização / Topo' : `Camada Intermediária ${idx}`}
                        </span>
                        <button 
                          onClick={() => removeLayer(layer.id)}
                          className="text-red-300 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <input 
                        className="w-full border-b border-primary-brown/10 py-1 text-xs outline-none focus:border-primary-pink font-medium"
                        value={layer.name}
                        onChange={(e) => updateLayerName(layer.id, e.target.value)}
                        placeholder="Nome da camada..."
                      />
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-primary-brown/5">
                        {LAYER_COLORS.map(c => (
                          <button
                            key={c.value}
                            onClick={() => updateLayerColor(layer.id, c.value)}
                            className={`w-5 h-5 rounded-full border-2 ${layer.color === c.value ? 'border-primary-brown scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="col-span-full bg-primary-brown text-white py-5 text-sm uppercase tracking-[0.3em] font-bold shadow-[6px_6px_0px_0px_rgba(255,184,209,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all hover:brightness-110"
            >
              {editingItem ? 'Confirmar Alterações' : 'Finalizar e Salvar'}
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// --- Assembly View ---
interface AssemblyViewProps {
  menu: MenuItem[];
  key?: string;
}

function AssemblyView({ menu }: AssemblyViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (menu.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-primary-brown/20 space-y-6">
        <Layers size={80} strokeWidth={1} />
        <p className="font-serif italic text-xl">Sua cozinha está pronta para criar!</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-primary-pink/10 p-8 border-4 border-primary-pink/20 mb-8 border-double">
        <h3 className="text-[11px] uppercase tracking-[0.3em] text-primary-brown font-bold mb-3">Guia Visual de Montagem</h3>
        <p className="text-[11px] leading-relaxed text-primary-brown/60 italic font-serif">
          "A precisão na montagem garante a experiência completa. Siga a ordem das camadas para manter o equilíbrio de sabores."
        </p>
      </div>

      <div className="space-y-4">
        {menu.map(item => (
          <div key={item.id} className="bg-white border-2 border-primary-brown/10 shadow-[4px_4px_0px_0px_rgba(127,85,57,0.05)] overflow-hidden">
            <button 
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="w-full p-8 flex items-center justify-between group bg-white hover:bg-bg-cream/30 transition-colors"
            >
              <div className="flex items-center gap-8">
                <div className="w-14 h-14 bg-bg-soft-pink border-2 border-primary-brown flex items-center justify-center text-primary-brown rotate-3 group-hover:rotate-0 transition-transform">
                  <Layers size={28} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <h3 className="font-serif italic text-2xl text-primary-brown">{item.name}</h3>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary-brown/40 mt-1">{item.layers.length} Camadas artesanais</p>
                </div>
              </div>
              <div className="w-10 h-10 border-2 border-primary-brown/10 flex items-center justify-center rounded-full transition-all group-hover:border-primary-brown">
                {expandedId === item.id ? <Minus size={18} /> : <Plus size={18} />}
              </div>
            </button>
            
            <AnimatePresence>
              {expandedId === item.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="px-8 md:px-12 pb-14 overflow-hidden border-t-2 border-primary-brown/5 bg-bg-cream/10"
                >
                  <div className="flex flex-col md:flex-row gap-16 items-center md:items-start pt-12">
                    {/* Visual Cup */}
                    <div className="relative w-48 min-h-[280px] flex flex-col-reverse items-center pb-4 flex-shrink-0">
                      <div className="absolute inset-x-0 bottom-0 top-2 w-full border-x-[6px] border-b-[8px] border-primary-brown/20 rounded-b-[56px] shadow-inner"></div>
                      {item.layers.map((layer) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={layer.id}
                          className="w-40 h-14 flex items-center justify-center text-[10px] font-black uppercase mb-1.5 rounded-sm shadow-lg border border-white/20 z-10"
                          style={{ backgroundColor: layer.color, color: ['#FFFBF5', '#CA8A04'].includes(layer.color || '') ? '#7F5539' : 'white' }}
                        >
                          <span className="px-4 text-center leading-tight line-clamp-2">{layer.name}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Text Details */}
                    <div className="flex-1 space-y-10 w-full">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.4em] text-primary-brown font-black pb-3 border-b-2 border-primary-pink w-full mb-8">Passo a Passo de Preparo</h4>
                        <div className="space-y-8">
                          {item.layers.map((layer, idx) => (
                            <div key={layer.id} className="flex gap-6 items-start group">
                              <div className="w-10 h-10 border-2 border-primary-brown flex items-center justify-center text-xs font-serif italic font-bold shrink-0 group-hover:bg-primary-brown group-hover:text-white transition-all transform group-hover:scale-110">
                                {idx + 1}
                              </div>
                              <div className="border-b border-primary-brown/10 pb-4 flex-1">
                                <p className="font-bold text-base tracking-tight text-primary-brown">{layer.name}</p>
                                <p className="text-[9px] text-primary-brown/40 uppercase font-black tracking-widest mt-1.5">
                                  Posição: {idx === 0 ? 'Fundo (A Base)' : idx === item.layers.length - 1 ? 'Topo (O Toque Final)' : `Nível ${idx + 1}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-6 bg-white border-2 border-primary-brown/10 font-serif italic text-primary-brown/60 text-sm">
                        Total de R$ {item.price.toFixed(2)} sugerido ao cliente.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

