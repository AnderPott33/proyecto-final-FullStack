// controllers/cambio.controller.js
import axios from "axios";
import cheerio from "cheerio";

export const getCambioChaco = async (req, res) => {
  try {
    const { data } = await axios.get("https://www.cambioschaco.com.py/");
    const $ = cheerio.load(data);

    let resultado = {
      USD_PYG: {},
      BRL_PYG: {},
      USD_BRL: {}
    };

    $("table tr").each((i, el) => {
      const moneda = $(el).find("td").eq(0).text().trim();
      const compra = $(el).find("td").eq(1).text().trim();
      const venta = $(el).find("td").eq(2).text().trim();

      if (moneda.includes("Dólar")) {
        resultado.USD_PYG = {
          compra: parseNum(compra),
          venta: parseNum(venta),
        };
      }

      if (moneda.includes("Real")) {
        resultado.BRL_PYG = {
          compra: parseNum(compra),
          venta: parseNum(venta),
        };
      }

      if (moneda.includes("Dólar x Real")) {
        resultado.USD_BRL = {
          compra: parseFloat(compra.replace(",", ".")),
          venta: parseFloat(venta.replace(",", ".")),
        };
      }
    });

    res.json(resultado);

  } catch (error) {
    res.status(500).json({ error: "Error scraping" });
  }
};

function parseNum(texto) {
  return parseFloat(texto.replace(/\./g, "").replace(",", "."));
}