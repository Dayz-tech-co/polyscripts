function csvCell(value) {
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function download(contents, filename, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function profileRows(data) {
  const positionRows = (data.positions || []).map((item) => ({
    section: "open_position",
    market: item.market,
    category: item.category,
    side: item.side,
    value: item.currentValue,
    pnl: item.pnl,
    price: item.currentPrice,
    shares: item.shares,
    date: item.closeDate,
  }));
  const historyRows = (data.resolvedPositions || []).map((item) => ({
    section: "resolved_position",
    market: item.market,
    category: item.category,
    side: item.side,
    value: item.returned,
    pnl: item.pnl,
    price: item.averagePrice,
    shares: item.shares,
    date: item.closeDate,
  }));
  const activityRows = (data.activity || []).map((item) => ({
    section: "activity",
    market: item.market,
    category: item.category,
    side: item.side,
    value: item.amount,
    pnl: null,
    price: item.price,
    shares: item.shares,
    date: item.timestamp ? new Date(item.timestamp).toISOString() : null,
  }));
  return [...positionRows, ...historyRows, ...activityRows];
}

export function downloadProfileCsv(data) {
  if (!data?.account) return;
  const columns = ["section", "market", "category", "side", "value_usd", "pnl_usd", "price", "shares", "date"];
  const rows = profileRows(data).map((row) => [
    row.section,
    row.market,
    row.category,
    row.side,
    row.value,
    row.pnl,
    row.price,
    row.shares,
    row.date,
  ]);
  const csv = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const label = data.account.username || data.account.address.slice(0, 10);
  download(csv, `polyscripts-${label}.csv`, "text/csv;charset=utf-8");
}
