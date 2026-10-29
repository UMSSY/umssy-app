import { describe, expect, it } from "vitest";
import {
  isSafeHttpUrl,
  cleanTrailingPunctuation,
  parseMessageWithLinks,
  extractFirstValidUrl,
  extractDomainFromUrl,
} from "../utils/link-parser";

describe("link-parser utility (HU-11 Task 5)", () => {
  describe("isSafeHttpUrl", () => {
    it("acepta URLs validas con http y https", () => {
      expect(isSafeHttpUrl("https://umss.edu.bo")).toBe(true);
      expect(isSafeHttpUrl("http://localhost:3000/chat")).toBe(true);
      expect(isSafeHttpUrl("https://github.com/UMSSY/umssy-app")).toBe(true);
    });

    it("bloquea esquemas peligrosos o no soportados", () => {
      expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeHttpUrl("file:///etc/passwd")).toBe(false);
      expect(isSafeHttpUrl("ftp://ftp.example.com")).toBe(false);
      expect(isSafeHttpUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isSafeHttpUrl("")).toBe(false);
      expect(isSafeHttpUrl("   ")).toBe(false);
      expect(isSafeHttpUrl("not-a-url")).toBe(false);
    });
  });

  describe("cleanTrailingPunctuation", () => {
    it("separa puntos, comas y signos de interrogacion al final de una URL", () => {
      expect(cleanTrailingPunctuation("https://umss.edu.bo.")).toEqual({
        url: "https://umss.edu.bo",
        trailing: ".",
      });
      expect(cleanTrailingPunctuation("https://umss.edu.bo,")).toEqual({
        url: "https://umss.edu.bo",
        trailing: ",",
      });
      expect(cleanTrailingPunctuation("https://umss.edu.bo!?")).toEqual({
        url: "https://umss.edu.bo",
        trailing: "!?",
      });
    });

    it("preserva parentesis balanceados de Wikipedia y remueve parentesis finales de cierre si no hay apertura", () => {
      expect(
        cleanTrailingPunctuation("https://es.wikipedia.org/wiki/React_(software)")
      ).toEqual({
        url: "https://es.wikipedia.org/wiki/React_(software)",
        trailing: "",
      });

      expect(cleanTrailingPunctuation("https://umss.edu.bo)")).toEqual({
        url: "https://umss.edu.bo",
        trailing: ")",
      });
    });
  });

  describe("parseMessageWithLinks", () => {
    it("devuelve un solo segmento de texto si no hay URLs", () => {
      const segments = parseMessageWithLinks("Hola, que tal?");
      expect(segments).toEqual([
        { type: "text", content: "Hola, que tal?" },
      ]);
    });

    it("separa URLs validas en segmentos de enlace con su URL", () => {
      const text = "Revisa https://umss.edu.bo para mas informacion.";
      const segments = parseMessageWithLinks(text);

      expect(segments).toEqual([
        { type: "text", content: "Revisa " },
        { type: "link", content: "https://umss.edu.bo", url: "https://umss.edu.bo" },
        { type: "text", content: " para mas informacion." },
      ]);
    });

    it("mantiene esquemas no permitidos como javascript: en texto plano sin enlace", () => {
      const text = "Prueba javascript:alert('xss') en tu navegador";
      const segments = parseMessageWithLinks(text);

      expect(segments).toEqual([
        {
          type: "text",
          content: "Prueba javascript:alert('xss') en tu navegador",
        },
      ]);
    });

    it("identifica multiples URLs en un mensaje conservando todas como enlaces", () => {
      const text = "Mira https://umss.edu.bo y tambien http://example.com/test final.";
      const segments = parseMessageWithLinks(text);

      expect(segments).toHaveLength(5);
      expect(segments[1]).toEqual({
        type: "link",
        content: "https://umss.edu.bo",
        url: "https://umss.edu.bo",
      });
      expect(segments[3]).toEqual({
        type: "link",
        content: "http://example.com/test",
        url: "http://example.com/test",
      });
    });
  });

  describe("extractFirstValidUrl", () => {
    it("extrae la primera URL valida cuando hay una o mas URLs", () => {
      expect(extractFirstValidUrl("Visita https://primero.com y https://segundo.com")).toBe(
        "https://primero.com"
      );
    });

    it("retorna null si no hay URLs validas", () => {
      expect(extractFirstValidUrl("Solo texto sin enlaces")).toBeNull();
      expect(extractFirstValidUrl("Solo javascript:alert(1)")).toBeNull();
      expect(extractFirstValidUrl("")).toBeNull();
    });
  });

  describe("extractDomainFromUrl", () => {
    it("extrae el dominio limpio sin www", () => {
      expect(extractDomainFromUrl("https://www.umss.edu.bo/carreras")).toBe("umss.edu.bo");
      expect(extractDomainFromUrl("https://github.com/login")).toBe("github.com");
      expect(extractDomainFromUrl("invalido")).toBeNull();
    });
  });
});

