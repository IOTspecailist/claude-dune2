'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  category: string;
  created_at: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 폼 상태
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    stock: '',
    category: '',
  });

  // 전체 조회
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.ok) {
        setProducts(data.products);
        setMessage('✅ 조회 완료');
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 조회 실패: ' + err);
    }
    setLoading(false);
  };

  // 등록
  const createProduct = async () => {
    if (!formData.name || !formData.price) {
      setMessage('❌ 이름과 가격은 필수입니다');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock) || 0,
          category: formData.category || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage('✅ 등록 완료: ' + data.product.name);
        clearForm();
        fetchProducts();
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 등록 실패: ' + err);
    }
    setLoading(false);
  };

  // 수정
  const updateProduct = async () => {
    if (!formData.id) {
      setMessage('❌ 수정할 ID를 입력하세요');
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (formData.name) body.name = formData.name;
      if (formData.price) body.price = parseFloat(formData.price);
      if (formData.stock) body.stock = parseInt(formData.stock);
      if (formData.category) body.category = formData.category;

      const res = await fetch(`/api/products/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage('✅ 수정 완료: ' + data.product.name);
        clearForm();
        fetchProducts();
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 수정 실패: ' + err);
    }
    setLoading(false);
  };

  // 삭제
  const deleteProduct = async () => {
    if (!formData.id) {
      setMessage('❌ 삭제할 ID를 입력하세요');
      return;
    }
    if (!confirm(`ID ${formData.id} 상품을 삭제하시겠습니까?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${formData.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setMessage('✅ 삭제 완료: ' + data.deleted.name);
        clearForm();
        fetchProducts();
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (err) {
      setMessage('❌ 삭제 실패: ' + err);
    }
    setLoading(false);
  };

  const clearForm = () => {
    setFormData({ id: '', name: '', price: '', stock: '', category: '' });
  };

  // 테이블 행 클릭 시 폼에 데이터 채우기
  const selectProduct = (product: Product) => {
    setFormData({
      id: String(product.id),
      name: product.name,
      price: product.price,
      stock: String(product.stock),
      category: product.category || '',
    });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>📦 Products CRUD</h1>

      {/* 메시지 */}
      {message && (
        <div style={{
          padding: '10px 15px',
          marginBottom: '20px',
          borderRadius: '6px',
          backgroundColor: message.startsWith('✅') ? '#d4edda' : '#f8d7da',
          color: message.startsWith('✅') ? '#155724' : '#721c24',
        }}>
          {message}
        </div>
      )}

      {/* 입력 폼 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
        marginBottom: '15px',
      }}>
        <input
          placeholder="ID (수정/삭제용)"
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="상품명 *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="가격 *"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="재고"
          type="number"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="카테고리"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          style={inputStyle}
        />
      </div>

      {/* 버튼들 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button onClick={fetchProducts} style={{ ...btnStyle, backgroundColor: '#17a2b8' }} disabled={loading}>
          🔍 조회
        </button>
        <button onClick={createProduct} style={{ ...btnStyle, backgroundColor: '#28a745' }} disabled={loading}>
          ➕ 등록
        </button>
        <button onClick={updateProduct} style={{ ...btnStyle, backgroundColor: '#ffc107', color: '#000' }} disabled={loading}>
          ✏️ 수정
        </button>
        <button onClick={deleteProduct} style={{ ...btnStyle, backgroundColor: '#dc3545' }} disabled={loading}>
          🗑️ 삭제
        </button>
        <button onClick={clearForm} style={{ ...btnStyle, backgroundColor: '#6c757d' }}>
          🔄 초기화
        </button>
      </div>

      {/* 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>상품명</th>
            <th style={thStyle}>가격</th>
            <th style={thStyle}>재고</th>
            <th style={thStyle}>카테고리</th>
            <th style={thStyle}>생성일</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              onClick={() => selectProduct(p)}
              style={{ cursor: 'pointer' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e9ecef')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <td style={tdStyle}>{p.id}</td>
              <td style={tdStyle}>{p.name}</td>
              <td style={tdStyle}>${p.price}</td>
              <td style={tdStyle}>{p.stock}</td>
              <td style={tdStyle}>{p.category}</td>
              <td style={tdStyle}>{new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#999' }}>
                데이터가 없습니다
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px',
  fontSize: '14px',
  border: '1px solid #ddd',
  borderRadius: '4px',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: '14px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'white',
  fontWeight: 'bold',
};

const thStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6',
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid #dee2e6',
};
