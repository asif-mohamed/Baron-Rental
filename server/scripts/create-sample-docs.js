/**
 * Create Sample Customer Documents
 * Generates placeholder PDF-like files for testing download functionality
 */

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads/customers');

// Ensure directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Sample document content (text that simulates PDF structure)
const createSamplePDF = (title, content) => {
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
50 700 Td
(${title}) Tj
0 -20 Td
(${content}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
422
%%EOF`;
};

// Create sample documents
const documents = [
  {
    filename: 'sample-id-1.pdf',
    title: 'National ID - Ahmed Mohammed Al-Saeed',
    content: 'ID Number: 1234567890 | Issue Date: 2020-01-15 | Expiry: 2030-01-15'
  },
  {
    filename: 'sample-fingerprint-1.pdf',
    title: 'Fingerprint Document - Ahmed Mohammed Al-Saeed',
    content: 'Fingerprint verification completed on 2024-11-01'
  },
  {
    filename: 'sample-contract-1.pdf',
    title: 'Rental Contract - Ahmed Mohammed Al-Saeed',
    content: 'Contract Date: 2024-11-10 | Vehicle: Toyota Camry | Duration: 7 days'
  },
  {
    filename: 'sample-id-2.pdf',
    title: 'National ID - Fatima Ali Al-Zahrani',
    content: 'ID Number: 9876543210 | Issue Date: 2019-06-20 | Expiry: 2029-06-20'
  },
  {
    filename: 'sample-fingerprint-2.pdf',
    title: 'Fingerprint Document - Fatima Ali Al-Zahrani',
    content: 'Fingerprint verification completed on 2024-10-28'
  },
  {
    filename: 'sample-contract-3.pdf',
    title: 'Rental Contract - Khaled Abdullah Al-Nimer',
    content: 'Contract Date: 2024-11-05 | Vehicle: Hyundai Tucson | Duration: 10 days'
  }
];

console.log('📄 Creating sample customer documents...\n');

documents.forEach(doc => {
  const filePath = path.join(uploadsDir, doc.filename);
  const content = createSamplePDF(doc.title, doc.content);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Created: ${doc.filename}`);
});

console.log('\n🎉 Sample documents created successfully!');
console.log(`📁 Location: ${uploadsDir}`);
