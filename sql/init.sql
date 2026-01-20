-- CRUD 테스트용 products 테이블 생성
-- Drop existing table if exists
DROP TABLE IF EXISTS products;

-- Create products table
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    price       DECIMAL(10, 2) NOT NULL,
    stock       INTEGER DEFAULT 0,
    category    VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO products (name, price, stock, category) VALUES
    ('Wireless Mouse', 29.99, 150, 'Electronics'),
    ('Mechanical Keyboard', 89.99, 75, 'Electronics'),
    ('USB-C Cable', 12.50, 500, 'Accessories'),
    ('Monitor Stand', 45.00, 30, 'Furniture'),
    ('Webcam HD', 65.00, 60, 'Electronics');

-- Verify data
SELECT * FROM products;
