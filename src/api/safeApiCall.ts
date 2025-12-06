export const safeApiCall = async (promise: Promise<any>, fallback: any) => {
  try {
    const res = await promise;
    return { data: res.data, timeout: false, error: false };
  } catch (err: any) {
    console.log("Safe API Call Error:", err.code || err.message);

    if (err.code === "ECONNABORTED") {
      // timeout
      return { data: { articles: fallback }, timeout: true, error: false };
    }

    return { data: { articles: fallback }, timeout: false, error: true };
  }
};
