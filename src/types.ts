/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  unit: string; // e.g., 'g', 'ml', 'un'
  pricePaid: number;
}

export interface RecipeIngredient {
  inventoryItemId: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  yield: string; // how much it makes
  observations: string; // oven time, temp, etc.
}

export interface MenuLayer {
  id: string;
  name: string;
  color: string; // Hex or CSS color
  ingredientId?: string; // Optional: link to inventory or recipe
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  layers: MenuLayer[];
  ingredients: RecipeIngredient[]; // total ingredients for cost calc
}

export type ViewType = 'dashboard' | 'cardapio' | 'estoque' | 'receitas' | 'montagem';
