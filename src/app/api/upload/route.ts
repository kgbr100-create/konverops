import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slugRaw = (formData.get('slug') as string) || 'uploads';
    const slug = slugRaw.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const ext = path.extname(file.name) || '.png';
    const baseName = path.basename(file.name, ext).replace(/[^a-z0-9_-]/gi, '-');
    const timestamp = Date.now();
    const finalFilename = `${baseName}-${timestamp}${ext}`;

    const targetDir = path.join(process.cwd(), 'public', 'banners', slug);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, finalFilename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/banners/${slug}/${finalFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: finalFilename,
    });
  } catch (error) {
    console.error('Error uploading banner image:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao processar upload da imagem.' },
      { status: 500 }
    );
  }
}
