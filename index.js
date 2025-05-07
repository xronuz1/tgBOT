const TelegramBot = require('node-telegram-bot-api');

const token = '8085331330:AAFNbYSKtSNBixryL0IT8gPu463-_IM1ylY';
const channelUsername = '@BY_SOLiYEV';

const bot = new TelegramBot(token, { polling: true });

const hazillar = [
    "Do‘stingizga telefon qilib, 'Seni yaxshi ko‘raman' deb ayting 😅",
    "Biror guruhga 'Men bugun yulduzman ⭐' deb yozing!",
    "Oilangizga sizni rostdan yaxshi ko‘rishingizni ayting ❤️",
    "Bitta tasodifiy raqamga sms yozing: 'Bugun omadli kuning!' 📲",
    "O‘zingiz haqida bir kulgili fakt yozing va menga yuboring 😂",
    "O‘qituvchingizga rahmat deb sms yozing va skrin yuboring!"
];

const jazolar = [
    "10 daqiqa telefonni o‘chirib qo‘ying 😐",
    "Do‘stingizga 'bugun meni kechiring' deb yozing",
    "Yaqin odamingizga kulib selfi tashlang va menga yuboring 🤳",
    "Bugun hech kimga dars haqida gapirmang 😂",
    "3 marta baland ovozda kuling va ovoz yozib yuboring",
    "Har bir do‘stingizga tabassum yuboring 😊"
];

const userLastAction = {};
const completedUsers = new Set();
const userCoins = {};

// Coin yangilash funksiyasi
function updateUserCoin(userId, change) {
    if (!userCoins[userId]) userCoins[userId] = 0;
    userCoins[userId] += change;
}

// Obuna tekshiradi
async function isUserSubscribed(userId) {
    try {
        const res = await bot.getChatMember(channelUsername, userId);
        return ['member', 'administrator', 'creator'].includes(res.status);
    } catch (err) {
        return false;
    }
}

// /start komandasi
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const subscribed = await isUserSubscribed(userId);

    if (!subscribed) {
        const joinButton = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📢 Kanalga obuna bo'lish", url: `https://t.me/${channelUsername.replace('@', '')}` }],
                    [{ text: "✅ Obuna bo‘ldim", callback_data: "check_sub" }]
                ]
            }
        };
        await bot.sendMessage(chatId, "Botdan foydalanish uchun kanalga obuna bo‘ling 👇", joinButton);
        return;
    }

    const menu = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎭 Hazil", callback_data: "hazil" }],
                [{ text: "😈 Jazo", callback_data: "jazo" }],
                [{ text: "💰 Coin hisobim", callback_data: "my_coins" }],
                [{ text: "🔄 Qayta boshlash", callback_data: "restart" }]
            ]
        }
    };

    await bot.sendMessage(chatId, `👋 Salom ${msg.from.first_name}, tanlang:`, menu);
});

// /coin komandasi
bot.onText(/\/coin/, (msg) => {
    const chatId = msg.chat.id;
    const coins = userCoins[chatId] || 0;
    bot.sendMessage(chatId, `💰 Sizda hozirda ${coins} coin bor.`);
});

// /help komandasi
bot.onText(/\/help/, (msg) => {
    const helpText = `
🤖 Botdan foydalanish:
• 🎭 Hazil yoki 😈 Jazo tanlang
• ✅ Bajarganingizda coin olasiz
• ❌ Bajarmasangiz, coin kamayadi
• 💰 Coin hisobingizni /coin orqali yoki "💰 Coin hisobim" tugmasi bilan bilib olasiz
⏱ Har 15 daqiqada 1 marta qatnashish mumkin
📢 Kanalga obuna bo‘lish shart!
`;
    bot.sendMessage(msg.chat.id, helpText);
});

// Callback'lar
bot.on('callback_query', async (query) => {
    const chatId = query.from.id;
    const data = query.data;

    if (data === "check_sub") {
        const subscribed = await isUserSubscribed(chatId);
        if (!subscribed) {
            return bot.sendMessage(chatId, "Hali ham obuna emassiz!");
        }
        return bot.sendMessage(chatId, "✅ Obuna tasdiqlandi! Endi tanlovda qatnashing.", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎭 Hazil", callback_data: "hazil" }],
                    [{ text: "😈 Jazo", callback_data: "jazo" }],
                    [{ text: "💰 Coin hisobim", callback_data: "my_coins" }],
                    [{ text: "🔄 Qayta boshlash", callback_data: "restart" }]
                ]
            }
        });
    }

    if (data === "hazil" || data === "jazo") {
        const now = Date.now();
        const lastAction = userLastAction[chatId] || 0;

        if (now - lastAction < 15 * 60 * 1000) {
            const mins = Math.ceil((15 * 60 * 1000 - (now - lastAction)) / 60000);
            return bot.sendMessage(chatId, `⏳ Iltimos, ${mins} daqiqadan so‘ng yana urinib ko‘ring.`);
        }

        userLastAction[chatId] = now;
        completedUsers.delete(chatId);

        const task = data === "hazil"
            ? hazillar[Math.floor(Math.random() * hazillar.length)]
            : jazolar[Math.floor(Math.random() * jazolar.length)];

        return bot.sendMessage(chatId, `🔔 Topshiriq:\n\n${task}`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Bajardim", callback_data: "done" }],
                    [{ text: "❌ Bajarmadim", callback_data: "not_done" }]
                ]
            }
        });
    }

    if (data === "done") {
        if (!completedUsers.has(chatId)) {
            completedUsers.add(chatId);
            updateUserCoin(chatId, 1);
            return bot.sendMessage(chatId, `✅ Barakalla! Sizga +1 coin berildi.\nJami: ${userCoins[chatId]} coin.`);
        } else {
            return bot.sendMessage(chatId, "⚠️ Siz allaqachon bu topshiriqni bajargansiz.");
        }
    }

    if (data === "not_done") {
        if (!completedUsers.has(chatId)) {
            completedUsers.add(chatId);
            updateUserCoin(chatId, -1);
            return bot.sendMessage(chatId, `😥 Afsus, sizga -1 coin.\nJami: ${userCoins[chatId]} coin.`);
        } else {
            return bot.sendMessage(chatId, "🤨 Hazil qilyapsizmi? Allaqachon javob bergansiz.");
        }
    }

    if (data === "my_coins") {
        const coins = userCoins[chatId] || 0;
        return bot.sendMessage(chatId, `💰 Sizda hozirda ${coins} coin mavjud.`);
    }

    if (data === "restart") {
        const menu = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🎭 Hazil", callback_data: "hazil" }],
                    [{ text: "😈 Jazo", callback_data: "jazo" }],
                    [{ text: "💰 Coin hisobim", callback_data: "my_coins" }],
                    [{ text: "🔄 Qayta boshlash", callback_data: "restart" }]
                ]
            }
        };
        return bot.sendMessage(chatId, "Qayta boshlash uchun tanlovni tanlang:", menu);
    }
});
