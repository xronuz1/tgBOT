const TelegramBot = require('node-telegram-bot-api');

const token = '8085331330:AAFNbYSKtSNBixryL0IT8gPu463-_IM1ylY';
const channelUsername = '@BY_SOLiYEV';

const bot = new TelegramBot(token, { polling: true });

const hazillar = [
    "Sinfdoshlaringni biriga yaxshi ko'rishingni ayt🥰.",
    "Ota-onangizga sms orqali yaxshi ko'rishingizni aytip ekran suratini menga tashlang !",
    "Bitta tasodifiy raqamga telefon qilip 'Men bugun kasal xonadan qochdim' deb ayt 😁.",
    "Do'stlaringa 'Men bugun yangi ko'z oynak oldim' dep maqtan😎",
    "O'zing bir hazil o'ylap top va bajar😅"
];

const jazolar = [
    "Do‘stlaringizni har biriga musqaymoq olip bering.",
    "2 daqiqa tizzada turib o‘zingizga kuling.",
    "10 daqiqa telefonni o‘chirib qo‘ying va sukut saqlang.",
    "7 kun internetsiz yashang 😎",
    "2 kun telefonsiz yuring😉"
];

const userLastAction = {};
const completedUsers = new Set();
const userCoins = {}; // Coinlar saqlanadi

function updateUserCoin(userId, change) {
    if (!userCoins[userId]) userCoins[userId] = 0;
    userCoins[userId] += change;
}

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
        await bot.sendMessage(chatId, "Botdan foydalanish uchun avval kanalga obuna bo‘ling 👇", joinButton);
        return;
    }

    startChallenge(chatId);
});

// Tanlovni boshlash funksiyasi
function startChallenge(chatId) {
    const now = Date.now();
    const lastAction = userLastAction[chatId] || 0;
    const diff = now - lastAction;

    if (diff < 2 * 60 * 60 * 1000) {
        const minsLeft = Math.ceil((1 * 6 * 6 * 100 - diff) / 30000);
        bot.sendMessage(chatId, `Kechirasiz, siz ${minsLeft} daqiqadan keyin qayta qatnasha olasiz.`);
        return;
    }

    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Hazil tanlayman", callback_data: "hazil" }],
                [{ text: "Jazo tanlayman", callback_data: "jazo" }],
                [{ text: "📊 Coin hisobim", callback_data: "my_coins" }]
            ]
        }
    };
    bot.sendMessage(chatId, "Tanlovni tanlang:", options);
}

// Callbacklarni boshqarish
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (data === "check_sub") {
        const subscribed = await isUserSubscribed(chatId);
        if (!subscribed) {
            bot.sendMessage(chatId, "Siz hali kanalga obuna bo‘lmagansiz. Iltimos, obuna bo‘ling va keyin yana urinib ko‘ring.");
            return;
        }
        startChallenge(chatId);
    }

    if (data === "hazil" || data === "jazo") {
        const now = Date.now();
        const lastAction = userLastAction[chatId] || 0;

        if (now - lastAction < 1 * 6 * 6 * 100) {
            bot.sendMessage(chatId, "Keyingi tanlov uchun bir oz kuting :)");
            return;
        }

        userLastAction[chatId] = now;
        completedUsers.delete(chatId);

        const task = data === "hazil"
            ? hazillar[Math.floor(Math.random() * hazillar.length)]
            : jazolar[Math.floor(Math.random() * jazolar.length)];

        const followUpOptions = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Bajardim", callback_data: "done" }],
                    [{ text: "❌ Bajarmadim", callback_data: "not_done" }]
                ]
            }
        };

        bot.sendMessage(chatId, `Topshiriq:\n${task}`, followUpOptions);
    } else if (data === "done") {
        if (!completedUsers.has(chatId)) {
            completedUsers.add(chatId);
            updateUserCoin(chatId, 1);
            bot.sendMessage(chatId, `Barakalla!👏 Sizga +1 coin qo‘shildi. Jami: ${userCoins[chatId]} coin.`);
        } else {
            bot.sendMessage(chatId, "Siz allaqachon bajardim tugmasini bosgansiz.");
        }
    } else if (data === "not_done") {
        if (!completedUsers.has(chatId)) {
            completedUsers.add(chatId);
            updateUserCoin(chatId, -1);
            bot.sendMessage(chatId, `Ex, Sizdan -1 coin ayrildi. Jami: ${userCoins[chatId]} coin.`);
        } else {
            bot.sendMessage(chatId, "Nima hazil qilyapsizmi?");
        }
    } else if (data === "my_coins") {
        const coins = userCoins[chatId] || 0;
        bot.sendMessage(chatId, `💰 Sizda hozirda ${coins} coin mavjud.`);
    }
});
