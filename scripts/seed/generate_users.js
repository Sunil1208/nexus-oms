import fs from "fs";
import { faker } from "@faker-js/faker";

const TOTAL = 1_000_000;

if (!fs.existsSync("./csv")) {
  fs.mkdirSync("./csv", { recursive: true });
}

const stream = fs.createWriteStream("./csv/users.csv");

function generate() {
  let i = TOTAL;

  function write() {
    let ok = true;

    while (i > 0 && ok) {
      const id = TOTAL - i + 1;
      const full_name = faker.person.fullName().replace(/,/g, "");
      const email = `user${id}@example.com`;
      const phone = faker.phone.number().replace(/,/g, "");

      const row = `${id},${full_name},${email},${phone}\n`;

      i--;
      ok = stream.write(row);
    }

    if (i === 0) stream.end();
    else stream.once("drain", write);
  }

  write();
}

generate();
