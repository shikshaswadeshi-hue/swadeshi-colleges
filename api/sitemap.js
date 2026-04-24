const PROJECT_ID = "swadeshi-shiksha";

const STATIC_PAGES = [
  "https://swadeshi-shiksha.com/",
  "https://swadeshi-shiksha.com/exams.html",
  "https://swadeshi-shiksha.com/courses.html",
  "https://swadeshi-shiksha.com/resources.html",
  "https://swadeshi-shiksha.com/colleges.html",
  "https://swadeshi-shiksha.com/about-us.html",
  "https://swadeshi-shiksha.com/contact-us.html",
  "https://swadeshi-shiksha.com/privacy-policy.html"
];

function getField(fields, key) {
  if (!fields || !fields[key]) return "";

  const value = fields[key];

  return (
    value.stringValue ||
    value.integerValue ||
    value.doubleValue ||
    value.booleanValue ||
    ""
  );
}

async function fetchCollection(collectionName) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}`;

  const response = await fetch(url);

  if (!response.ok) {
    console.error(`Failed to fetch ${collectionName}`);
    return [];
  }

  const data = await response.json();
  return data.documents || [];
}

function createUrlTag(url, priority = "0.8") {
  return `
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export default async function handler(req, res) {
  try {
    const colleges = await fetchCollection("colleges");
    const contentPages = await fetchCollection("contentPages");

    const urls = [];

    STATIC_PAGES.forEach((page) => {
      urls.push(createUrlTag(page, "0.9"));
    });

    colleges.forEach((doc) => {
      const fields = doc.fields || {};
      const slug = getField(fields, "slug");

      if (slug) {
        urls.push(
          createUrlTag(
            `https://swadeshi-shiksha.com/college.html?slug=${slug}`,
            "0.8"
          )
        );
      }
    });

    contentPages.forEach((doc) => {
      const fields = doc.fields || {};
      const slug = getField(fields, "slug");

      if (slug) {
        urls.push(
          createUrlTag(
            `https://swadeshi-shiksha.com/page.html?slug=${slug}`,
            "0.8"
          )
        );
      }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(sitemap);
  } catch (error) {
    console.error("Sitemap error:", error);
    res.status(500).send("Sitemap generation failed");
  }
}
