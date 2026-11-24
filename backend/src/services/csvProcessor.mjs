const REQUIRED_COLUMNS = [
  "product_id",
  "product_name",
  "quantity",
  "unit_price"
];

export function processCSV(csvContent) {
  const lines = csvContent.trim().split(/\r?\n/);
  const headers = lines.shift().split(",").map(h => h.trim());

  const missingColumns = REQUIRED_COLUMNS.filter(
    column => !headers.includes(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required columns: ${missingColumns.join(", ")}`
    );
  }

  const stats = {
    total_rows: 0,
    valid_rows: 0,
    invalid_rows: 0,
    total_revenue: 0,
    distinct_products: 0
  };

  const products = new Set();
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    stats.total_rows++;

    const values = lines[i].split(",");
    const row = Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index]?.trim()
      ])
    );

    const quantity = Number(row.quantity);
    const unitPrice = Number(row.unit_price);

    if (
      values.length !== headers.length ||
      !row.product_id ||
      !row.product_name ||
      !row.quantity ||
      !row.unit_price ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      stats.invalid_rows++;
      errors.push({
        line: i + 2,
        reason: "Invalid product data, quantity or price"
      });
      continue;
    }

    stats.valid_rows++;
    stats.total_revenue += quantity * unitPrice;
    products.add(row.product_id);
  }

  stats.total_revenue =
    Math.round(stats.total_revenue * 100) / 100;

  stats.distinct_products = products.size;

  return {
    status: "COMPLETED",
    statistics: stats,
    errors
  };
}