import sharp from 'sharp';

await Promise.all([
  sharp('assets/src/portability-test-bench.png').resize(720, 480, { fit: 'cover' }).avif({ quality: 52 }).toFile('public/assets/test-bench-720.avif'),
  sharp('assets/src/portability-test-bench.png').resize(1200, 800, { fit: 'cover' }).avif({ quality: 55 }).toFile('public/assets/test-bench-1200.avif'),
  sharp('assets/src/portability-test-bench.png').resize(720, 480, { fit: 'cover' }).webp({ quality: 78 }).toFile('public/assets/test-bench-720.webp'),
  sharp('assets/src/portability-test-bench.png').resize(1200, 800, { fit: 'cover' }).webp({ quality: 80 }).toFile('public/assets/test-bench-1200.webp'),
  sharp('assets/src/app-icon.svg').resize(192, 192).png().toFile('public/icon-192.png'),
  sharp('assets/src/app-icon.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png'),
  sharp('assets/src/app-icon.svg').resize(512, 512).png().toFile('public/icon-512.png'),
  sharp('assets/src/app-icon.svg').resize(512, 512).extend({ top: 48, bottom: 48, left: 48, right: 48, background: '#e6ddc8' }).resize(512, 512).png().toFile('public/icon-maskable-512.png'),
  sharp('assets/src/portability-test-bench.png')
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .composite([{ input: Buffer.from('<svg width="1200" height="630"><rect width="1200" height="630" fill="#283734" opacity="0.18"/><rect x="42" y="42" width="1116" height="546" fill="none" stroke="#F8F2E5" stroke-width="8"/></svg>') }])
    .png({ compressionLevel: 9, palette: true, quality: 88, effort: 10 })
    .toFile('public/assets/social-card.png'),
]);
