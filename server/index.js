import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sqlite = sqlite3.verbose();

const app = express();
const dbPath = resolve(__dirname, 'db.sqlite');
const db = new sqlite.Database(dbPath);

app.use(cors());
app.use(express.json());

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    productName TEXT,
    productType TEXT,
    dimensions TEXT,
    quantity INTEGER,
    date TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS conrods (
    id TEXT PRIMARY KEY,
    srNo INTEGER,
    name TEXT,
    dimensions TEXT,
    pin TEXT,
    ballBearing TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS production (
    id TEXT PRIMARY KEY,
    conrodId TEXT,
    quantity INTEGER,
    size TEXT,
    date TEXT
  )`);
  // Ensure size column exists in existing production table
  db.run(`ALTER TABLE production ADD COLUMN size TEXT`, err => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
  });
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    invoiceNo TEXT,
    customerId TEXT,
    productId TEXT,
    quantity INTEGER,
    amount REAL,
    date TEXT
  )`);
  // Ensure date column exists in existing table
  db.run(`ALTER TABLE bills ADD COLUMN date TEXT`, err => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
  });
});

// Products endpoints
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const products = rows.map(r => ({
      id: r.id,
      productName: r.productName,
      productType: r.productType,
      dimensions: JSON.parse(r.dimensions),
      quantity: r.quantity,
      date: r.date,
    }));
    res.json(products);
  });
});

app.post('/api/products', (req, res) => {
  const { productName, productType, dimensions, quantity, date } = req.body;
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO products (id, productName, productType, dimensions, quantity, date) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(id, productName, productType, JSON.stringify(dimensions), quantity, date, err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, productName, productType, dimensions, quantity, date });
  });
});

app.patch('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  db.run('UPDATE products SET quantity = ? WHERE id = ?', [quantity, id], err => {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      const product = {
        id: row.id,
        productName: row.productName,
        productType: row.productType,
        dimensions: JSON.parse(row.dimensions),
        quantity: row.quantity,
        date: row.date,
      };
      res.json(product);
    });
  });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
});

// Conrods endpoints
app.get('/api/conrods', (req, res) => {
  db.all('SELECT * FROM conrods', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const conrods = rows.map(r => ({
      id: r.id,
      srNo: r.srNo,
      name: r.name,
      dimensions: JSON.parse(r.dimensions),
      pin: r.pin,
      ballBearing: r.ballBearing,
    }));
    res.json(conrods);
  });
});

app.post('/api/conrods', (req, res) => {
  const { name, dimensions, pin, ballBearing } = req.body;
  const id = uuidv4();
  
  // Find the max srNo and increment by 1 for the new record
  db.get('SELECT MAX(srNo) as maxSrNo FROM conrods', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Start from 1 if no records exist, otherwise increment max by 1
    const srNo = (row.maxSrNo || 0) + 1;
    
    // Verify srNo is unique before insertion
    db.get('SELECT id FROM conrods WHERE srNo = ?', [srNo], (checkErr, checkRow) => {
      if (checkErr) return res.status(500).json({ error: checkErr.message });
      
      if (checkRow) {
        return res.status(400).json({ error: `Serial number ${srNo} already exists. Please try again.` });
      }
    
      // Insert the new conrod with unique srNo
      const stmt = db.prepare('INSERT INTO conrods (id, srNo, name, dimensions, pin, ballBearing) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run(id, srNo, name, JSON.stringify(dimensions), pin, ballBearing, insertErr => {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        res.json({ id, srNo, name, dimensions, pin, ballBearing });
      });
    });
  });
});

app.patch('/api/conrods/:id', (req, res) => {
  const { id } = req.params;
  const { name, dimensions, pin, ballBearing } = req.body;
  const stmt = db.prepare(
    'UPDATE conrods SET name = ?, dimensions = ?, pin = ?, ballBearing = ? WHERE id = ?'
  );
  stmt.run(
    name,
    JSON.stringify(dimensions),
    pin,
    ballBearing,
    id,
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM conrods WHERE id = ?', [id], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        if (!row) return res.status(404).json({ error: 'Conrod not found' });
        res.json({
          id: row.id,
          srNo: row.srNo,
          name: row.name,
          dimensions: JSON.parse(row.dimensions),
          pin: row.pin,
          ballBearing: row.ballBearing
        });
      });
    }
  );
});

app.delete('/api/conrods/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM conrods WHERE id = ?', [id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
});

// Production endpoints
app.get('/api/production', (req, res) => {
  db.all('SELECT * FROM production', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const production = rows.map(r => ({ id: r.id, conrodId: r.conrodId, quantity: r.quantity, size: r.size, date: r.date }));
    res.json(production);
  });
});

app.post('/api/production', (req, res) => {
  const { conrodId, quantity, size, date } = req.body;
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO production (id, conrodId, quantity, size, date) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, conrodId, quantity, size || null, date, err => {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM production WHERE id = ?', [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ id: row.id, conrodId: row.conrodId, quantity: row.quantity, size: row.size, date: row.date });
    });
  });
});

app.patch('/api/production/:id', (req, res) => {
  const { id } = req.params;
  const { quantity, size } = req.body;
  let updateQuery = 'UPDATE production SET quantity = ?';
  let params = [quantity];
  
  if (size !== undefined) {
    updateQuery += ', size = ?';
    params.push(size);
  }
  
  updateQuery += ' WHERE id = ?';
  params.push(id);
  
  db.run(updateQuery, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM production WHERE id = ?', [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ id: row.id, conrodId: row.conrodId, quantity: row.quantity, size: row.size, date: row.date });
    });
  });
});

app.delete('/api/production/:id', (req, res) => {
  const { id } = req.params;
  // Note: As discussed, deleting production doesn't automatically revert raw materials
  // because the creation didn't deduct them. We just delete the record.
  db.run('DELETE FROM production WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Production record not found' });
    res.json({ id });
  });
});

// Billing endpoints
app.get('/api/bills', (req, res) => {
  db.all('SELECT * FROM bills', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const bills = rows.map(r => ({ id: r.id, invoiceNo: r.invoiceNo, customerId: r.customerId, productId: r.productId, quantity: r.quantity, amount: r.amount, date: r.date }));
    res.json(bills);
  });
});

// Customers endpoints
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', (req, res) => {
  const { name, address } = req.body;
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO customers (id, name, address) VALUES (?, ?, ?)');
  stmt.run(id, name, address, err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, name, address });
  });
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Customer not found' });
    res.json({ id });
  });
});

app.post('/api/bills', (req, res) => {
  const { invoiceNo, customerId, productId, quantity, amount, date } = req.body;
  const dateVal = date || new Date().toISOString();
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO bills (id, invoiceNo, customerId, productId, quantity, amount, date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(id, invoiceNo, customerId || null, productId, quantity, amount, dateVal, err => {
    if (err) return res.status(500).json({ error: err.message });
    // Deduct from production quantity
    db.run('UPDATE production SET quantity = quantity - ? WHERE id = ?', [quantity, productId], err2 => {
      if (err2) console.error(err2);
      res.json({ id, invoiceNo, customerId, productId, quantity, amount, date: dateVal });
    });
  });
});

app.delete('/api/bills/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT productId, quantity FROM bills WHERE id = ?', [id], (err, bill) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    db.serialize(() => {
      db.run('DELETE FROM bills WHERE id = ?', [id], function(err) {
        if (err) {
          db.rollback();
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) { // Should not happen due to check above, but safety first
            db.rollback();
            return res.status(404).json({ message: 'Bill not found during delete' });
        }

        // Revert quantity in production table
        db.run('UPDATE production SET quantity = quantity + ? WHERE id = ?', [bill.quantity, bill.productId], function(err) {
          if (err) {
            db.rollback();
            return res.status(500).json({ error: err.message });
          }
          // Optionally check if production record was found (this.changes > 0)
          // Fetch the updated production record to return it
          db.get('SELECT * FROM production WHERE id = ?', [bill.productId], (err, updatedProd) => {
              if (err) {
                 db.rollback();
                 return res.status(500).json({ error: err.message });
              }
              const productionRecord = updatedProd ? {
                 id: updatedProd.id,
                 conrodId: updatedProd.conrodId,
                 quantity: updatedProd.quantity,
                 size: updatedProd.size,
                 date: updatedProd.date
              } : null; // Production record might have been deleted elsewhere
              res.json({ deletedBillId: id, updatedProductionRecord: productionRecord });
          });
        });
      });
    });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
