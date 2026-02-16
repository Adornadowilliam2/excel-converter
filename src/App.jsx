import { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [output, setOutput] = useState("");

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(1); // skip header row

      // Convert Excel rows to SQL VALUES format
      const formatted = rows
        .filter((row) => row.length >= 2) // only rows with at least 2 columns
        .map((row) => `('${row[0]}', ${row[1]})`) // create SQL tuples
        .join(", ");

      // Build full SQL script
      const sql = `
USE [posdb];
GO

-- Inline table of new values
WITH NewValues (barcode, price1) AS (
    SELECT * FROM (VALUES
        ${formatted}
    ) AS v(barcode, price1)
)
UPDATE i
SET i.price1 = nv.price1
FROM [dbo].[ITEMS] i
INNER JOIN NewValues nv
ON i.barcode = nv.barcode;
  `;

      setOutput(sql); // send the full SQL to your output
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTextFile = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Excel to Text File Converter</h2>
      <input type="file" accept=".xls,.xlsx" onChange={handleFile} />
      <button onClick={downloadTextFile} style={{ marginLeft: "10px" }}>
        Download TXT
      </button>
      <pre style={{ marginTop: "20px", whiteSpace: "pre-wrap" }}>{output}</pre>
    </div>
  );
}

export default App;
