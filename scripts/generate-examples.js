// scripts/generate-examples.js

const fs = require('fs');
const path = require('path');

const mockDataPath = path.resolve(__dirname, '../src/components/ide/mockData');
const outputPath = path.resolve(__dirname, '../src/generated-examples.js');

const files = fs.readdirSync(mockDataPath);

const jsonExamples = [];

files.forEach(file => {
    if (path.extname(file) === '.json') {
        const filePath = path.join(mockDataPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        jsonExamples.push({
            name: file,
            type: 'json',
            code: content,
        });
    }
});

const outputContent = `// 이 파일은 스크립트에 의해 자동으로 생성되었습니다. 직접 수정하지 마세요.\nexport const jsonExamples = ${JSON.stringify(jsonExamples, null, 2)};`;

fs.writeFileSync(outputPath, outputContent);

console.log('✅ JSON 예제 파일이 성공적으로 생성되었습니다.');