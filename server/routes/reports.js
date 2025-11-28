const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');

// Get item sales report
router.get('/item-sales', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const report = await db.promisify.all(
      `SELECT 
        i.id,
        i.name as item,
        COALESCE(SUM(oi.quantity), 0) as sold,
        i.cost_per_item,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_cost
       FROM items i
       LEFT JOIN order_items oi ON i.id = oi.item_id
       LEFT JOIN orders o ON oi.order_id = o.id
         AND o.payment_status = 'paid'
         AND o.created_at BETWEEN ? AND ?
       GROUP BY i.id, i.name, i.cost_per_item
       HAVING sold > 0
       ORDER BY total_cost DESC`,
      [startDate, endDate]
    );

    const formattedReport = report.map((row, index) => ({
      number: index + 1,
      item: row.item,
      sold: row.sold,
      cost_per_item: row.cost_per_item,
      total_cost: row.total_cost
    }));

    res.json(formattedReport);
  } catch (error) {
    res.status(500).json({ error: 'Error generating item sales report', message: error.message });
  }
});

// Get waiter/cashier/bartender report
router.get('/staff-sales', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const report = await db.promisify.all(
      `SELECT 
        u.id,
        u.full_name AS account,
        COALESCE(SUM(CASE WHEN o.payment_method = 'cash' THEN o.total_amount ELSE 0 END), 0) AS cash,
        COALESCE(SUM(CASE WHEN o.payment_method = 'mpesa' THEN o.total_amount ELSE 0 END), 0) AS mpesa,
        COALESCE(SUM(o.total_amount), 0) AS total_sales
       FROM users u
       LEFT JOIN orders o ON u.id = o.waiter_id 
         AND o.payment_status = 'paid'
         AND o.created_at BETWEEN ? AND ?
       WHERE u.role IN ('waiter', 'cashier', 'bartender') AND u.is_active = 1
       GROUP BY u.id, u.full_name
       HAVING total_sales > 0
       ORDER BY total_sales DESC`,
      [startDate, endDate]
    );

    const formattedReport = report.map((row, index) => ({
      number: index + 1,
      account: row.account,
      cash: row.cash,
      mpesa: row.mpesa,
      total_sales: row.total_sales
    }));

    res.json(formattedReport);
  } catch (error) {
    res.status(500).json({ error: 'Error generating staff sales report', message: error.message });
  }
});

// Export item sales report as Excel
router.get('/item-sales/export/excel', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const report = await db.promisify.all(
      `SELECT 
        i.name as item,
        COALESCE(SUM(oi.quantity), 0) as sold,
        i.cost_per_item,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_cost
       FROM items i
       LEFT JOIN order_items oi ON i.id = oi.item_id
       LEFT JOIN orders o ON oi.order_id = o.id
         AND o.payment_status = 'paid'
         AND o.created_at BETWEEN ? AND ?
       GROUP BY i.id, i.name, i.cost_per_item
       HAVING sold > 0
       ORDER BY total_cost DESC`,
      [startDate, endDate]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Item Sales');

    worksheet.columns = [
      { header: 'NUMBER', key: 'number', width: 10 },
      { header: 'ITEM', key: 'item', width: 30 },
      { header: 'SOLD', key: 'sold', width: 10 },
      { header: 'COST PER ITEM', key: 'cost_per_item', width: 15 },
      { header: 'TOTAL COST', key: 'total_cost', width: 15 }
    ];

    report.forEach((row, index) => {
      worksheet.addRow({
        number: index + 1,
        item: row.item,
        sold: row.sold,
        cost_per_item: row.cost_per_item,
        total_cost: row.total_cost
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=item-sales.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Error exporting report', message: error.message });
  }
});

// Export staff sales report as Excel
router.get('/staff-sales/export/excel', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const report = await db.promisify.all(
      `SELECT 
        u.full_name AS account,
        COALESCE(SUM(CASE WHEN o.payment_method = 'cash' THEN o.total_amount ELSE 0 END), 0) AS cash,
        COALESCE(SUM(CASE WHEN o.payment_method = 'mpesa' THEN o.total_amount ELSE 0 END), 0) AS mpesa,
        COALESCE(SUM(o.total_amount), 0) AS total_sales
       FROM users u
       LEFT JOIN orders o ON u.id = o.waiter_id 
         AND o.payment_status = 'paid'
         AND o.created_at BETWEEN ? AND ?
       WHERE u.role IN ('waiter', 'cashier', 'bartender') AND u.is_active = 1
       GROUP BY u.id, u.full_name
       HAVING total_sales > 0
       ORDER BY total_sales DESC`,
      [startDate, endDate]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Staff Sales');

    worksheet.columns = [
      { header: 'NUMBER', key: 'number', width: 10 },
      { header: 'ACCOUNT', key: 'account', width: 20 },
      { header: 'CASH', key: 'cash', width: 15 },
      { header: 'MPESA', key: 'mpesa', width: 15 },
      { header: 'TOTAL SALES', key: 'total_sales', width: 15 }
    ];

    report.forEach((row, index) => {
      worksheet.addRow({
        number: index + 1,
        account: row.account,
        cash: row.cash,
        mpesa: row.mpesa,
        total_sales: row.total_sales
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=staff-sales.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Error exporting report', message: error.message });
  }
});

// Export item sales report as PDF
router.get('/item-sales/export/pdf', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const report = await db.promisify.all(
      `SELECT 
        i.name as item,
        COALESCE(SUM(oi.quantity), 0) as sold,
        i.cost_per_item,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_cost
       FROM items i
       LEFT JOIN order_items oi ON i.id = oi.item_id
       LEFT JOIN orders o ON oi.order_id = o.id
         AND o.payment_status = 'paid'
         AND o.created_at BETWEEN ? AND ?
       GROUP BY i.id, i.name, i.cost_per_item
       HAVING sold > 0
       ORDER BY total_cost DESC`,
      [startDate, endDate]
    );

    const doc = new jsPDF();
    doc.text('Item Sales Report', 14, 15);
    
    const tableData = report.map((row, index) => [
      index + 1,
      row.item,
      row.sold,
      row.cost_per_item.toFixed(2),
      row.total_cost.toFixed(2)
    ]);

    autoTable(doc, {
      head: [['NUMBER', 'ITEM', 'SOLD', 'COST PER ITEM', 'TOTAL COST']],
      body: tableData,
      startY: 25
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=item-sales.pdf');
    res.send(Buffer.from(doc.output('arraybuffer')));
  } catch (error) {
    res.status(500).json({ error: 'Error exporting report', message: error.message });
  }
});

// Export staff sales report as PDF
router.get('/staff-sales/export/pdf', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const report = await db.promisify.all(
      `SELECT 
        u.full_name AS account,
        COALESCE(SUM(CASE WHEN o.payment_method = 'cash' THEN o.total_amount ELSE 0 END), 0) AS cash,
        COALESCE(SUM(CASE WHEN o.payment_method = 'mpesa' THEN o.total_amount ELSE 0 END), 0) AS mpesa,
        COALESCE(SUM(o.total_amount), 0) AS total_sales
       FROM users u
       LEFT JOIN orders o ON u.id = o.waiter_id 
         AND o.payment_status = 'paid'
         AND o.created_at BETWEEN ? AND ?
       WHERE u.role IN ('waiter', 'cashier', 'bartender') AND u.is_active = 1
       GROUP BY u.id, u.full_name
       HAVING total_sales > 0
       ORDER BY total_sales DESC`,
      [startDate, endDate]
    );

    const doc = new jsPDF();
    doc.text('Staff Sales Report', 14, 15);
    
    const tableData = report.map((row, index) => [
      index + 1,
      row.account,
      row.cash.toFixed(2),
      row.mpesa.toFixed(2),
      row.total_sales.toFixed(2)
    ]);

    autoTable(doc, {
      head: [['NUMBER', 'ACCOUNT', 'CASH', 'MPESA', 'TOTAL SALES']],
      body: tableData,
      startY: 25
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=staff-sales.pdf');
    res.send(Buffer.from(doc.output('arraybuffer')));
  } catch (error) {
    res.status(500).json({ error: 'Error exporting report', message: error.message });
  }
});

module.exports = router;

