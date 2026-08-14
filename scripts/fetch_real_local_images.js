const fs = require('fs');
const path = require('path');
const https = require('https');

const demoDir = path.join(__dirname, '../frontend/public/images/demo');

// Verified working Unsplash Direct URLs to download LOCALLY into the project
const downloads = {
  // Shops
  'shop_clothing_1.jpg': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  'shop_clothing_2.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85f68e?w=800&q=80',
  'shop_shoes_1.jpg': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80',
  'shop_shoes_2.jpg': 'https://images.unsplash.com/photo-1560769629-975ec94e516a?w=800&q=80',
  'shop_ornaments_1.jpg': 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
  'shop_ornaments_2.jpg': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80',
  'shop_accessories_1.jpg': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'shop_hardware_1.jpg': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',

  // Products
  'kurti_1.jpg': 'https://images.unsplash.com/photo-1610030469983-be21b0af0423?w=600&q=80',
  'kurti_2.jpg': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
  'lehenga_1.jpg': 'https://images.unsplash.com/photo-1610030469983-be21b0af0423?w=600&q=80',
  'kurta_1.jpg': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
  'sneakers_1.jpg': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  'sneakers_2.jpg': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
  'heels_1.jpg': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80',
  'school_shoes_1.jpg': 'https://images.unsplash.com/photo-1560769629-975ec94e516a?w=600&q=80',
  'necklace_1.jpg': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
  'anklets_1.jpg': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80',
  'earrings_1.jpg': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
  'handbag_1.jpg': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
  'watch_1.jpg': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80',
  'drill_1.jpg': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
};

function downloadUrl(url, destPath) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadUrl(res.headers.location, destPath).then(resolve);
      }
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`[SUCCESS] Downloaded: ${path.basename(destPath)}`);
          resolve(true);
        });
      } else {
        console.log(`[HTTP ${res.statusCode}] Skipped ${path.basename(destPath)}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`[ERROR] ${err.message}`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('Fetching local demo photo assets...');
  for (const [filename, url] of Object.entries(downloads)) {
    const target = path.join(demoDir, filename);
    await downloadUrl(url, target);
  }
  console.log('Finished downloading local images!');
}

run();
