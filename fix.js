const fs = require('fs');
const file = 'c:/Users/ACER/Desktop/bookingSystem/frontend/web/components/layout/Chatbot.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.splice(523, 3, 
  '                <span className="text-[10px] text-emerald-400 flex items-center gap-1">',
  '                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>',
  '                  {CHATBOT_TEXT.headerStatus}',
  '                </span>'
);
fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed');
