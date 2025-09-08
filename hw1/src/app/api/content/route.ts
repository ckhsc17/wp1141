import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // 只允許讀取特定的檔案類型，提升安全性
    const allowedFiles = ['description.txt'];
    if (!allowedFiles.includes(filename)) {
      return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
    }

    // 從 /src/data 讀取檔案
    const filePath = path.join(process.cwd(), 'src', 'data', filename);
    const content = await readFile(filePath, 'utf-8');
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
