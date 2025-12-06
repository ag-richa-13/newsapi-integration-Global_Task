import fs from "fs";
import path from "path";

const cacheFilePath = path.join(__dirname, "../../data/newsCache.json");

export const readCache = () => {
  try {
    const data = fs.readFileSync(cacheFilePath, "utf8");
    return JSON.parse(data);
  } catch {
    return { topHeadlines: [], everything: [] };
  }
};

export const writeCache = (cache: any) => {
  fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
};
