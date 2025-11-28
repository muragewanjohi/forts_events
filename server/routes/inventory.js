const express = require('express');
const router = express.Router();
const multer = require('multer');
const Item = require('../models/Item');
const Category = require('../models/Category');
const { authenticate, requireRole } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx) are allowed'));
    }
  }
});

// Get all items
router.get('/', authenticate, async (req, res) => {
  try {
    const { category_id, search } = req.query;
    const filters = {};
    if (category_id) filters.category_id = category_id;
    if (search) filters.search = search;

    const items = await Item.findAll(filters);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching items', message: error.message });
  }
});

// Get item by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching item', message: error.message });
  }
});

// Create new item (Admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, sku, cost_per_item, category_id, stock_main_store } = req.body;

    if (!name || !cost_per_item) {
      return res.status(400).json({ error: 'Name and cost_per_item are required' });
    }

    const item = await Item.create({
      name,
      sku,
      cost_per_item,
      category_id: category_id || null,
      stock_main_store: stock_main_store || 0
    });

    res.status(201).json(item);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Error creating item', message: error.message });
  }
});

// Update item (Admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, cost_per_item, category_id, stock_main_store, stock_bar, stock_counter } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (cost_per_item !== undefined) updateData.cost_per_item = cost_per_item;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (stock_main_store !== undefined) updateData.stock_main_store = stock_main_store;
    if (stock_bar !== undefined) updateData.stock_bar = stock_bar;
    if (stock_counter !== undefined) updateData.stock_counter = stock_counter;

    const item = await Item.update(id, updateData);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error updating item', message: error.message });
  }
});

// Update stock
router.patch('/:id/stock', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { location, quantity } = req.body;

    if (!location || quantity === undefined) {
      return res.status(400).json({ error: 'Location and quantity are required' });
    }

    const item = await Item.updateStock(id, location, quantity);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error updating stock', message: error.message });
  }
});

// Get low stock items
router.get('/reports/low-stock', authenticate, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const items = await Item.getLowStock(threshold);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching low stock items', message: error.message });
  }
});

// Get out of stock items
router.get('/reports/out-of-stock', authenticate, async (req, res) => {
  try {
    const items = await Item.getOutOfStock();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching out of stock items', message: error.message });
  }
});

// Download import template
router.get('/import/template', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Items');

    // Headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Cost Per Item', key: 'cost_per_item', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Stock (Main Store)', key: 'stock_main_store', width: 18 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add example rows
    worksheet.addRow({
      name: 'Example Item 1',
      sku: 'EX001',
      cost_per_item: 100.00,
      category: 'Drinks',
      stock_main_store: 50
    });

    worksheet.addRow({
      name: 'Example Item 2',
      sku: 'EX002',
      cost_per_item: 250.00,
      category: 'Food',
      stock_main_store: 30
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-import-template.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Error generating template', message: error.message });
  }
});

// Bulk import items
router.post('/import', authenticate, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Get all categories for lookup
    const categories = await Category.findAll();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id;
    });

    // Skip header row, start from row 2
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Skip empty rows
      if (!row.getCell(1).value) continue;

      try {
        const name = row.getCell(1).value?.toString().trim();
        const sku = row.getCell(2).value?.toString().trim() || null;
        const costPerItem = parseFloat(row.getCell(3).value);
        const categoryName = row.getCell(4).value?.toString().trim() || null;
        const stockMainStore = parseInt(row.getCell(5).value) || 0;

        if (!name || !costPerItem || isNaN(costPerItem)) {
          results.failed++;
          results.errors.push(`Row ${rowNumber}: Missing required fields (Name, Cost Per Item)`);
          continue;
        }

        // Find or create category
        let categoryId = null;
        if (categoryName) {
          const categoryKey = categoryName.toLowerCase();
          if (categoryMap[categoryKey]) {
            categoryId = categoryMap[categoryKey];
          } else {
            // Create new category
            const newCategory = await Category.create({ name: categoryName });
            categoryId = newCategory.id;
            categoryMap[categoryKey] = categoryId;
          }
        }

        // Create item
        await Item.create({
          name,
          sku,
          cost_per_item: costPerItem,
          category_id: categoryId,
          stock_main_store: stockMainStore
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: `Import completed: ${results.success} successful, ${results.failed} failed`,
      results
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Error importing items', message: error.message });
  }
});

module.exports = router;
