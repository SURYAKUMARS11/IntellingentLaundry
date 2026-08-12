import fs from 'fs';
import path from 'path';

const checkImages = () => {
  const logoJpgPath = path.join(process.cwd(), '../frontend/public/logo.jpg');
  const logoPngPath = path.join(process.cwd(), '../frontend/public/logo.png');

  console.log('logo.jpg exists:', fs.existsSync(logoJpgPath));
  console.log('logo.png exists:', fs.existsSync(logoPngPath));

  if (fs.existsSync(logoPngPath)) {
    const header = fs.readFileSync(logoPngPath).subarray(0, 8);
    console.log('logo.png header hex:', header.toString('hex'));
    // Valid PNG header starts with 89504e470d0a1a0a (\x89PNG\r\n\x1a\n)
    const isTruePng = header.toString('hex') === '89504e470d0a1a0a';
    console.log('Is valid PNG format:', isTruePng);
  }
};

checkImages();
