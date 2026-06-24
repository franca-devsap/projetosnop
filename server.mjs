import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "webapp");
const mockDataPath = path.join(root, "model", "mockData.json");
const port = 8085;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

http.createServer(async (request, response) => {
  try {
    let route = decodeURIComponent(request.url.split("?")[0]);
    if (route === "/api/mock-data") {
      if (request.method === "GET") {
        const body = await readFile(mockDataPath);
        response.writeHead(200, { "Content-Type": types[".json"] });
        response.end(body);
        return;
      }
      if (request.method === "POST") {
        let body = "";
        for await (const chunk of request) {
          body += chunk;
          if (body.length > 25_000_000) {
            response.writeHead(413);
            response.end("Payload too large");
            return;
          }
        }
        const data = JSON.parse(body);
        await writeFile(mockDataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        response.writeHead(204);
        response.end();
        return;
      }
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }
    if (route === "/") {
      route = "/index.html";
    }
    const filePath = path.normalize(path.join(root, route));
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "text/plain; charset=utf-8" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`SAPUI5 prototype running at http://127.0.0.1:${port}/`);
});
