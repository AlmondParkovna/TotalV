const { spawn } = require('child_process');

// Запуск первого файла (server.js)
const serverProcess = spawn('node', ['main.js'], { stdio: 'inherit' });

// Запуск второго файла (bot.js)
const botProcess = spawn('node', ['bot.js'], { stdio: 'inherit' });

// Обработка выхода процессов
serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});

botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
});
