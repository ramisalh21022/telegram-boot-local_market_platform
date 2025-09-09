const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = process.env.TELEGRAM_TOKEN;
const API_URL = process.env.API_URL;                  
const PORT = process.env.PORT || 5000;
const EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

const bot = new TelegramBot(TOKEN, { polling: false });

const app = express();
app.use(bodyParser.json());

// Webhook endpoint
app.post(`/webhook/${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// التعامل مع الرسائل
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const keyword = msg.text?.trim();

    if (!keyword) return bot.sendMessage(chatId, "أرسل كلمة للبحث 🔍 مثال: سكر");

    try {
        const response = await axios.get(`${API_URL}/products/search?keyword=${encodeURIComponent(keyword)}`);
        const products = response.data;

        if (products.length === 0) {
            return bot.sendMessage(chatId, `🚫 لا يوجد نتائج لكلمة: ${keyword}`);
        }

        // إرسال كل منتج كرسالة مستقلة
        for (const product of products) {
            const caption = `🛒 *${product.product_name}*\n📦 ${product.category}\n💵 ${product.price} ل.س`;

            const inlineKeyboard = [[{
                text: `اطلب الآن`,
                callback_data: `order_${product.id}`
            }]];

            if (product.image_url) {
                await bot.sendPhoto(chatId, product.image_url, {
                    caption,
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: inlineKeyboard }
                });
            } else {
                await bot.sendMessage(chatId, caption, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: inlineKeyboard }
                });
            }
        }

    } catch (err) {
        console.error("Bot Axios error:", err.response?.data || err.message);
        bot.sendMessage(chatId, "⚠️ حدث خطأ في البحث، حاول لاحقًا.");
    }
});

// التعامل مع أزرار اختيار المستخدم
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;

    if (data.startsWith('order_')) {
        const productId = data.split('_')[1];
        await bot.sendMessage(msg.chat.id, `✅ تم اختيار المنتج رقم ${productId} للطلب. سيتم التواصل لاحقًا.`);
        bot.answerCallbackQuery(callbackQuery.id); // لإغلاق الانتظار على الزر
    }
});

// تشغيل السيرفر وضبط Webhook
app.listen(PORT, async () => {
    console.log(`Bot Server running on port ${PORT}`);
    try {
        const webhookUrl = `${EXTERNAL_URL}/webhook/${TOKEN}`;
        await bot.setWebHook(webhookUrl);
        console.log(`✅ Webhook set to: ${webhookUrl}`);
    } catch (err) {
        console.error("❌ Error setting webhook:", err.message);
    }
});
