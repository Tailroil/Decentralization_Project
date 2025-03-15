import fs from "fs";
import csvParser from "csv-parser";
import pool from "../config/db";

async function importCsv() {
  const results: { pays: string; empreinte: number }[] = [];

  fs.createReadStream("./data/data.csv")
    .pipe(csvParser())
    .on("data", (row) => {
      results.push({ pays: row.Pays, empreinte: Number(row.Empreinte) });
    })
    .on("end", async () => {
      for (const country of results) {
        await pool.query(
          "INSERT INTO empreinte_pays (pays, empreinte) VALUES ($1, $2) ON CONFLICT (pays) DO NOTHING",
          [country.pays, country.empreinte]
        );
      }
      console.log("Importation terminée !");
      pool.end();
    });
}

importCsv();
