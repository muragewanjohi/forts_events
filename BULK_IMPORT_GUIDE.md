# Bulk Import Guide

## Overview

The inventory system supports bulk importing items from Excel files. This allows you to quickly add multiple items at once.

## Steps to Import

### 1. Download the Template

1. Go to **Inventory** page
2. Click **"📥 Download Template"** button
3. The template file `inventory-import-template.xlsx` will be downloaded

### 2. Fill in the Template

Open the Excel file and fill in your items. The template has the following columns:

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| **Name** | Item name | Yes | "MANYATTA" |
| **SKU** | Stock Keeping Unit (optional, must be unique) | No | "MANY001" |
| **Cost Per Item** | Price per unit | Yes | 350.00 |
| **Category** | Category name (will be created if doesn't exist) | No | "Drinks" |
| **Stock (Main Store)** | Initial stock in main store | No | 100 |

### 3. Import the File

1. Go to **Inventory** page
2. Click **"📤 Bulk Import"** button
3. Select your filled Excel file
4. Click **"Import"**
5. Wait for the import to complete
6. Review the results message

## Template Format

The template includes example rows showing the correct format:

```
Name              | SKU    | Cost Per Item | Category | Stock (Main Store)
Example Item 1    | EX001  | 100.00       | Drinks   | 50
Example Item 2    | EX002  | 250.00       | Food     | 30
```

## Important Notes

1. **Required Fields**: Name and Cost Per Item are required
2. **SKU Uniqueness**: If SKU is provided, it must be unique
3. **Categories**: Categories will be automatically created if they don't exist
4. **File Format**: Only `.xlsx` files are supported
5. **Errors**: If some rows fail, the import will continue with other rows and show you which ones failed

## Category Management

Before importing, you can:
1. Go to **Categories** page (Admin menu)
2. Create categories that you'll use in your import
3. Or let the system create them automatically during import

## Troubleshooting

**Import fails:**
- Check that the file is `.xlsx` format
- Ensure required columns (Name, Cost Per Item) are filled
- Check for duplicate SKUs
- Review error messages in the import results

**Categories not created:**
- Ensure category name is spelled correctly
- Category names are case-sensitive during import but will be normalized

**Some rows skipped:**
- Check the error messages in the import results
- Common issues: missing required fields, invalid numbers, duplicate SKUs

