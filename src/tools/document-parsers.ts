/**
 * Document Parsers - PDF, spreadsheets, slides, OCR
 * Extract structured content from various document formats
 */

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';

export interface ParsedDocument {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    created?: Date;
    pages?: number;
    format: string;
  };
  pages?: Array<{
    pageNum: number;
    text: string;
    images?: string[];
    tables?: any[];
  }>;
  tables?: any[];
  images?: string[];
}

export class DocumentParsers {
  // Parse PDF
  async parsePDF(filePath: string, options: {
    extractImages?: boolean;
    extractTables?: boolean;
    ocr?: boolean;
  } = {}): Promise<ParsedDocument> {
    // Use pdftotext or pdfplumber
    const script = `
import pdfplumber
import json
import sys

with pdfplumber.open('${filePath}') as pdf:
    result = {
        'text': '',
        'metadata': {
            'pages': len(pdf.pages),
            'format': 'pdf'
        },
        'pages': []
    }
    
    for i, page in enumerate(pdf.pages):
        page_text = page.extract_text() or ''
        result['text'] += page_text + '\\n'
        
        page_data = {
            'pageNum': i + 1,
            'text': page_text,
            'tables': page.extract_tables() if ${options.extractTables ? 'True' : 'False'} else [],
        }
        result['pages'].append(page_data)
    
    # Extract metadata if available
    if pdf.metadata:
        result['metadata']['title'] = pdf.metadata.get('Title')
        result['metadata']['author'] = pdf.metadata.get('Author')

print(json.dumps(result, default=str))
`;

    return this.runPythonScript(script);
  }

  // Parse Word document
  async parseDOCX(filePath: string): Promise<ParsedDocument> {
    const script = `
from docx import Document
import json

doc = Document('${filePath}')

result = {
    'text': '\\n'.join([para.text for para in doc.paragraphs]),
    'metadata': {
        'format': 'docx'
    },
    'tables': []
}

# Extract tables
for table in doc.tables:
    table_data = []
    for row in table.rows:
        row_data = [cell.text for cell in row.cells]
        table_data.append(row_data)
    result['tables'].append(table_data)

# Extract core properties if available
try:
    result['metadata']['title'] = doc.core_properties.title
    result['metadata']['author'] = doc.core_properties.author
    result['metadata']['created'] = str(doc.core_properties.created) if doc.core_properties.created else None
except:
    pass

print(json.dumps(result, default=str))
`;

    return this.runPythonScript(script);
  }

  // Parse Excel/CSV
  async parseSpreadsheet(filePath: string, options: {
    sheet?: string | number;
    header?: boolean;
  } = {}): Promise<ParsedDocument> {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    if (ext === 'csv') {
      const script = `
import pandas as pd
import json

df = pd.read_csv('${filePath}')
result = {
    'text': df.to_string(),
    'metadata': {
        'format': 'csv',
        'rows': len(df),
        'columns': len(df.columns)
    },
    'tables': [df.to_dict(orient='records')]
}
print(json.dumps(result, default=str))
`;
      return this.runPythonScript(script);
    } else {
      // Excel
      const script = `
import pandas as pd
import json

sheet = ${typeof options.sheet === 'number' ? options.sheet : options.sheet ? `'${options.sheet}'` : '0'}
df = pd.read_excel('${filePath}', sheet_name=sheet)

result = {
    'text': df.to_string(),
    'metadata': {
        'format': 'excel',
        'rows': len(df),
        'columns': len(df.columns),
        'sheet': sheet
    },
    'tables': [df.to_dict(orient='records')]
}
print(json.dumps(result, default=str))
`;
      return this.runPythonScript(script);
    }
  }

  // Parse PowerPoint
  async parsePPTX(filePath: string): Promise<ParsedDocument> {
    const script = `
from pptx import Presentation
import json

prs = Presentation('${filePath}')

result = {
    'text': '',
    'metadata': {
        'format': 'pptx',
        'slides': len(prs.slides)
    },
    'pages': []
}

for i, slide in enumerate(prs.slides):
    slide_text = []
    for shape in slide.shapes:
        if hasattr(shape, 'text'):
            slide_text.append(shape.text)
    
    text = '\\n'.join(slide_text)
    result['text'] += f'\\n--- Slide {i+1} ---\\n{text}'
    result['pages'].append({
        'pageNum': i + 1,
        'text': text
    })

print(json.dumps(result, default=str))
`;

    return this.runPythonScript(script);
  }

  // Parse HTML
  async parseHTML(filePath: string): Promise<ParsedDocument> {
    const script = `
from bs4 import BeautifulSoup
import json

with open('${filePath}', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

# Remove script and style elements
for script in soup(['script', 'style']):
    script.decompose()

text = soup.get_text()
lines = (line.strip() for line in text.splitlines())
chunks = (phrase.strip() for line in lines for phrase in line.split('  '))
text = '\\n'.join(chunk for chunk in chunks if chunk)

result = {
    'text': text,
    'metadata': {
        'format': 'html',
        'title': soup.title.string if soup.title else None
    }
}

print(json.dumps(result, default=str))
`;

    return this.runPythonScript(script);
  }

  // OCR for images
  async parseImageOCR(filePath: string, options: {
    language?: string;
    dpi?: number;
  } = {}): Promise<ParsedDocument> {
    const lang = options.language || 'eng';
    const dpi = options.dpi || 300;

    return new Promise((resolve, reject) => {
      const proc = spawn('tesseract', [
        filePath,
        'stdout',
        '-l', lang,
      ]);

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `OCR failed with code ${code}`));
        } else {
          resolve({
            text: stdout.trim(),
            metadata: {
              format: 'image+ocr',
              language: lang,
            },
          });
        }
      });
    });
  }

  // Extract text from any document
  async extractText(filePath: string): Promise<string> {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'pdf':
        return (await this.parsePDF(filePath)).text;
      case 'docx':
        return (await this.parseDOCX(filePath)).text;
      case 'csv':
      case 'xlsx':
      case 'xls':
        return (await this.parseSpreadsheet(filePath)).text;
      case 'pptx':
        return (await this.parsePPTX(filePath)).text;
      case 'html':
      case 'htm':
        return (await this.parseHTML(filePath)).text;
      case 'txt':
      case 'md':
        return readFile(filePath, 'utf-8');
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return (await this.parseImageOCR(filePath)).text;
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  private async runPythonScript(script: string): Promise<ParsedDocument> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', script]);
      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => { stdout += data; });
      proc.stderr?.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr || `Script failed with code ${code}`));
        } else {
          try {
            resolve(JSON.parse(stdout.trim()));
          } catch (e) {
            reject(new Error(`Failed to parse result: ${e}`));
          }
        }
      });
    });
  }
}

export default DocumentParsers;
