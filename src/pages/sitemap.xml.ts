// The previous site published /sitemap.xml and Search Console still holds that
// entry. Serve the same document there so the old submission keeps working.
export { prerender, GET } from "./sitemap-index.xml";
