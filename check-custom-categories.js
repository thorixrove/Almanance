// Cek apakah semua file fitur Kategori custom sudah terpasang di proyek.
// Jalankan dari folder utama proyek (yang berisi package.json):
//   node check-custom-categories.js
const fs = require("fs");
const path = require("path");

// [path, teks yang HARUS ada, teks yang TIDAK boleh ada (tanda versi lama)]
const CHECKS = [
  ["types/category.ts", "CustomCategoryType"],
  ["types/index.ts", 'export * from "./category"'],
  ["lib/query/keys.ts", "categories:"],
  ["lib/services/categories.ts", "getCustomCategories", '.eq("user",'],
  ["hooks/queries/useCategoriesQuery.ts", "getCustomCategories"],
  ["hooks/mutation/useCategoryMutations.ts", "useDeleteCategory"],
  ["hooks/useCategories.ts", "getResolver"],
  ["lib/utils/categories.ts", "createCategoryResolver"],
  ["constants/categories.ts", "isBuiltInCategory"],
  ["components/TransactionRow.tsx", "useCategories", "getCategoryConfig"],
  ["components/EditTransactionModal.tsx", "useCategories", "EXPENSE_CATEGORIES"],
  ["components/CategorySheet.tsx", "getCategoryUsageCount"],
  ["app/(root)/categories.tsx", "CategorySheet"],
  ["app/(root)/(tabs)/index.tsx", "useCategories", "getCategoryConfig"],
  ["app/(root)/report.tsx", "useCategories", "getCategoryConfig"],
  ["app/(root)/(tabs)/transactions.tsx", "useCategories", "getCategoryLabel"],
  ["app/(root)/(tabs)/add-transaction.tsx", "useCategories", "EXPENSE_CATEGORIES"],
  ["app/(root)/(tabs)/assistant.tsx", "createCategoryResolver"],
  ["app/(root)/(tabs)/profile.tsx", "manageCategories"],
  ["lib/services/assistant.ts", "CategoryResolver", "getCategoryConfig"],
  ["lib/i18n/locales/en.ts", "customCategory"],
  ["lib/i18n/locales/id.ts", "customCategory"],
];

// Sidik jari isi file (sudah mengabaikan perbedaan CRLF/LF dan spasi di akhir file).
const crypto = require("crypto");
const EXPECTED = {
  "types/category.ts": "fc2a3074af",
  "types/index.ts": "97050666e3",
  "lib/query/keys.ts": "3acbfa600d",
  "lib/services/categories.ts": "6b3f2bba70",
  "hooks/queries/useCategoriesQuery.ts": "75cb6be179",
  "hooks/mutation/useCategoryMutations.ts": "c142ec9ae2",
  "hooks/useCategories.ts": "92d8e0983c",
  "lib/utils/categories.ts": "d5fb556da8",
  "constants/categories.ts": "a239fa169d",
  "components/TransactionRow.tsx": "124e65bd7c",
  "components/EditTransactionModal.tsx": "cb5831b14d",
  "components/CategorySheet.tsx": "4e14e73dda",
  "app/(root)/(tabs)/index.tsx": "aeda04dba6",
  "app/(root)/report.tsx": "ea86a180ca",
  "app/(root)/(tabs)/transactions.tsx": "faf0d4b0f9",
  "app/(root)/(tabs)/add-transaction.tsx": "84c5643534",
  "app/(root)/(tabs)/assistant.tsx": "59d3def085",
  "app/(root)/(tabs)/profile.tsx": "e1d03e8fcc",
  "lib/services/assistant.ts": "6d6b91cbaa"
};
const norm = (t) => t.replace(/\r\n/g, "\n").replace(/\s+$/, "");

let problems = 0;
for (const [file, must, mustNot] of CHECKS) {
  const full = path.join(process.cwd(), file);
  let status;
  if (!fs.existsSync(full)) {
    status = "TIDAK ADA";
  } else {
    const text = fs.readFileSync(full, "utf8");
    if (!text.includes(must)) status = `VERSI LAMA (tidak memuat "${must}")`;
    else if (mustNot && text.includes(mustNot)) status = `VERSI LAMA (masih memuat "${mustNot}")`;
    else status = "OK";
  }
  if (status !== "OK") problems++;
  console.log(`${status === "OK" ? "OK      " : "PERIKSA "} ${file}${status === "OK" ? "" : "  ->  " + status}`);
}
console.log("\n--- Perbandingan isi dengan versi terbaru ---");
let different = 0;
for (const [file, hash] of Object.entries(EXPECTED)) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) continue;
  const actual = crypto.createHash("sha256").update(norm(fs.readFileSync(full, "utf8"))).digest("hex").slice(0, 10);
  if (actual !== hash) {
    different++;
    console.log("BEDA     " + file);
  }
}
if (different === 0) console.log("Semua file identik dengan versi terbaru.");
else console.log("\n" + different + " file isinya berbeda dari versi terbaru (bisa karena belum ditimpa atau sudah kamu ubah). Kirim isi file yang BEDA.");
console.log(problems === 0 ? "\nSemua file terpasang." : `\n${problems} file perlu ditimpa dengan versi terbaru.`);