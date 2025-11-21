// scripts/seed/generate_brands.js
import fs from "fs";
import { faker } from "@faker-js/faker";

const TOTAL = 1000;
const outputPath = "csv/brands.csv";

if (!fs.existsSync("./csv")) {
  fs.mkdirSync("./csv", { recursive: true });
}

const stream = fs.createWriteStream(outputPath);

for (let i = 1; i <= TOTAL; i++) {
  const name = faker.company.name().replace(/,/g, "") + ` ${i}`;
  stream.write(`${i},${name}\n`);
}

stream.end(() => {
  console.log(`✅ Generated ${TOTAL} brands into ${outputPath}`);
});
