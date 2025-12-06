import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = "https://newsapi.org/v2";

export const newsApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    "X-Api-Key": process.env.NEWS_API_KEY || "",
  },
});
