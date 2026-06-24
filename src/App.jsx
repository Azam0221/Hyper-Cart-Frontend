import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home', 'Books', 'Toys', 'Sports'];

export default function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [hasMore, setHasMore] = useState(true);
  const [isUiLoading, setIsUiLoading] = useState(false);

  const cursorRef = useRef(null);
  const lastIdRef = useRef(null);
  const loadingRef = useRef(false);
  const observer = useRef();

  
  const fetchProducts = useCallback(async (reset = false) => {
    if (loadingRef.current) {
      console.log("⚠️ Blocked: already loading");
      return;
    }

    loadingRef.current = true;
    setIsUiLoading(true);

    try {
      if (reset) {
        cursorRef.current = null;
        lastIdRef.current = null;
      }

      let url = `https://hyper-cart-qy14.onrender.com/api/products?limit=50`;
      if (category !== 'All') url += `&category=${encodeURIComponent(category)}`;

      if (cursorRef.current && lastIdRef.current) {
        console.log("📡 Fetching next page, cursor:", cursorRef.current, "id:", lastIdRef.current);
        url += `&cursor=${encodeURIComponent(cursorRef.current)}&lastId=${lastIdRef.current}`;
      } else {
        console.log("📡 Fetching first page");
      }

      const { data } = await axios.get(url);
      console.log("✅ Got", data.data.length, "products");

      setProducts(prev => reset ? data.data : [...prev, ...data.data]);
      cursorRef.current = data.nextCursor;
      lastIdRef.current = data.nextId;
      setHasMore(data.data.length === 50);

    } catch (err) {
      console.error("❌ Fetch error:", err.message);
    } finally {
      loadingRef.current = false;
      setIsUiLoading(false);
    }
  }, [category]); 

  
  useEffect(() => {
    setProducts([]);
    setHasMore(true);
    fetchProducts(true);
  }, [fetchProducts]);

  
  const lastProductElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        console.log("👀 Last item visible, hasMore:", hasMore);
        if (hasMore && !loadingRef.current) {
          fetchProducts(false);
        }
      }
    }, { threshold: 0.1 });

    if (node) {
      console.log("🎯 Observer attached to last element");
      observer.current.observe(node);
    }
  }, [fetchProducts, hasMore]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HyperCart</h1>
          <select
            className="p-2 border border-gray-300 rounded-md shadow-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const isLast = index === products.length - 1;
            return (
              <div
                key={product.id}
                ref={isLast ? lastProductElementRef : null}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-sm text-blue-600 font-semibold mb-1">{product.category}</div>
                <h2 className="text-lg font-bold text-gray-800 mb-2 truncate">{product.name}</h2>
                <div className="text-xl text-gray-900">${product.price}</div>
              </div>
            );
          })}
        </div>

        {isUiLoading && (
          <div className="text-center py-8 text-blue-600 font-bold text-xl animate-pulse">
            Loading more products...
          </div>
        )}

        {!hasMore && !isUiLoading && products.length > 0 && (
          <div className="text-center py-8 text-gray-400">
            You've seen all products!
          </div>
        )}

      </div>
    </div>
  );
}