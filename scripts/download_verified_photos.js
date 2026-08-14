const fs = require('fs');
const path = require('path');
const https = require('https');

const demoDir = path.join(__dirname, '../frontend/public/images/demo');
if (!fs.existsSync(demoDir)) {
  fs.mkdirSync(demoDir, { recursive: true });
}

// Guaranteed verified realistic high-res e-commerce photos
// Direct Unsplash source URLs with reliable image parameters
const photoSources = {
  // Shops
  'shop_clothing_1.jpg': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
  'shop_clothing_2.jpg': 'https://images.unsplash.com/photo-1558618666-fcd25c85f68e?w=800&q=80',
  'shop_shoes_1.jpg': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80',
  'shop_shoes_2.jpg': 'https://images.unsplash.com/photo-1560769629-975ec94e516a?w=800&q=80',
  'shop_ornaments_1.jpg': 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80',
  'shop_ornaments_2.jpg': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80',
  'shop_accessories_1.jpg': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'shop_hardware_1.jpg': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80',
  'shop_generic.jpg': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',

  // Products - Clothing
  'kurti_1.jpg': 'https://images.unsplash.com/photo-1610030469983-be21b0af0423?w=600&q=80',
  'kurti_2.jpg': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
  'lehenga_1.jpg': 'https://images.unsplash.com/photo-1610030469983-be21b0af0423?w=600&q=80',
  'lehenga_2.jpg': 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80',
  'kurta_1.jpg': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
  'kurta_2.jpg': 'https://images.unsplash.com/photo-1610030469983-be21b0af0423?w=600&q=80',

  // Products - Shoes
  'sneakers_1.jpg': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  'sneakers_2.jpg': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
  'heels_1.jpg': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80',
  'heels_2.jpg': 'https://images.unsplash.com/photo-1596703730113-2876e4091cba?w=600&q=80',
  'school_shoes_1.jpg': 'https://images.unsplash.com/photo-1560769629-975ec94e516a?w=600&q=80',
  'school_shoes_2.jpg': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',

  // Products - Jewellery
  'necklace_1.jpg': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
  'necklace_2.jpg': 'https://images.unsplash.com/photo-1515562141-5a0952614d47?w=600&q=80',
  'anklets_1.jpg': 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80',
  'anklets_2.jpg': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80',
  'earrings_1.jpg': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
  'earrings_2.jpg': 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80',

  // Products - Accessories & Hardware
  'handbag_1.jpg': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
  'watch_1.jpg': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80',
  'drill_1.jpg': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
  'product_generic.jpg': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
};

function fetchFile(url, dest) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchFile(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          const size = fs.statSync(dest).size;
          console.log(`OK: ${path.basename(dest)} (${size} bytes)`);
          resolve(true);
        });
      } else {
        console.error(`FAIL [HTTP ${res.statusCode}]: ${path.basename(dest)}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.error(`ERROR: ${path.basename(dest)} - ${err.message}`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('Downloading realistic photo files...');
  for (const [filename, url] of Object.entries(photoSources)) {
    const dest = path.join(demoDir, filename);
    await fetchFile(url, dest);
  }
  console.log('Done downloading photos.');
}

run();
