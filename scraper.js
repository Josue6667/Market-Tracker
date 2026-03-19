const axios = require('axios');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

// Configuración desde variables de entorno de GitHub
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(TOKEN);

const HISTORY_FILE = 'history.json';
const KEYWORD = 'seiko 5';

async function run() {
    // 1. Cargar historial
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE));
    }

    try {
        // 2. Llamada a la API de Wallapop (Búsqueda por palabra clave)
        // Usamos el endpoint de búsqueda oficial con los parámetros necesarios
        const url = `https://api.wallapop.com/api/v3/general/search?keywords=${encodeURIComponent(KEYWORD)}&filters_source=search_box&order_by=newest`;
        
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // Evita bloqueos básicos
        });

        const items = response.data.search_objects || [];
        let newItemsFound = false;

        for (const item of items) {
            // Si el ID no está en el historial, es nuevo
            if (!history.includes(item.id)) {
                newItemsFound = true;
                history.push(item.id);

                const message = `⌚ *¡Nuevo Seiko 5!*\n\n` +
                                `💰 Precio: ${item.price.amount} ${item.price.currency}\n` +
                                `📝 ${item.title}\n` +
                                `🔗 [Ver en Wallapop](https://es.wallapop.com/item/${item.web_slug})`;

                await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
                console.log(`Notificación enviada para: ${item.title}`);
            }
        }

        // 3. Guardar historial actualizado (máximo 200 IDs para no saturar)
        if (newItemsFound) {
            const updatedHistory = history.slice(-200); 
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(updatedHistory));
        } else {
            console.log("No hay novedades.");
        }

    } catch (error) {
        console.error('Error en la búsqueda:', error.message);
    }
}

run();