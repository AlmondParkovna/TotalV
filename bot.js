const { query, response } = require('express');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const fs = require('fs');
const { setTimeout } = require('timers/promises');
const fetch = require('node-fetch')
const { MongoClient } = require('mongodb')

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
console.log('Polling');

let database = new MongoClient(`mongodb+srv://admin:${process.env.MONGODB_TOKEN}@cluster0.z32dg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
database.connect()
const _db = database.db('main')
const collection = _db.collection('materials')
const admin_ids = [1412237494, 328674428];
let cycleworking = false

let materials = [
    ["Чёрный металл", "4,50-5,80 грн/кг"],
    ["Алюминий", "38-40 грн/кг"],
    ["Алюминий электр.", "50-60 грн/кг"],
    ["Медь", "280-300 грн/кг"],
    ["Латунь", "170-190 грн/кг"],
    ["Рад мед-лат (авто)", "155-175 грн/кг"],
    ["Нержавейка", "20-25 грн/кг"],
    ["Акк. авто", "18 грн/кг"],
    ["Акк. гель", "10 грн/кг"],
    ["Свинец", "30 грн/кг"],
    ["Цинк", "25 грн/кг"],
    ["Банка", "20 грн/кг"],
    ["Макулатура", "3,50-5,00 грн/кг"],
    ["Пэт бутылка", "5 грн/кг"],
    ["Полиэтилен", "10 грн/кг"],
    ["Стеклотара", "0,5 коп/шт — 1 грн/шт"]
];

let timeoutId
function waitForMsg(timeout, chatId) {
    return new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
            reject('Время ожидания истекло');
        }, timeout);

        bot.once('message', (res) => {
            if (res.chat.id === chatId) {
                clearTimeout(timeoutId);
                resolve(res);
            }
        });
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

bot.on('message', async (msg) => {
    console.log(msg.from.id)
    if (!admin_ids.includes(msg.from.id)) return;

    const chatId = msg.chat.id;
    if (msg.text === '/start') {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Изменить цены', callback_data: 'change_prices' }
                    ]
                ]
            }
        };

        bot.sendMessage(chatId, 'Выберите опцию ниже', options);
    }
});

async function updatedMat() {
	return await collection.find({}).toArray()
}
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    let editedMessage = null

    if (query.data === 'change_prices') {
        cycleworking = true
        while (cycleworking) {
            let updatedMaterials = await updatedMat()
            if (!cycleworking) break
            const message = updatedMaterials.map((doc, index) => {
                return `${index+1}. ${doc.name}: ${doc.price}`
            }).join('\n')

            if (!editedMessage) {
                bot.editMessageText(
                    'Введите номер материала для изменения и нажмите "Главное меню":\n' + message,
                    {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'Главное меню', callback_data: 'mainMenu' }
                                ]
                            ]
                        }
                    }
                );
            }
            editedMessage = null
            

            try {
                const userMsg = await waitForMsg(60000, chatId);
                if (!cycleworking) break
                if (isNaN(userMsg.text) || userMsg.text < 1 || userMsg.text > updatedMaterials.length) {
                    bot.deleteMessage(chatId, userMsg.message_id)
                    continue
                }
                bot.deleteMessage(chatId, userMsg.message_id)

                const materialIndex = parseInt(userMsg.text) - 1;
                const botNewPriceMsg = await bot.sendMessage(chatId, `Введите новую цену для "${materials[materialIndex][0]}".`);
                const priceMsg = await waitForMsg(60000, chatId);
                if (!cycleworking) break
                if (/^\d+(-\d+)?$/.test(priceMsg.text)) {
                    collection.updateOne(
                        { name: materials[materialIndex][0] },
                        {
                            $set: { price: `${priceMsg.text} грн/кг` }
                        }
                    )
                    bot.deleteMessage(chatId, priceMsg.message_id)
                    bot.deleteMessage(chatId, botNewPriceMsg.message_id)
                } else {
                    bot.deleteMessage(chatId, priceMsg.message_id)
                    bot.deleteMessage(chatId, botNewPriceMsg.message_id)
                    editedMessage = true
                    continue
                }
            } catch (error) {
                await bot.sendMessage(chatId, 'Время ожидания истекло. Попробуйте снова.');
                break;
            }
        }

        
    } else if (query.data === 'mainMenu') {
    	fetch('http://localhost:3000/updatedata', {
    		method: 'POST'
    	}).then(res => console.log(res.status))
        cycleworking = false
        clearTimeout(timeoutId)
        bot.editMessageText('Выберите опцию ниже', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Изменить цены', callback_data: 'change_prices' }
                    ]
                ]
            }
        });
    }
});
