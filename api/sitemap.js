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
  return fields[key].stringValue || "";
}

async function fetchPublishedDocs(collectionName) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath: "status" },
            op: "EQUAL",
            value: { stringValue: "published" }
          }
        }
      }
    })
  });

  if (!response.ok) {
    console.error(`Failed to fetch ${collectionName}`, await response.text());
    return [];
  }

  const data = await response.json();

  return data
    .filter((item) => item.document)
    .map((item) => item.document);
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
    const colleges = await fetchPublishedDocs("colleges");
    const contentPages = await fetchPublishedDocs("contentPages");

    const urls = [];

    STATIC_PAGES.forEach((page) => {
      urls.push(createUrlTag(page, "0.9"));
    });

    colleges.forEach((doc) => {
      const slug = getField(doc.fields, "slug");

      if (slug) {
        urls.push(
          createUrlTag(
            `https://swadeshi-shiksha.com/college.html?slug=${encodeURIComponent(slug)}`,
            "0.8"
          )
        );
      }
    });

    contentPages.forEach((doc) => {
      const slug = getField(doc.fields, "slug");

      if (slug) {
        urls.push(
          createUrlTag(
            `https://swadeshi-shiksha.com/page.html?slug=${encodeURIComponent(slug)}`,
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
