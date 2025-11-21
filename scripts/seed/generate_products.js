import fs from "fs";
import { faker } from "@faker-js/faker";

const TOTAL = 500_000;

if (!fs.existsSync("./csv")) {
  fs.mkdirSync("./csv", { recursive: true });
}

const stream = fs.createWriteStream("./csv/products.csv");

console.log("Generating products...");
for (let i = 1; i <= TOTAL; i++) {
  const brand_id = faker.number.int({ min: 1, max: 1000 });
  const supplier_id = faker.number.int({ min: 1, max: 1000 });
  const name = faker.commerce.productName().replace(/,/g, "");
  const sku = faker.string.uuid();
  const price = faker.commerce.price();

  stream.write(`${i},${brand_id},${supplier_id},${name},${sku},${price}\n`);
}
console.log("Finished generating products.");

stream.end();
