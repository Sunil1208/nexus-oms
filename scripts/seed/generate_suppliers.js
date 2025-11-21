// scripts/seed/generate_suppliers.js
import fs from "fs";
import { faker } from "@faker-js/faker";

const TOTAL = 1000;
const outputPath = "csv/suppliers.csv";

if (!fs.existsSync("./csv")) {
  fs.mkdirSync("./csv", { recursive: true });
}

const stream = fs.createWriteStream(outputPath);

for (let i = 1; i <= TOTAL; i++) {
  const name = faker.company.name().replace(/,/g, "") + ` ${i}`;
  const email = `user${i}@example.com`;
  stream.write(`${i},${name},${email}\n`);
}

stream.end(() => {
  console.log(`✅ Generated ${TOTAL} suppliers into ${outputPath}`);
});
