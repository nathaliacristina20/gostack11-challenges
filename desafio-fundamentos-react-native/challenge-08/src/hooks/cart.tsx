import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const getItems = await AsyncStorage.getItem('@GoMarketplace:products');
      if (getItems) {
        setProducts(JSON.parse(getItems));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateProductsInAsyncStorage(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    updateProductsInAsyncStorage();
  }, [products]);

  const addToCart = useCallback(async product => {
    setProducts(state => {
      const findProduct = state.find(
        productState => productState.id === product.id,
      );

      if (!findProduct) {
        return [...state, { ...product, quantity: 1 }];
      }

      const productsInCart = state.map(productState => {
        if (productState.id === product.id) {
          return { ...productState, quantity: productState.quantity + 1 };
        }

        return productState;
      });

      return productsInCart;
    });
  }, []);

  const increment = useCallback(
    async id => {
      const productsInCart = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }

        return product;
      });

      setProducts(productsInCart);
    },
    [products],
  );

  const decrement = useCallback(async id => {
    setProducts(state => {
      const findProduct = state.find(productState => productState.id === id);

      if (findProduct && findProduct.quantity === 1) {
        return state.filter(productState => productState.id !== id);
      }

      return state.map(productState => {
        if (productState.id === id) {
          return { ...productState, quantity: productState.quantity - 1 };
        }
        return productState;
      });
    });
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
