export function aiAvailable() {
  return !!process.env.OPENAI_API_KEY || !!process.env.BOTTOMLINE_PROXY_URL;
}
