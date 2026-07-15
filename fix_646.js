const fs = require('fs');
const file = 'c:/Users/ACER/Desktop/bookingSystem/frontend/web/components/layout/Chatbot.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines[645] = '                              <p className="text-[10px] text-white/50">{show.theaterName} - {show.screenName}</p>';
fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed line 646');
